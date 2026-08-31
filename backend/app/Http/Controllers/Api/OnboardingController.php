<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\OnboardingRequest;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class OnboardingController extends Controller
{
    /**
     * The six uploaded-document fields — the single list every validation
     * rule and storage write here reads from, and that
     * AdminOnboardingRequestController's document() download endpoint
     * imports as its field whitelist, so a new document type is only ever
     * added in one place.
     */
    public const DOCUMENT_FIELDS = [
        'brand_logo',
        'brand_banner',
        'incorporation_certificate',
        'pan_document',
        'gst_document',
        'other_document',
    ];

    public function mine(Request $request)
    {
        $tenant = $request->user()->tenant;

        return response()->json([
            'data' => $tenant?->onboardingRequest,
        ]);
    }

    public function store(Request $request)
    {
        $tenant = $request->user()->tenant;

        if (! $tenant) {
            throw ValidationException::withMessages([
                'tenant_id' => ['Your account has no tenant to onboard.'],
            ]);
        }

        $existing = $tenant->onboardingRequest;

        if ($existing && in_array($existing->status, ['submitted', 'approved'], true)) {
            throw ValidationException::withMessages([
                'status' => ["This request is already {$existing->status} and cannot be edited."],
            ]);
        }

        $data = $request->validate([
            'company_name' => ['required', 'string', 'max:255'],
            'company_description' => ['required', 'string'],
            'company_location' => ['required', 'string', 'max:255'],
            'company_website' => ['required', 'string', 'max:255'],
            'gstin' => ['required', 'string', 'max:32'],
            'pan' => ['required', 'string', 'max:32'],
            'cin' => ['required', 'string', 'max:32'],
            'udyam_registration_number' => ['required', 'string', 'max:32'],
            'account_transaction_type' => ['required', 'array', 'min:1'],
            'account_transaction_type.*' => ['string', Rule::in(['otp', 'transactional', 'promotional', 'multi_use'])],
            'company_address' => ['required', 'string'],
            'company_phone' => ['required', 'string', 'max:20'],
            'company_email' => ['required', 'email', 'max:255'],
            'rcs_account_name' => ['required', 'string', 'max:255'],
            'rcs_display_name' => ['required', 'string', 'max:255'],
            'rcs_brand_color' => ['required', 'string', 'max:20'],
            'rcs_description' => ['required', 'string', 'max:100'],
            'contact_phone_number' => ['required', 'string', 'max:20'],
            'brand_contact_email' => ['required', 'email', 'max:255'],
            'brand_website' => ['required', 'string', 'max:255'],
            'terms_of_use_url' => ['required', 'string', 'max:255'],
            'privacy_policy_url' => ['required', 'string', 'max:255'],
            'rcs_content_languages' => ['required', 'array', 'min:1'],
            'rcs_content_languages.*' => ['string', 'max:10'],
            'rcs_opt_in_url' => ['required', 'string', 'max:255'],
            'industry_type' => ['required', 'string', 'max:255'],
            'contact_person_name' => ['required', 'string', 'max:255'],
            'contact_person_designation' => ['required', 'string', 'max:255'],
            'contact_person_email' => ['required', 'email', 'max:255'],
            'contact_person_mobile_number' => ['required', 'string', 'max:20'],
            'brand_logo' => [$existing?->brand_logo_path ? 'nullable' : 'required', 'file', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'brand_banner' => [$existing?->brand_banner_path ? 'nullable' : 'required', 'file', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'incorporation_certificate' => [$existing?->incorporation_certificate_path ? 'nullable' : 'required', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:10240'],
            'pan_document' => [$existing?->pan_document_path ? 'nullable' : 'required', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:10240'],
            'gst_document' => [$existing?->gst_document_path ? 'nullable' : 'required', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:10240'],
            'other_document' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:10240'],
        ]);

        $onboardingRequest = $existing ?? new OnboardingRequest(['tenant_id' => $tenant->id]);

        $onboardingRequest->fill(collect($data)->except(self::DOCUMENT_FIELDS)->all());

        foreach (self::DOCUMENT_FIELDS as $field) {
            if ($request->hasFile($field)) {
                $path = $request->file($field)->storeAs(
                    "onboarding/{$tenant->id}",
                    $field . '.' . $request->file($field)->extension(),
                    'local',
                );
                $onboardingRequest->{$field . '_path'} = $path;
            }
        }

        $onboardingRequest->status = 'submitted';
        $onboardingRequest->rejection_reason = null;
        $onboardingRequest->save();

        return response()->json(['data' => $onboardingRequest]);
    }
}
