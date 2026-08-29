<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('carrier_agents', function (Blueprint $table) {
            $table->dropUnique(['agent_id', 'carrier_id', 'os']);
        });

        Schema::table('carrier_agents', function (Blueprint $table) {
            $table->renameColumn('agent_id', 'tenant_id');
        });

        Schema::table('carrier_agents', function (Blueprint $table) {
            $table->foreign('tenant_id')->references('id')->on('tenants')->cascadeOnDelete();
            $table->unique(['tenant_id', 'carrier_id', 'os']);
        });

        Schema::rename('carrier_agents', 'agents');
    }

    public function down(): void
    {
        Schema::rename('agents', 'carrier_agents');

        Schema::table('carrier_agents', function (Blueprint $table) {
            $table->dropUnique(['tenant_id', 'carrier_id', 'os']);
            $table->dropForeign(['tenant_id']);
        });

        Schema::table('carrier_agents', function (Blueprint $table) {
            $table->renameColumn('tenant_id', 'agent_id');
        });

        Schema::table('carrier_agents', function (Blueprint $table) {
            $table->unique(['agent_id', 'carrier_id', 'os']);
        });
    }
};
