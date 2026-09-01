<?php

namespace App\Http\Controllers\Api;

use App\Contracts\OtpSender;
use App\Http\Controllers\Controller;
use App\Models\AppSetting;
use App\Models\Tenant;
use App\Models\User;
use App\Support\FeatureAccess;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function signIn(Request $request)
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', $credentials['email'])->first();

        if (! $user || ! Hash::check($credentials['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['These credentials do not match our records.'],
            ]);
        }

        if (
            ! $user->is_admin
            && ! $user->phone_verified_at
            && filter_var(AppSetting::get('otp_verification_enabled', '0'), FILTER_VALIDATE_BOOLEAN)
        ) {
            $this->issueOtp($user);

            return response()->json([
                'requiresVerification' => true,
                'userId' => $user->id,
            ]);
        }

        $token = $user->createToken('spa')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => $this->userPayload($user),
        ]);
    }

    public function signUp(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users,email'],
            'country_code' => ['required', 'string', 'max:5'],
            'phone' => [
                'required',
                'string',
                'max:20',
                Rule::unique('users')->where(fn ($query) => $query->where('country_code', $request->input('country_code'))),
            ],
            'password' => ['required', 'string', 'min:8'],
        ]);

        $user = Tenant::createWithOwner("{$data['name']}'s Account", [
            'name' => $data['name'],
            'email' => $data['email'],
            'country_code' => $data['country_code'],
            'phone' => $data['phone'],
            'password' => Hash::make($data['password']),
        ]);

        if (! filter_var(AppSetting::get('otp_verification_enabled', '0'), FILTER_VALIDATE_BOOLEAN)) {
            $token = $user->createToken('spa')->plainTextToken;

            return response()->json([
                'token' => $token,
                'user' => $this->userPayload($user),
            ]);
        }

        $this->issueOtp($user);

        return response()->json([
            'requiresVerification' => true,
            'userId' => $user->id,
        ]);
    }

    public function verifyOtp(Request $request)
    {
        $data = $request->validate([
            'userId' => ['required', 'integer', 'exists:users,id'],
            'code' => ['required', 'string'],
        ]);

        $user = User::findOrFail($data['userId']);

        if ($user->phone_verified_at) {
            throw ValidationException::withMessages([
                'code' => ['This account is already verified.'],
            ]);
        }

        if (! $user->otp_code || ! $user->otp_expires_at || $user->otp_expires_at->isPast()) {
            throw ValidationException::withMessages([
                'code' => ['This code has expired. Request a new one.'],
            ]);
        }

        if (! hash_equals((string) $user->otp_code, $data['code'])) {
            $user->otp_attempts++;

            if ($user->otp_attempts >= 5) {
                $user->otp_code = null;
                $user->save();

                throw ValidationException::withMessages([
                    'code' => ['Too many incorrect attempts. Request a new code.'],
                ]);
            }

            $user->save();

            throw ValidationException::withMessages([
                'code' => ['Incorrect code.'],
            ]);
        }

        $user->phone_verified_at = now();
        $user->otp_code = null;
        $user->otp_expires_at = null;
        $user->otp_attempts = 0;
        $user->save();

        $token = $user->createToken('spa')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => $this->userPayload($user),
        ]);
    }

    public function resendOtp(Request $request)
    {
        $data = $request->validate([
            'userId' => ['required', 'integer', 'exists:users,id'],
        ]);

        $user = User::findOrFail($data['userId']);

        if ($user->phone_verified_at) {
            throw ValidationException::withMessages([
                'code' => ['This account is already verified.'],
            ]);
        }

        if (! $user->otp_expires_at) {
            throw ValidationException::withMessages([
                'userId' => ['No verification is pending for this account.'],
            ]);
        }

        $issuedAt = $user->otp_expires_at?->copy()->subMinutes(10);

        if ($issuedAt && $issuedAt->addSeconds(30)->isFuture()) {
            throw ValidationException::withMessages([
                'code' => ['Please wait a few seconds before requesting another code.'],
            ]);
        }

        $this->issueOtp($user);

        return response()->json(['status' => 'sent']);
    }

    private function issueOtp(User $user): void
    {
        $code = (string) random_int(100000, 999999);
        $user->otp_code = $code;
        $user->otp_expires_at = now()->addMinutes(10);
        $user->otp_attempts = 0;
        $user->save();

        app(OtpSender::class)->send($user, $code);
    }

    public function forgotPassword(Request $request)
    {
        $request->validate(['email' => ['required', 'email']]);

        Password::sendResetLink($request->only('email'));

        return response()->json(['status' => 'ok']);
    }

    public function resetPassword(Request $request)
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'token' => ['required', 'string'],
            'password' => ['required', 'string', 'min:8'],
        ]);

        $status = Password::reset(
            $data,
            function (User $user, string $password) {
                $user->password = Hash::make($password);
                $user->save();
                $user->tokens()->delete();
            }
        );

        if ($status !== Password::PASSWORD_RESET) {
            throw ValidationException::withMessages([
                'email' => [__($status)],
            ]);
        }

        return response()->json(['status' => 'ok']);
    }

    public function signOut(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['status' => 'ok']);
    }

    /**
     * Returns the current user's authority freshly computed from the
     * database — the frontend calls this on app boot so a permission
     * change an Owner makes takes effect without the affected user
     * needing to sign out and back in. This is the same payload shape
     * signIn() returns, built by the same helper below, so the two
     * response bodies can never drift apart.
     */
    public function me(Request $request)
    {
        return response()->json(['user' => $this->userPayload($request->user())]);
    }

    /**
     * @return array{userId: string, userName: string, authority: string[], avatar: string, email: string, isAdmin: bool, isUnlocked: bool}
     */
    private function userPayload(User $user): array
    {
        return [
            'userId' => (string) $user->id,
            'userName' => $user->name,
            'authority' => FeatureAccess::grantedKeys($user),
            'avatar' => '',
            'email' => $user->email,
            'isAdmin' => (bool) $user->is_admin,
            'isUnlocked' => (bool) $user->is_admin
                || in_array($user->tenant?->derivedStatus(), ['live', 'partially_live'], true),
        ];
    }
}
