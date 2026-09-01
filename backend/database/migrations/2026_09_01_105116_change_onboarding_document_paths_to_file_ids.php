<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('onboarding_requests', function (Blueprint $table) {
            $table->dropColumn([
                'brand_logo_path',
                'brand_banner_path',
                'incorporation_certificate_path',
                'pan_document_path',
                'gst_document_path',
                'other_document_path',
            ]);

            foreach ([
                'brand_logo_file_id',
                'brand_banner_file_id',
                'incorporation_certificate_file_id',
                'pan_document_file_id',
                'gst_document_file_id',
                'other_document_file_id',
            ] as $column) {
                $table->foreignId($column)->nullable()->constrained('file_uploads')->nullOnDelete();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('onboarding_requests', function (Blueprint $table) {
            $table->dropColumn([
                'brand_logo_file_id',
                'brand_banner_file_id',
                'incorporation_certificate_file_id',
                'pan_document_file_id',
                'gst_document_file_id',
                'other_document_file_id',
            ]);

            $table->string('brand_logo_path')->nullable();
            $table->string('brand_banner_path')->nullable();
            $table->string('incorporation_certificate_path')->nullable();
            $table->string('pan_document_path')->nullable();
            $table->string('gst_document_path')->nullable();
            $table->string('other_document_path')->nullable();
        });
    }
};
