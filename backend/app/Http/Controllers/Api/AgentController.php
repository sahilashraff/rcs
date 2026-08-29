<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Agent;

class AgentController extends Controller
{
    public function index()
    {
        $agents = Agent::with('tenant', 'carrier')->get();

        $data = $agents->map(fn (Agent $agent) => [
            'id' => $agent->id,
            'tenant_id' => $agent->tenant_id,
            'tenant_name' => $agent->tenant->name,
            'brand_name' => $agent->tenant->brand_name,
            'carrier_id' => $agent->carrier_id,
            'carrier_code' => $agent->carrier->code,
            'carrier_name' => $agent->carrier->name,
            'os' => $agent->os,
            'status' => $agent->status,
            'carrier_external_id' => $agent->carrier_external_id,
            'rejection_reason' => $agent->rejection_reason,
            'suspended_by' => $agent->suspended_by,
        ]);

        return response()->json(['data' => $data]);
    }
}
