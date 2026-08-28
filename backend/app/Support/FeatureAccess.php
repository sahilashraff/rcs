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

        // Owner-only features (e.g. Team/sub-account management) can never
        // be held by a sub-account, even if a stale grant row exists —
        // filtered here so this is the one place that rule is enforced.
        $ownerOnlyKeys = array_column(array_filter($registry, fn ($f) => $f['owner_only'] ?? false), 'key');

        $granted = DB::table('sub_account_permissions')
            ->where('user_id', $user->id)
            ->whereNotIn('feature_key', $ownerOnlyKeys)
            ->pluck('feature_key')
            ->all();

        $publicKeys = array_column(array_filter($registry, fn ($f) => $f['public']), 'key');

        return array_values(array_unique([...$publicKeys, ...$granted]));
    }

    public static function allows(User $user, string $key): bool
    {
        return in_array($key, self::grantedKeys($user), true);
    }

    /**
     * Registry entries an Owner may actually grant to a sub-account —
     * excludes public features (always available) and owner-only ones
     * (never delegable).
     *
     * @return array<int, array<string, mixed>>
     */
    public static function grantable(): array
    {
        return array_values(array_filter(
            config('features'),
            fn ($f) => ! $f['public'] && ! ($f['owner_only'] ?? false),
        ));
    }
}
