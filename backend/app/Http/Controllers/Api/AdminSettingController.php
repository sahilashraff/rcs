<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AppSetting;
use App\Models\FileUpload;
use App\Support\BrandingSettings;
use App\Support\FileUploadService;
use DateTimeZone;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AdminSettingController extends Controller
{
    public function index()
    {
        return response()->json([
            'data' => [
                'otp_verification_enabled' => filter_var(AppSetting::get('otp_verification_enabled', '0'), FILTER_VALIDATE_BOOLEAN),
                'general' => BrandingSettings::current(),
                'localisation' => $this->localisationSettings(),
                'file_manager' => $this->fileManagerSettings(),
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

        foreach (BrandingSettings::FILE_FIELDS as $field) {
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

        return response()->json(['data' => BrandingSettings::current()]);
    }

    public function updateLocalisation(Request $request)
    {
        $data = $request->validate([
            'currency_code' => ['required', 'string', 'regex:/^[A-Z]{3}$/'],
            'timezone' => ['required', 'string', Rule::in(DateTimeZone::listIdentifiers())],
        ]);

        AppSetting::set('localisation_currency_code', $data['currency_code']);
        AppSetting::set('localisation_timezone', $data['timezone']);

        return response()->json(['data' => $this->localisationSettings()]);
    }

    private function localisationSettings(): array
    {
        return [
            'currency_code' => AppSetting::get('localisation_currency_code', 'INR'),
            'timezone' => AppSetting::get('localisation_timezone', 'Asia/Kolkata'),
        ];
    }

    public function updateFileManager(Request $request)
    {
        $data = $request->validate([
            'allowed_extensions' => ['required', 'array', 'min:1'],
            'allowed_extensions.*' => ['string', 'regex:/^[a-zA-Z0-9]+$/', 'max:10'],
            'max_storage_mb' => ['required', 'integer', 'min:1'],
        ]);

        AppSetting::set('file_manager_allowed_extensions', implode(',', $data['allowed_extensions']));
        AppSetting::set('file_manager_max_storage_mb', (string) $data['max_storage_mb']);

        return response()->json(['data' => $this->fileManagerSettings()]);
    }

    private function fileManagerSettings(): array
    {
        $extensions = AppSetting::get('file_manager_allowed_extensions', 'jpg,jpeg,png,pdf,docx');

        return [
            'allowed_extensions' => array_filter(explode(',', $extensions)),
            'max_storage_mb' => (int) AppSetting::get('file_manager_max_storage_mb', 1024),
        ];
    }
}
