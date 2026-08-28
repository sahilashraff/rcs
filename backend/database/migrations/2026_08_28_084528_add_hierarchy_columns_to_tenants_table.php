<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->foreignId('parent_tenant_id')
                ->nullable()
                ->after('name')
                ->constrained('tenants')
                ->nullOnDelete();
            $table->boolean('is_white_label')->default(false)->after('parent_tenant_id');

            $table->index('is_white_label');
        });
    }

    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->dropConstrainedForeignId('parent_tenant_id');
            $table->dropColumn('is_white_label');
        });
    }
};
