<?php

namespace Database\Seeders;

use App\Models\Agent;
use App\Models\Carrier;
use App\Models\Setting;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $tenant = Tenant::create([
            'name' => 'Demo Tenant',
            'brand_name' => 'Demo Support',
            'description' => 'Demo tenant seeded for local development.',
        ]);

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

        foreach ([
            ['code' => 'jio', 'name' => 'Jio', 'country' => 'IN'],
            ['code' => 'vi', 'name' => 'Vi', 'country' => 'IN'],
            ['code' => 'airtel', 'name' => 'Airtel', 'country' => 'IN'],
        ] as $carrier) {
            Carrier::create($carrier);
        }

        Setting::set('otp_verification_enabled', '0');

        Agent::create([
            'tenant_id' => $tenant->id,
            'carrier_id' => Carrier::where('code', 'jio')->first()->id,
            'os' => 'android',
            'status' => 'live',
        ]);

        $lockedTenant = Tenant::create(['name' => "Locked Demo's Account"]);

        $lockedUser = new User([
            'name' => 'Locked Demo User',
            'email' => 'locked@rbm.local',
            'password' => Hash::make('Locked!12345'),
        ]);
        $lockedUser->tenant_id = $lockedTenant->id;
        $lockedUser->is_owner = true;
        $lockedUser->is_admin = false;
        $lockedUser->save();
    }
}
