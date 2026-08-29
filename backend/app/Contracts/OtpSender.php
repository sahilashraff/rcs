<?php

namespace App\Contracts;

use App\Models\User;

interface OtpSender
{
    public function send(User $user, string $code): void;
}
