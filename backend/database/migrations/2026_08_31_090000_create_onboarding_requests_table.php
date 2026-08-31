<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('onboarding_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->unique()->constrained()->cascadeOnDelete();
            $table->enum('status', ['draft', 'submitted', 'approved', 'rejected'])->default('draft');

            // Company details
            $table->string('company_name');
            $table->text('company_description');
            $table->string('company_location');
            $table->string('company_website');
            $table->string('gstin');
            $table->string('pan');
            $table->string('cin');
            $table->string('udyam_registration_number');
            $table->json('account_transaction_type');
            $table->text('company_address');
            $table->string('company_phone');
            $table->string('company_email');

            // RCS account section
            $table->string('rcs_account_name');
            $table->string('rcs_display_name');
            $table->string('rcs_brand_color');
            $table->string('rcs_description', 100);

            // Display contact info
            $table->string('contact_phone_number');
            $table->string('brand_contact_email');
            $table->string('brand_website');

            // Legal / language info
            $table->string('terms_of_use_url');
            $table->string('privacy_policy_url');
            $table->json('rcs_content_languages');
            $table->string('rcs_opt_in_url');

            // Contact person details
            $table->string('industry_type');
            $table->string('contact_person_name');
            $table->string('contact_person_designation');
            $table->string('contact_person_email');
            $table->string('contact_person_mobile_number');

            // Uploaded documents — nullable, populated as each is uploaded
            $table->string('brand_logo_path')->nullable();
            $table->string('brand_banner_path')->nullable();
            $table->string('incorporation_certificate_path')->nullable();
            $table->string('pan_document_path')->nullable();
            $table->string('gst_document_path')->nullable();
            $table->string('other_document_path')->nullable();

            // Review outcome
            $table->text('rejection_reason')->nullable();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('onboarding_requests');
    }
};
