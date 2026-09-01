<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class TenantController extends Controller
{
    public function index()
    {
        return response()->json(['data' => Tenant::query()->get(['id', 'name', 'max_storage_mb'])]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'owner_name' => ['required', 'string', 'max:255'],
            'owner_email' => ['required', 'email', 'unique:users,email'],
            'owner_country_code' => ['nullable', 'string', 'max:5'],
            'owner_phone' => [
                'nullable',
                'string',
                'max:20',
                Rule::unique('users', 'phone')->where(
                    fn ($query) => $query->where('country_code', $request->input('owner_country_code')),
                ),
            ],
            'owner_password' => ['required', 'string', 'min:8'],
        ]);

        $user = Tenant::createWithOwner($data['name'], [
            'name' => $data['owner_name'],
            'email' => $data['owner_email'],
            'country_code' => $data['owner_country_code'] ?? null,
            'phone' => $data['owner_phone'] ?? null,
            'password' => Hash::make($data['owner_password']),
            'phone_verified_at' => now(), // admin-provisioned accounts are pre-verified
        ]);

        return response()->json([
            'data' => [
                'tenant' => ['id' => $user->tenant_id, 'name' => $data['name']],
                'user' => ['id' => $user->id, 'name' => $user->name, 'email' => $user->email],
            ],
        ], 201);
    }

    public function updateStorage(Request $request, Tenant $tenant)
    {
        $data = $request->validate([
            'max_storage_mb' => ['required', 'integer', 'min:1'],
        ]);

        $tenant->update($data);

        return response()->json(['data' => $tenant->only('id', 'name', 'max_storage_mb')]);
    }

    public function sendResetLink(Tenant $tenant)
    {
        $owner = $tenant->owner;

        if (! $owner) {
            throw ValidationException::withMessages([
                'tenant' => ['This tenant has no owner to send a reset link to.'],
            ]);
        }

        Password::sendResetLink(['email' => $owner->email]);

        return response()->json(['status' => 'ok']);
    }
}

