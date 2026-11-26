<?php

use Illuminate\Database\Migrations\Migration;
use App\Models\Booking;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $bookings = Booking::with('package')
            ->where(function ($q) {
                $q->where('total_price', '<=', 0)
                  ->orWhere('paid_amount', '<=', 0);
            })
            ->where(function ($q) {
                $q->where('payment_method', 'subscription')
                  ->orWhereHas('package', function ($p) {
                      $p->where('is_subscription', 1)->orWhereIn('max_bookings', [4, 26]);
                  });
            })
            ->get();

        foreach ($bookings as $b) {
            if ($b->package && (float)$b->package->price > 0) {
                $base = (float)$b->package->price;
                $gst = (float)round($base * 0.18);
                $total = (float)round($base + $gst);

                $b->update([
                    'total_price' => $total,
                    'gst_amount' => $gst,
                    'paid_amount' => $total,
                    'advance_amount' => $total,
                ]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No reversal needed for pricing backfill
    }
};
