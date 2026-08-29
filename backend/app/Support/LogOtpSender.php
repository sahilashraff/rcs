<?php

namespace App\Support;

use App\Contracts\OtpSender;
use App\Models\User;
use Illuminate\Support\Facades\Log;

class LogOtpSender implements OtpSender
{
    /**
     * Writes the code to the application log instead of actually
     * sending it — real WhatsApp Business API integration is a future
     * swap-in point (a WhatsAppOtpSender implementing the same
     * interface), once credentials exist. Nothing else in the system
     * needs to change when that happens.
     */
    public function send(User $user, string $code): void
    {
        Log::info("OTP for user #{$user->id} ({$user->country_code}{$user->phone}): {$code}");
    }
}
