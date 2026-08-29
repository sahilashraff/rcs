<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('carrier_agents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('agent_id')->constrained()->cascadeOnDelete();
            $table->foreignId('carrier_id')->constrained()->restrictOnDelete();
            $table->enum('os', ['android', 'ios'])->default('android');
            $table->string('carrier_external_id')->nullable();
            $table->enum('status', ['draft', 'submitted', 'approved', 'rejected', 'live', 'suspended', 'terminated'])->default('draft');
            $table->text('rejection_reason')->nullable();
            $table->enum('suspended_by', ['admin', 'carrier'])->nullable();
            $table->json('last_submitted_payload')->nullable();
            $table->json('last_carrier_response')->nullable();
            $table->timestamps();

            $table->unique(['agent_id', 'carrier_id', 'os']);
            $table->unique(['carrier_id', 'carrier_external_id']);
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('carrier_agents');
    }
};
