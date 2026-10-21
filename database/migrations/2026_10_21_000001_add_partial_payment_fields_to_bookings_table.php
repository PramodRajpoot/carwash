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
        Schema::table('bookings', function (Blueprint $table) {
            $table->string('payment_type')->default('full')->after('payment_method'); // full, partial
            $table->decimal('advance_amount', 10, 2)->default(0.00)->after('total_price');
            $table->decimal('paid_amount', 10, 2)->default(0.00)->after('advance_amount');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropColumn(['payment_type', 'advance_amount', 'paid_amount']);
        });
    }
};
