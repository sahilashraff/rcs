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
        Schema::table('file_uploads', function (Blueprint $table) {
            // SHA-256 hex digest of the file's contents, computed for
            // every upload regardless of purpose — cheap to compute, and
            // gives any feature (not just File Manager) the ability to
            // detect a duplicate later without a second pass over every
            // existing file. Nullable since rows created before this
            // migration have none.
            $table->string('hash', 64)->nullable()->after('size');
            $table->index(['purpose', 'tenant_id', 'hash']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('file_uploads', function (Blueprint $table) {
            $table->dropIndex(['purpose', 'tenant_id', 'hash']);
            $table->dropColumn('hash');
        });
    }
};
