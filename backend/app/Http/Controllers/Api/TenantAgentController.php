<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Agent;
use Illuminate\Http\Request;

class TenantAgentController extends Controller
{
    public function index(Request $request)
    {
        $agents = Agent::where('tenant_id', $request->user()->tenant_id)
            ->with('carrierAgents.carrier')
            ->get();

        $data = $agents->map(fn (Agent $agent) => [
            'id' => $agent->id,
            'name' => $agent->name,
            'brand_name' => $agent->brand_name,
            'status' => $agent->derivedStatus(),
            'carrier_agents' => $agent->carrierAgents->map(fn ($ca) => [
                'carrier_name' => $ca->carrier->name,
                'os' => $ca->os,
                'status' => $ca->status,
            ]),
        ]);

        return response()->json(['data' => $data]);
    }
}
