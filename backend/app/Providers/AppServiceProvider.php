<?php

namespace App\Providers;

use App\Contracts\OtpSender;
use App\Models\User;
use App\Support\FeatureAccess;
use App\Support\LogOtpSender;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(OtpSender::class, LogOtpSender::class);
    }

    public function boot(): void
    {
        Gate::define('access-feature', fn (User $user, string $key) => FeatureAccess::allows($user, $key));
    }
}
