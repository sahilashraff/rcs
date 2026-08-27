<?php

namespace App\Providers;

use App\Models\User;
use App\Support\FeatureAccess;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        Gate::define('access-feature', fn (User $user, string $key) => FeatureAccess::allows($user, $key));
    }
}
