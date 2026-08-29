<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class TenantAgentController extends Controller
{
    public function index(Request $request)
    {
        $tenant = $request->user()->tenant()->with('agents.carrier')->first();

        return response()->json([
            'data' => [
                'status' => $tenant->derivedStatus(),
                'agents' => $tenant->agents->map(fn ($agent) => [
                    'id' => $agent->id,
                    'carrier_name' => $agent->carrier->name,
                    'os' => $agent->os,
                    'status' => $agent->status,
                ]),
            ],
        ]);
    }
}
