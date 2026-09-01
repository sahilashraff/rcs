<?php

namespace App\Support;

use App\Models\AppSetting;

/**
 * The platform-wide default theme schema and mode a fresh, never-visited
 * browser starts with. This is a default only — the frontend's own
 * per-user theme picker (persisted to that browser's localStorage) always
 * wins once a visitor has made their own choice; see BrandingController's
 * public payload and the frontend's BrandingLoader for how the two don't
 * conflict.
 */
class AppearanceSettings
{
    // Mirrors the keys of frontend/src/configs/preset-theme-schema.config.ts
    // — kept as a plain string list rather than imported from anywhere,
    // since the frontend config is the source of truth and this only
    // needs to validate against it, not duplicate its color values.
    public const THEME_SCHEMAS = ['default', 'dark', 'green', 'purple', 'orange'];

    public const MODES = ['light', 'dark'];

    public static function current(): array
    {
        return [
            'default_theme_schema' => AppSetting::get('appearance_default_theme_schema', 'default'),
            'default_mode' => AppSetting::get('appearance_default_mode', 'light'),
        ];
    }
}
