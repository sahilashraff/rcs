<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('country_code')->nullable()->after('email');
            $table->string('phone')->nullable()->after('country_code');
            $table->timestamp('phone_verified_at')->nullable()->after('phone');
            $table->string('otp_code')->nullable()->after('phone_verified_at');
            $table->timestamp('otp_expires_at')->nullable()->after('otp_code');
            $table->unsignedTinyInteger('otp_attempts')->default(0)->after('otp_expires_at');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'country_code',
                'phone',
                'phone_verified_at',
                'otp_code',
                'otp_expires_at',
                'otp_attempts',
            ]);
        });
    }
};
