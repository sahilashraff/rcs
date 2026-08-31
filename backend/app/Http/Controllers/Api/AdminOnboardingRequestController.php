<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Agent;
use App\Models\OnboardingRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class AdminOnboardingRequestController extends Controller
{
    public function index()
    {
        $requests = OnboardingRequest::with('tenant')
            ->orderByDesc('updated_at')
            ->get()
            ->map(fn (OnboardingRequest $r) => [
                'id' => $r->id,
                'tenant_id' => $r->tenant_id,
                'tenant_name' => $r->tenant->name,
                'status' => $r->status,
                'submitted_at' => $r->updated_at,
            ]);

        return response()->json(['data' => $requests]);
    }

    public function show(OnboardingRequest $onboardingRequest)
    {
        $onboardingRequest->load('tenant');

        return response()->json(['data' => $onboardingRequest]);
    }

    public function approve(Request $request, OnboardingRequest $onboardingRequest)
    {
        if ($onboardingRequest->status !== 'submitted') {
            throw ValidationException::withMessages([
                'status' => ['Only a submitted request can be approved.'],
            ]);
        }

        $data = $request->validate([
            'agents' => ['required', 'array', 'min:1'],
            'agents.*.carrier_id' => ['required', 'integer', 'exists:carriers,id'],
            'agents.*.os' => ['required', Rule::in(['android', 'ios'])],
        ]);

        $pairs = collect($data['agents'])->map(fn ($pair) => $pair['carrier_id'] . ':' . $pair['os']);

        if ($pairs->unique()->count() !== $pairs->count()) {
            throw ValidationException::withMessages([
                'agents' => ['Duplicate carrier/OS combinations are not allowed.'],
            ]);
        }

        $tenant = $onboardingRequest->tenant;
        $tenant->brand_name = $onboardingRequest->rcs_display_name;
        $tenant->description = $onboardingRequest->rcs_description;
        $tenant->save();

        foreach ($data['agents'] as $pair) {
            Agent::create([
                'tenant_id' => $tenant->id,
                'carrier_id' => $pair['carrier_id'],
                'os' => $pair['os'],
            ]);
        }

        $onboardingRequest->status = 'approved';
        $onboardingRequest->reviewed_by = $request->user()->id;
        $onboardingRequest->reviewed_at = now();
        $onboardingRequest->save();

        return response()->json(['data' => $onboardingRequest->fresh()]);
    }

    public function reject(Request $request, OnboardingRequest $onboardingRequest)
    {
        if ($onboardingRequest->status !== 'submitted') {
            throw ValidationException::withMessages([
                'status' => ['Only a submitted request can be rejected.'],
            ]);
        }

        $data = $request->validate([
            'rejection_reason' => ['required', 'string'],
        ]);

        $onboardingRequest->status = 'rejected';
        $onboardingRequest->rejection_reason = $data['rejection_reason'];
        $onboardingRequest->reviewed_by = $request->user()->id;
        $onboardingRequest->reviewed_at = now();
        $onboardingRequest->save();

        return response()->json(['data' => $onboardingRequest]);
    }

    public function document(OnboardingRequest $onboardingRequest, string $field)
    {
        if (! in_array($field, OnboardingController::DOCUMENT_FIELDS, true)) {
            abort(404);
        }

        $path = $onboardingRequest->{$field . '_path'};

        if (! $path || ! Storage::disk('local')->exists($path)) {
            abort(404);
        }

        return Storage::disk('local')->download($path);
    }
}
