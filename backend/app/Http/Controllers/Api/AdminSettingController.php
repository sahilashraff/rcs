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
                'notification_sound' => $this->notificationSoundSettings(),
                'login_auth' => $this->loginAuthSettings(),
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

    /**
     * The canonical IANA timezone list, sourced from PHP/ICU — the same
     * source updateLocalisation() validates against. The frontend must
     * use this instead of the browser's Intl.supportedValuesOf(), which
     * isn't guaranteed to return canonical names (some ICU versions
     * return legacy aliases like "Asia/Calcutta" instead of
     * "Asia/Kolkata", which would then fail validation here).
     */
    public function timezones()
    {
        return response()->json(['data' => DateTimeZone::listIdentifiers()]);
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

    public function updateNotificationSound(Request $request, FileUploadService $fileUploadService)
    {
        $data = $request->validate([
            'enabled' => ['required', 'boolean'],
            'sound' => ['nullable', 'file', 'mimes:mp3,wav,ogg', 'max:1024'],
        ]);

        AppSetting::set('notification_sound_enabled', $data['enabled'] ? '1' : '0');

        if ($request->hasFile('sound')) {
            $oldId = AppSetting::get('notification_sound_file_id');
            $old = $oldId ? FileUpload::find($oldId) : null;

            $new = $fileUploadService->replace(
                $old,
                $request->file('sound'),
                'notification_sound',
                'sound',
                'public',
                $request->user()->id,
                null,
            );

            AppSetting::set('notification_sound_file_id', $new->id);
        }

        return response()->json(['data' => $this->notificationSoundSettings()]);
    }

    private function notificationSoundSettings(): array
    {
        $fileId = AppSetting::get('notification_sound_file_id');

        return [
            'enabled' => filter_var(AppSetting::get('notification_sound_enabled', '1'), FILTER_VALIDATE_BOOLEAN),
            'sound_url' => $fileId ? FileUpload::find($fileId)?->url : null,
        ];
    }

    public function updateLoginAuth(Request $request)
    {
        $data = $request->validate([
            'google_oauth_enabled' => ['required', 'boolean'],
            'google_client_id' => ['nullable', 'string', 'max:255'],
            'google_client_secret' => ['nullable', 'string', 'max:255'],
            'github_oauth_enabled' => ['required', 'boolean'],
            'github_client_id' => ['nullable', 'string', 'max:255'],
            'github_client_secret' => ['nullable', 'string', 'max:255'],
            'recaptcha_enabled' => ['required', 'boolean'],
            'recaptcha_site_key' => ['nullable', 'string', 'max:255'],
            'recaptcha_secret_key' => ['nullable', 'string', 'max:255'],
            // Format-only validation (2 uppercase letters) rather than
            // checking against a canonical ISO-3166 country list — a
            // second hardcoded list is exactly the kind of drift that
            // caused the Asia/Calcutta timezone bug. Empty = no
            // restriction, every country allowed.
            'signup_allowed_countries' => ['array'],
            'signup_allowed_countries.*' => ['string', 'regex:/^[A-Z]{2}$/'],
        ]);

        AppSetting::set('login_auth_google_oauth_enabled', $data['google_oauth_enabled'] ? '1' : '0');
        AppSetting::set('login_auth_google_client_id', $data['google_client_id'] ?? '');
        AppSetting::set('login_auth_github_oauth_enabled', $data['github_oauth_enabled'] ? '1' : '0');
        AppSetting::set('login_auth_github_client_id', $data['github_client_id'] ?? '');
        AppSetting::set('login_auth_recaptcha_enabled', $data['recaptcha_enabled'] ? '1' : '0');
        AppSetting::set('login_auth_recaptcha_site_key', $data['recaptcha_site_key'] ?? '');
        AppSetting::set('login_auth_signup_allowed_countries', implode(',', $data['signup_allowed_countries'] ?? []));

        // Secrets: only overwrite when a new value is actually submitted —
        // a blank field means "leave the stored secret unchanged", never
        // "clear it". Mirrors the file-upload replace-only-if-provided
        // pattern used elsewhere in this controller.
        if (! empty($data['google_client_secret'])) {
            AppSetting::set('login_auth_google_client_secret', $data['google_client_secret']);
        }
        if (! empty($data['github_client_secret'])) {
            AppSetting::set('login_auth_github_client_secret', $data['github_client_secret']);
        }
        if (! empty($data['recaptcha_secret_key'])) {
            AppSetting::set('login_auth_recaptcha_secret_key', $data['recaptcha_secret_key']);
        }

        return response()->json(['data' => $this->loginAuthSettings()]);
    }

    private function loginAuthSettings(): array
    {
        $countries = AppSetting::get('login_auth_signup_allowed_countries', '');

        return [
            'google_oauth_enabled' => filter_var(AppSetting::get('login_auth_google_oauth_enabled', '0'), FILTER_VALIDATE_BOOLEAN),
            'google_client_id' => AppSetting::get('login_auth_google_client_id', ''),
            'google_client_secret_set' => (bool) AppSetting::get('login_auth_google_client_secret'),
            'github_oauth_enabled' => filter_var(AppSetting::get('login_auth_github_oauth_enabled', '0'), FILTER_VALIDATE_BOOLEAN),
            'github_client_id' => AppSetting::get('login_auth_github_client_id', ''),
            'github_client_secret_set' => (bool) AppSetting::get('login_auth_github_client_secret'),
            'recaptcha_enabled' => filter_var(AppSetting::get('login_auth_recaptcha_enabled', '0'), FILTER_VALIDATE_BOOLEAN),
            'recaptcha_site_key' => AppSetting::get('login_auth_recaptcha_site_key', ''),
            'recaptcha_secret_key_set' => (bool) AppSetting::get('login_auth_recaptcha_secret_key'),
            'signup_allowed_countries' => array_filter(explode(',', $countries)),
        ];
    }
}
