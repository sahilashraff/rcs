<?php

namespace App\Models;

use App\Notifications\ResetPasswordNotification;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'country_code',
        'phone',
        'password',
        'avatar_file_id',
    ];

    protected $appends = ['avatar_url'];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'phone_verified_at' => 'datetime',
            'otp_expires_at' => 'datetime',
            'password' => 'hashed',
            'is_owner' => 'boolean',
            'is_admin' => 'boolean',
        ];
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function avatarFile(): BelongsTo
    {
        return $this->belongsTo(FileUpload::class, 'avatar_file_id');
    }

    protected function avatarUrl(): Attribute
    {
        return Attribute::get(fn () => $this->avatarFile?->url);
    }

    public function sendPasswordResetNotification($token): void
    {
        $url = rtrim(config('app.frontend_url'), '/') . '/reset-password?token=' . $token . '&email=' . urlencode($this->email);

        $this->notify(new ResetPasswordNotification($url));
    }
}
