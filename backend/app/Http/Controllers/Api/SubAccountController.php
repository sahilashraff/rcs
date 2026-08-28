<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class SubAccountController extends Controller
{
    public function index(Request $request)
    {
        $subAccounts = User::where('tenant_id', $request->user()->tenant_id)
            ->where('is_owner', false)
            ->get(['id', 'name', 'email']);

        $subAccounts->each(function (User $user) {
            $user->permissions = DB::table('sub_account_permissions')
                ->where('user_id', $user->id)
                ->pluck('feature_key');
        });

        return response()->json(['data' => $subAccounts]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
        ]);

        $user = new User([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
        ]);
        $user->tenant_id = $request->user()->tenant_id;
        $user->is_owner = false;
        $user->save();

        return response()->json(['data' => ['id' => $user->id, 'name' => $user->name, 'email' => $user->email]], 201);
    }

    public function updatePermissions(Request $request, User $user)
    {
        abort_if($user->tenant_id !== $request->user()->tenant_id, 404);

        $data = $request->validate([
            'feature_keys' => ['array'],
            'feature_keys.*' => ['string'],
        ]);

        DB::table('sub_account_permissions')->where('user_id', $user->id)->delete();

        $rows = array_map(fn ($key) => [
            'user_id' => $user->id,
            'feature_key' => $key,
            'created_at' => now(),
            'updated_at' => now(),
        ], $data['feature_keys'] ?? []);

        if ($rows) {
            DB::table('sub_account_permissions')->insert($rows);
        }

        return response()->json(['data' => ['feature_keys' => $data['feature_keys'] ?? []]]);
    }
}
