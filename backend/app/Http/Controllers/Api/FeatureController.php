<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Support\FeatureAccess;

class FeatureController extends Controller
{
    public function index()
    {
        return response()->json(['data' => FeatureAccess::grantable()]);
    }
}
