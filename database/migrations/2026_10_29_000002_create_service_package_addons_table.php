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
        Schema::create('service_package_addons', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('package_id');
            $table->unsignedBigInteger('addon_id');
            $table->timestamps();

            $table->foreign('package_id')->references('id')->on('service_packages')->onDelete('cascade');
            $table->foreign('addon_id')->references('id')->on('service_packages')->onDelete('cascade');
            $table->unique(['package_id', 'addon_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('service_package_addons');
    }
};
