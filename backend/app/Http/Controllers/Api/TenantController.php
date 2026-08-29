<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Tenant;

class TenantController extends Controller
{
    public function index()
    {
        return response()->json(['data' => Tenant::query()->get(['id', 'name'])]);
    }
}
