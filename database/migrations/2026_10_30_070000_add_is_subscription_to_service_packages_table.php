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
        Schema::table('service_packages', function (Blueprint $table) {
            $table->boolean('is_subscription')->default(false)->after('is_addon');
        });

        // Mark existing recurring subscription plans as subscription packages
        DB::table('service_packages')
            ->where('is_addon', false)
            ->where('frequency_days', '>=', 30)
            ->where('max_bookings', '>', 1)
            ->update(['is_subscription' => true]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('service_packages', function (Blueprint $table) {
            $table->dropColumn('is_subscription');
        });
    }
};
