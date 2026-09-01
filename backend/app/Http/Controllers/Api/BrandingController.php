<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Support\BrandingSettings;

/**
 * Public — no auth. Unauthenticated pages (sign-in, sign-up) and the
 * app shell both need the real logo/favicon/site name before a user
 * is signed in, so this can't live behind /admin/settings.
 */
class BrandingController extends Controller
{
    public function index()
    {
        return response()->json(['data' => BrandingSettings::current()]);
    }
}
