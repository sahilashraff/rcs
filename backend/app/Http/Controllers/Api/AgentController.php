<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Agent;
use App\Models\Tenant;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class AgentController extends Controller
{
    public function index(Request $request)
    {
        $agents = Agent::with('tenant', 'carrier')
            ->when($request->query('tenant_id'), fn ($query, $tenantId) => $query->where('tenant_id', $tenantId))
            ->orderBy('tenant_id')
            ->orderBy('carrier_id')
            ->get();

        $data = $agents->map(fn (Agent $agent) => [
            'id' => $agent->id,
            'tenant_id' => $agent->tenant_id,
            'tenant_name' => $agent->tenant->name,
            'brand_name' => $agent->tenant->brand_name,
            'carrier_id' => $agent->carrier_id,
            'carrier_code' => $agent->carrier->code,
            'carrier_name' => $agent->carrier->name,
            'os' => $agent->os,
            'type' => $agent->type,
            'status' => $agent->status,
            'carrier_external_id' => $agent->carrier_external_id,
            'rejection_reason' => $agent->rejection_reason,
            'suspended_by' => $agent->suspended_by,
        ]);

        return response()->json(['data' => $data]);
    }

    public function store(Request $request, Tenant $tenant)
    {
        if ($tenant->onboardingRequest?->status !== 'approved') {
            throw ValidationException::withMessages([
                'tenant' => ['This tenant has no approved onboarding request to add agents against.'],
            ]);
        }

        $data = $request->validate(array_merge(
            Agent::pairValidationRules(),
            [
                'carrier_id' => [Rule::unique('agents')->where(
                    fn ($query) => $query->where('tenant_id', $tenant->id)->where('os', $request->os),
                )],
            ],
        ));

        $agent = Agent::create([
            'tenant_id' => $tenant->id,
            'carrier_id' => $data['carrier_id'],
            'os' => $data['os'],
            'type' => $data['type'],
        ]);

        return response()->json(['data' => $agent], 201);
    }

    public function update(Request $request, Agent $agent)
    {
        if ($agent->status !== 'draft') {
            throw ValidationException::withMessages([
                'status' => ['Only a draft Agent can be edited.'],
            ]);
        }

        $data = $request->validate([
            'carrier_id' => ['sometimes', 'integer', 'exists:carriers,id'],
            'os' => ['sometimes', Rule::in(['android', 'ios'])],
            'type' => ['sometimes', Rule::in(Agent::TYPES)],
            'carrier_external_id' => ['sometimes', 'nullable', 'string'],
        ]);

        if (isset($data['carrier_id']) || isset($data['os'])) {
            $targetCarrierId = $data['carrier_id'] ?? $agent->carrier_id;
            $targetOs = $data['os'] ?? $agent->os;

            $duplicate = Agent::where('tenant_id', $agent->tenant_id)
                ->where('carrier_id', $targetCarrierId)
                ->where('os', $targetOs)
                ->where('id', '!=', $agent->id)
                ->exists();

            if ($duplicate) {
                throw ValidationException::withMessages([
                    'carrier_id' => ['This tenant already has an agent for that carrier/OS combination.'],
                ]);
            }
        }

        $agent->update($data);

        return response()->json(['data' => $agent]);
    }

    public function destroy(Agent $agent)
    {
        if ($agent->status !== 'draft') {
            throw ValidationException::withMessages([
                'status' => ['Only a draft Agent can be deleted.'],
            ]);
        }

        $agent->delete();

        return response()->json(null, 204);
    }
}
