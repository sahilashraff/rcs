<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OnboardingRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'tenant_id',
        'status',
        'company_name',
        'company_description',
        'company_location',
        'company_website',
        'gstin',
        'pan',
        'cin',
        'udyam_registration_number',
        'account_transaction_type',
        'company_address',
        'company_phone',
        'company_email',
        'rcs_account_name',
        'rcs_display_name',
        'rcs_brand_color',
        'rcs_description',
        'contact_phone_number',
        'brand_contact_email',
        'brand_website',
        'terms_of_use_url',
        'privacy_policy_url',
        'rcs_content_languages',
        'rcs_opt_in_url',
        'industry_type',
        'contact_person_name',
        'contact_person_designation',
        'contact_person_email',
        'contact_person_mobile_number',
        'brand_logo_path',
        'brand_banner_path',
        'incorporation_certificate_path',
        'pan_document_path',
        'gst_document_path',
        'other_document_path',
        'rejection_reason',
        'reviewed_by',
        'reviewed_at',
    ];

    protected function casts(): array
    {
        return [
            'account_transaction_type' => 'array',
            'rcs_content_languages' => 'array',
            'reviewed_at' => 'datetime',
        ];
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }
}
