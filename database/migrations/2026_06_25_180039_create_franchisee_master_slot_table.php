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
        Schema::create('franchisee_master_slot', function (Blueprint $table) {
            $table->id();
            $table->foreignId('franchisee_id')->constrained()->onDelete('cascade');
            $table->foreignId('master_slot_id')->constrained()->onDelete('cascade');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('franchisee_master_slot');
    }
};
