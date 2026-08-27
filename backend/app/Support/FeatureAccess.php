<?php

namespace App\Support;

use App\Models\User;
use Illuminate\Support\Facades\DB;

class FeatureAccess
{
    /**
     * All feature keys this user is currently granted — public features,
     * plus explicit grants, plus everything if the user is an Owner.
     *
     * @return string[]
     */
    public static function grantedKeys(User $user): array
    {
        $registry = config('features');

        if ($user->is_owner) {
            return array_column($registry, 'key');
        }

        $granted = DB::table('sub_account_permissions')
            ->where('user_id', $user->id)
            ->pluck('feature_key')
            ->all();

        $publicKeys = array_column(array_filter($registry, fn ($f) => $f['public']), 'key');

        return array_values(array_unique([...$publicKeys, ...$granted]));
    }

    public static function allows(User $user, string $key): bool
    {
        return in_array($key, self::grantedKeys($user), true);
    }
}
