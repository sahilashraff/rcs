<?php

namespace App\Support;

use App\Models\AppSetting;
use App\Models\FileUpload;

/**
 * Reads the "general" branding settings (site name, meta description,
 * favicon + 4 logo variants) into one shaped array — shared by the
 * admin settings endpoint (which also writes them) and the public
 * /branding endpoint (which the app shell and unauthenticated pages
 * like sign-in read to show the real logo/favicon/title), so the two
 * can never disagree on field names or URL-building.
 */
class BrandingSettings
{
    public const FILE_FIELDS = [
        'favicon',
        'logo_light_expanded',
        'logo_light_collapsed',
        'logo_dark_expanded',
        'logo_dark_collapsed',
    ];

    public static function current(): array
    {
        $result = [
            'site_name' => AppSetting::get('general_site_name'),
            'meta_description' => AppSetting::get('general_meta_description'),
        ];

        foreach (self::FILE_FIELDS as $field) {
            $fileId = AppSetting::get("general_{$field}_file_id");
            $result[$field . '_url'] = $fileId ? FileUpload::find($fileId)?->url : null;
        }

        return $result;
    }
}
