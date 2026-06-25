<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Drop the old pivot table
        Schema::dropIfExists('franchisee_master_slot');

        // Rename slots table to franchisee_master_slot
        Schema::rename('slots', 'franchisee_master_slot');
    }

    public function down(): void
    {
        // Reverse: rename back
        Schema::rename('franchisee_master_slot', 'slots');

        // Recreate the old pivot table
        Schema::create('franchisee_master_slot', function (Blueprint $table) {
            $table->id();
            $table->foreignId('franchisee_id')->constrained()->onDelete('cascade');
            $table->foreignId('master_slot_id')->constrained()->onDelete('cascade');
            $table->timestamps();
        });
    }
};
