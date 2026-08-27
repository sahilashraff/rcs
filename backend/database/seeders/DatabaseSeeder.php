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
            'name' => 'Demo Owner',
            'email' => 'owner@rbm.local',
            'password' => Hash::make('Owner!12345'),
        ]);
    }
}
