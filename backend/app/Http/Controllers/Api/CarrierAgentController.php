<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Agent;
use App\Support\CarrierAgentTransitioner;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use InvalidArgumentException;

class CarrierAgentController extends Controller
{
    public function transition(Request $request, Agent $agent, CarrierAgentTransitioner $transitioner)
    {
        $data = $request->validate([
            'action' => ['required', 'string'],
            'rejection_reason' => ['nullable', 'string'],
        ]);

        try {
            $updated = $transitioner->transition($agent, $data['action'], $data['rejection_reason'] ?? null);
        } catch (InvalidArgumentException $e) {
            throw ValidationException::withMessages(['action' => $e->getMessage()]);
        }

        return response()->json(['data' => $updated]);
    }
}
