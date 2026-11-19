<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('subscriptions', function (Blueprint $table) {
            $table->string('selected_month', 7)->nullable()->after('expires_at');
            $table->string('payment_status')->default('paid')->after('selected_month');
            $table->decimal('paid_amount', 10, 2)->default(0)->after('payment_status');
            $table->string('payment_method')->default('online')->after('paid_amount');
            $table->boolean('is_refundable')->default(false)->after('payment_method');
            $table->string('cashfree_order_id')->nullable()->after('is_refundable');
        });
    }

    public function down(): void
    {
        Schema::table('subscriptions', function (Blueprint $table) {
            $table->dropColumn([
                'selected_month',
                'payment_status',
                'paid_amount',
                'payment_method',
                'is_refundable',
                'cashfree_order_id',
            ]);
        });
    }
};
