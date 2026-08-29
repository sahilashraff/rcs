<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;

class AdminSettingController extends Controller
{
    public function index()
    {
        return response()->json([
            'data' => [
                'otp_verification_enabled' => filter_var(Setting::get('otp_verification_enabled', '0'), FILTER_VALIDATE_BOOLEAN),
            ],
        ]);
    }

    public function update(Request $request)
    {
        $data = $request->validate([
            'otp_verification_enabled' => ['required', 'boolean'],
        ]);

        Setting::set('otp_verification_enabled', $data['otp_verification_enabled'] ? '1' : '0');

        return response()->json([
            'data' => [
                'otp_verification_enabled' => $data['otp_verification_enabled'],
            ],
        ]);
    }
}
