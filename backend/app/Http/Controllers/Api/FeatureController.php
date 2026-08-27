<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;

class FeatureController extends Controller
{
    public function index()
    {
        $grantable = array_values(array_filter(config('features'), fn ($f) => ! $f['public']));

        return response()->json(['data' => $grantable]);
    }
}
