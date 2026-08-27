<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;

class PingController extends Controller
{
    public function permissions()
    {
        return response()->json(['message' => 'permissions module reachable']);
    }
}
