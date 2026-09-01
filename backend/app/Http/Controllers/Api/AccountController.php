<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FileUpload;
use App\Support\FileUploadService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/**
 * Every signed-in user's own profile and password — deliberately separate
 * from AdminSettingController (platform-wide config an admin sets for
 * everyone). Not gated by is-admin or is-owner: an admin, an owner, and a
 * team member can all view/edit their own account.
 */
class AccountController extends Controller
{
    public function show(Request $request)
    {
        return response()->json(['data' => $this->accountPayload($request->user())]);
    }

    public function update(Request $request, FileUploadService $fileUploadService)
    {
        $user = $request->user();

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', Rule::unique('users', 'email')->ignore($user->id)],
            'country_code' => ['nullable', 'string', 'max:5'],
            'phone' => [
                'nullable',
                'string',
                'max:20',
                Rule::unique('users', 'phone')->ignore($user->id)->where(
                    fn ($query) => $query->where('country_code', $request->input('country_code')),
                ),
            ],
            // svg deliberately excluded — see AdminSettingController's
            // general-branding uploads for why (stored on the public
            // disk, an SVG could carry an embedded <script>).
            'avatar' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ]);

        $user->fill([
            'name' => $data['name'],
            'email' => $data['email'],
            'country_code' => $data['country_code'] ?? null,
            'phone' => $data['phone'] ?? null,
        ]);

        if ($request->hasFile('avatar')) {
            $old = $user->avatar_file_id ? FileUpload::find($user->avatar_file_id) : null;

            $new = $fileUploadService->replace(
                $old,
                $request->file('avatar'),
                'account_avatar',
                'avatar',
                'public',
                $user->id,
                $user->tenant_id,
            );

            $user->avatar_file_id = $new->id;
        }

        $user->save();

        return response()->json(['data' => $this->accountPayload($user->fresh())]);
    }

    public function updatePassword(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'current_password' => ['required', 'string'],
            'new_password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        if (! Hash::check($data['current_password'], $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['The current password is incorrect.'],
            ]);
        }

        $user->password = Hash::make($data['new_password']);
        $user->save();

        // Sign out every other session — the same "changing your password
        // invalidates existing tokens" rule already applied to the
        // forgot-password reset flow (AuthController::resetPassword).
        $user->tokens()->where('id', '!=', $request->user()->currentAccessToken()->id)->delete();

        return response()->json(['status' => 'ok']);
    }

    private function accountPayload($user): array
    {
        return [
            'name' => $user->name,
            'email' => $user->email,
            'country_code' => $user->country_code,
            'phone' => $user->phone,
            'avatar_url' => $user->avatar_url,
            'is_owner' => (bool) $user->is_owner,
            'is_admin' => (bool) $user->is_admin,
        ];
    }
}
