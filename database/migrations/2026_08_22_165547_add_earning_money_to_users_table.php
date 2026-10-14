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
        Schema::table('users', function (Blueprint $table) {
            $table->decimal('earning_money', 10, 2)->default(0.00)->after('pending_epoints');
        });

        Schema::table('bookings', function (Blueprint $table) {
            $table->decimal('earning_money_used', 10, 2)->default(0.00)->after('epoints_used');
        });

        Schema::table('withdrawal_requests', function (Blueprint $table) {
            $table->string('type')->default('e_points')->after('amount');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('earning_money');
        });

        Schema::table('bookings', function (Blueprint $table) {
            $table->dropColumn('earning_money_used');
        });

        Schema::table('withdrawal_requests', function (Blueprint $table) {
            $table->dropColumn('type');
        });
    }
};
