<?php

namespace Database\Seeders;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $tenant = Tenant::create(['name' => 'Demo Tenant']);

        User::create([
            'tenant_id' => $tenant->id,
            'is_owner' => true,
            'is_admin' => false,
            'name' => 'Demo User',
            'email' => 'owner@rbm.local',
            'password' => Hash::make('Owner!12345'),
        ]);

        User::create([
            'tenant_id' => null,
            'is_owner' => false,
            'is_admin' => true,
            'name' => 'Platform Admin',
            'email' => 'admin@rbm.local',
            'password' => Hash::make('Admin!12345'),
        ]);
    }
}
