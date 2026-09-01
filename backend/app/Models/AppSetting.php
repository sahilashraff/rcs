<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class AppSetting extends Model
{
    protected $table = 'settings';
    protected $primaryKey = 'key';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = ['key', 'value'];

    /**
     * Settings are read far more often than written — every request that
     * touches OTP rules, branding, or any future category ends up calling
     * get(). Cache indefinitely, keyed per setting, and bust only the one
     * key a write actually changes — so adding new settings categories
     * never means adding new cache plumbing.
     */
    public static function get(string $key, mixed $default = null): mixed
    {
        $value = Cache::rememberForever(
            self::cacheKey($key),
            fn () => static::query()->where('key', $key)->value('value'),
        );

        return $value ?? $default;
    }

    public static function set(string $key, mixed $value): void
    {
        static::query()->updateOrCreate(['key' => $key], ['value' => $value]);
        Cache::forget(self::cacheKey($key));
    }

    private static function cacheKey(string $key): string
    {
        return "setting:{$key}";
    }
}
