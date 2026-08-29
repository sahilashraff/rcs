<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Agent;
use App\Models\CarrierAgent;
use App\Support\CarrierAgentTransitioner;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use InvalidArgumentException;

class CarrierAgentController extends Controller
{
    public function store(Request $request, Agent $agent)
    {
        $data = $request->validate([
            'carrier_id' => ['required', 'exists:carriers,id'],
            'os' => ['sometimes', 'in:android,ios'],
        ]);

        $carrierAgent = $agent->carrierAgents()->create([
            'carrier_id' => $data['carrier_id'],
            'os' => $data['os'] ?? 'android',
        ]);

        return response()->json(['data' => $carrierAgent], 201);
    }

    public function transition(Request $request, CarrierAgent $carrierAgent, CarrierAgentTransitioner $transitioner)
    {
        $data = $request->validate([
            'action' => ['required', 'string'],
            'rejection_reason' => ['nullable', 'string'],
        ]);

        try {
            $updated = $transitioner->transition($carrierAgent, $data['action'], $data['rejection_reason'] ?? null);
        } catch (InvalidArgumentException $e) {
            throw ValidationException::withMessages(['action' => $e->getMessage()]);
        }

        return response()->json(['data' => $updated]);
    }
}
