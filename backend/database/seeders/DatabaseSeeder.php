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

        $demoUser = new User([
            'name' => 'Demo User',
            'email' => 'owner@rbm.local',
            'password' => Hash::make('Owner!12345'),
        ]);
        $demoUser->tenant_id = $tenant->id;
        $demoUser->is_owner = true;
        $demoUser->is_admin = false;
        $demoUser->save();

        $admin = new User([
            'name' => 'Platform Admin',
            'email' => 'admin@rbm.local',
            'password' => Hash::make('Admin!12345'),
        ]);
        $admin->tenant_id = null;
        $admin->is_owner = false;
        $admin->is_admin = true;
        $admin->save();

        $teamMember = new User([
            'name' => 'Team Member',
            'email' => 'team@rbm.local',
            'password' => Hash::make('Team!12345'),
        ]);
        $teamMember->tenant_id = $tenant->id;
        $teamMember->is_owner = false;
        $teamMember->is_admin = false;
        $teamMember->save();
    }
}
