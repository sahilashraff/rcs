<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Agent;
use App\Models\OnboardingRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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
        $onboardingRequest->load([
            'tenant', 'brandLogoFile', 'brandBannerFile', 'incorporationCertificateFile',
            'panDocumentFile', 'gstDocumentFile', 'otherDocumentFile',
        ]);

        return response()->json(['data' => $onboardingRequest]);
    }

    public function approve(Request $request, OnboardingRequest $onboardingRequest)
    {
        if ($onboardingRequest->status !== 'submitted') {
            throw ValidationException::withMessages([
                'status' => ['Only a submitted request can be approved.'],
            ]);
        }

        $data = $request->validate(array_merge(
            ['agents' => ['required', 'array', 'min:1']],
            Agent::pairValidationRules('agents.*.'),
        ));

        $pairs = collect($data['agents'])->map(fn ($pair) => $pair['carrier_id'] . ':' . $pair['os']);

        if ($pairs->unique()->count() !== $pairs->count()) {
            throw ValidationException::withMessages([
                'agents' => ['Duplicate carrier/OS combinations are not allowed.'],
            ]);
        }

        DB::transaction(function () use ($request, $onboardingRequest, $data) {
            $tenant = $onboardingRequest->tenant;
            $tenant->brand_name = $onboardingRequest->rcs_display_name;
            $tenant->description = $onboardingRequest->rcs_description;
            $tenant->save();

            foreach ($data['agents'] as $pair) {
                Agent::create([
                    'tenant_id' => $tenant->id,
                    'carrier_id' => $pair['carrier_id'],
                    'os' => $pair['os'],
                    'type' => $pair['type'],
                ]);
            }

            $onboardingRequest->status = 'approved';
            $onboardingRequest->reviewed_by = $request->user()->id;
            $onboardingRequest->reviewed_at = now();
            $onboardingRequest->save();
        });

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
}
