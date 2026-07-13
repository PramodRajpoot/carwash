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
        Schema::table('franchisees', function (Blueprint $table) {
            $table->decimal('royalty_percentage', 10, 2)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('franchisees', function (Blueprint $table) {
            $table->decimal('royalty_percentage', 5, 2)->change();
        });
    }
};
