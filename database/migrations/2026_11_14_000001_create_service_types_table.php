<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('service_types', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code')->unique();
            $table->text('description')->nullable();
            $table->string('status')->default('active'); // active, inactive
            $table->timestamps();
        });

        // Seed default initial service types
        DB::table('service_types')->insert([
            [
                'name' => 'Hatchback',
                'code' => 'hatchback',
                'description' => 'Compact 2-door and 4-door hatchback vehicles',
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Sedan',
                'code' => 'sedan',
                'description' => 'Standard 4-door saloon/sedan vehicles',
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'SUV',
                'code' => 'suv',
                'description' => 'Sports utility vehicles, compact SUVs, and crossovers',
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Commercial',
                'code' => 'commercial',
                'description' => 'Light commercial vehicles and vans',
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Bus',
                'code' => 'bus',
                'description' => 'Standard passenger buses',
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Volvo Bus',
                'code' => 'volvo_bus',
                'description' => 'Luxury multi-axle / Volvo passenger coaches',
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('service_types');
    }
};

