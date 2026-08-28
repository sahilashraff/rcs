<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Support\FeatureAccess;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
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

        $token = $user->createToken('spa')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => $this->userPayload($user),
        ]);
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
     * @return array{userId: string, userName: string, authority: string[], avatar: string, email: string}
     */
    private function userPayload(User $user): array
    {
        return [
            'userId' => (string) $user->id,
            'userName' => $user->name,
            'authority' => FeatureAccess::grantedKeys($user),
            'avatar' => '',
            'email' => $user->email,
        ];
    }
}
