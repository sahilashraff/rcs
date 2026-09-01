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
        Schema::table('tenants', function (Blueprint $table) {
            // Snapshot of the file-manager global default at the moment
            // this tenant was created — not a live fallback. Changing the
            // global default later only affects tenants created after
            // that change; admin can still edit an individual tenant's
            // value directly.
            $table->unsignedInteger('max_storage_mb')->default(1024)->after('description');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->dropColumn('max_storage_mb');
        });
    }
};
