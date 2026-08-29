<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Agent;
use Illuminate\Http\Request;

class AgentController extends Controller
{
    public function index()
    {
        $agents = Agent::with('carrierAgents', 'tenant')->get();

        $data = $agents->map(fn (Agent $agent) => [
            'id' => $agent->id,
            'tenant_id' => $agent->tenant_id,
            'tenant_name' => $agent->tenant->name,
            'name' => $agent->name,
            'brand_name' => $agent->brand_name,
            'status' => $agent->derivedStatus(),
        ]);

        return response()->json(['data' => $data]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'tenant_id' => ['required', 'exists:tenants,id'],
            'name' => ['required', 'string', 'max:255'],
            'brand_name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
        ]);

        $agent = Agent::create($data);

        return response()->json(['data' => $agent], 201);
    }

    public function show(Agent $agent)
    {
        $agent->load('carrierAgents.carrier', 'tenant');

        return response()->json([
            'data' => [
                'id' => $agent->id,
                'tenant_id' => $agent->tenant_id,
                'tenant_name' => $agent->tenant->name,
                'name' => $agent->name,
                'brand_name' => $agent->brand_name,
                'description' => $agent->description,
                'status' => $agent->derivedStatus(),
                'carrier_agents' => $agent->carrierAgents->map(fn ($ca) => [
                    'id' => $ca->id,
                    'carrier_id' => $ca->carrier_id,
                    'carrier_code' => $ca->carrier->code,
                    'carrier_name' => $ca->carrier->name,
                    'os' => $ca->os,
                    'status' => $ca->status,
                    'carrier_external_id' => $ca->carrier_external_id,
                    'rejection_reason' => $ca->rejection_reason,
                    'suspended_by' => $ca->suspended_by,
                ]),
            ],
        ]);
    }
}
