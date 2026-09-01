<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AppSetting;
use App\Models\FileUpload;
use App\Support\FileUploadService;
use Illuminate\Http\Request;

class AdminSettingController extends Controller
{
    /**
     * The five branding image slots — light/dark mode, each with an
     * expanded and collapsed variant, matching the theme's two sidebar
     * states — plus the favicon. Single source of truth for both the
     * upload validation and the URL-building on read.
     */
    public const GENERAL_FILE_FIELDS = [
        'favicon',
        'logo_light_expanded',
        'logo_light_collapsed',
        'logo_dark_expanded',
        'logo_dark_collapsed',
    ];

    public function index()
    {
        return response()->json([
            'data' => [
                'otp_verification_enabled' => filter_var(AppSetting::get('otp_verification_enabled', '0'), FILTER_VALIDATE_BOOLEAN),
                'general' => $this->generalSettings(),
            ],
        ]);
    }

    public function update(Request $request)
    {
        $data = $request->validate([
            'otp_verification_enabled' => ['required', 'boolean'],
        ]);

        AppSetting::set('otp_verification_enabled', $data['otp_verification_enabled'] ? '1' : '0');

        return response()->json([
            'data' => [
                'otp_verification_enabled' => $data['otp_verification_enabled'],
            ],
        ]);
    }

    public function updateGeneral(Request $request, FileUploadService $fileUploadService)
    {
        $data = $request->validate([
            'site_name' => ['required', 'string', 'max:255'],
            'meta_description' => ['nullable', 'string', 'max:500'],
            // svg deliberately excluded — served as plain public static
            // files, an uploaded SVG could carry an embedded <script> and
            // execute same-origin if opened directly (stored XSS).
            'favicon' => ['nullable', 'file', 'mimes:ico,png', 'max:1024'],
            'logo_light_expanded' => ['nullable', 'file', 'mimes:png,webp', 'max:2048'],
            'logo_light_collapsed' => ['nullable', 'file', 'mimes:png,webp', 'max:2048'],
            'logo_dark_expanded' => ['nullable', 'file', 'mimes:png,webp', 'max:2048'],
            'logo_dark_collapsed' => ['nullable', 'file', 'mimes:png,webp', 'max:2048'],
        ]);

        AppSetting::set('general_site_name', $data['site_name']);
        AppSetting::set('general_meta_description', $data['meta_description'] ?? '');

        foreach (self::GENERAL_FILE_FIELDS as $field) {
            if ($request->hasFile($field)) {
                $oldId = AppSetting::get("general_{$field}_file_id");
                $old = $oldId ? FileUpload::find($oldId) : null;

                $new = $fileUploadService->replace(
                    $old,
                    $request->file($field),
                    'general_branding',
                    $field,
                    'public',
                    $request->user()->id,
                    null,
                );

                AppSetting::set("general_{$field}_file_id", $new->id);
            }
        }

        return response()->json(['data' => $this->generalSettings()]);
    }

    private function generalSettings(): array
    {
        $result = [
            'site_name' => AppSetting::get('general_site_name'),
            'meta_description' => AppSetting::get('general_meta_description'),
        ];

        foreach (self::GENERAL_FILE_FIELDS as $field) {
            $fileId = AppSetting::get("general_{$field}_file_id");
            // UUID-named files mean every upload already has a unique URL,
            // so no cache-busting query param is needed the way the old
            // fixed-filename storage required.
            $result[$field . '_url'] = $fileId ? FileUpload::find($fileId)?->url : null;
        }

        return $result;
    }
}
