<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Support\AppearanceSettings;
use App\Support\BrandingSettings;

/**
 * Public — no auth. Unauthenticated pages (sign-in, sign-up) and the
 * app shell both need the real logo/favicon/site name (and the default
 * theme appearance) before a user is signed in, so this can't live
 * behind /admin/settings. Merges BrandingSettings and AppearanceSettings
 * into one payload so the frontend needs only one early fetch, while the
 * two stay separate concerns on the backend.
 */
class BrandingController extends Controller
{
    public function index()
    {
        return response()->json([
            'data' => [
                ...BrandingSettings::current(),
                ...AppearanceSettings::current(),
            ],
        ]);
    }
}
