<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Subscription extends Model
{
    use HasFactory;

    protected $fillable = [
        'customer_id',
        'package_id',
        'status',
        'booking_count',
        'starts_at',
        'expires_at',
        'selected_month',
        'payment_status',
        'paid_amount',
        'payment_method',
        'is_refundable',
        'has_water_electricity',
        'cashfree_order_id',
        'schedules',
    ];

    protected $casts = [
        'starts_at' => 'datetime',
        'expires_at' => 'datetime',
        'booking_count' => 'integer',
        'paid_amount' => 'decimal:2',
        'is_refundable' => 'boolean',
        'has_water_electricity' => 'boolean',
        'schedules' => 'json',
    ];

    public function customer()
    {
        return $this->belongsTo(User::class, 'customer_id');
    }

    public function package()
    {
        return $this->belongsTo(ServicePackage::class, 'package_id');
    }

    public function bookings()
    {
        return $this->hasMany(Booking::class, 'customer_id', 'customer_id')
            ->whereColumn('bookings.package_id', 'subscriptions.package_id');
    }

    public function createScheduledBookings(): void
    {
        $package = $this->package ?: ServicePackage::find($this->package_id);
        if (!$package || !in_array((int) $package->max_bookings, [4, 26], true) || !is_array($this->schedules)) {
            return;
        }

        $scheduleData = $this->schedules;
        $vehicleId = (int) ($scheduleData['vehicle_id'] ?? 0);
        $franchiseeId = (int) ($scheduleData['franchisee_id'] ?? 0);
        $address = (string) ($scheduleData['address'] ?? '');
        $washes = $scheduleData['washes'] ?? [];
        $requiredWashes = (int) $package->max_bookings;

        $vehicle = Vehicle::where('customer_id', $this->customer_id)->find($vehicleId);
        $franchisee = Franchisee::find($franchiseeId);

        if ($vehicle && $franchisee && count($washes) === $requiredWashes) {
            foreach ($washes as $wash) {
                $bookingDate = \Carbon\Carbon::parse($wash['date'])->format('Y-m-d');
                $slotTime = (string) ($wash['slot'] ?? '');
                if ($slotTime === '' && $requiredWashes === 26) {
                    $masterSlot = MasterSlot::where('status', 'active')->orderBy('id')->first();
                    $slotTime = $masterSlot ? $masterSlot->time_range : '09:00 AM - 11:00 AM';
                }

                $exists = Booking::where('customer_id', $this->customer_id)
                    ->where('package_id', $this->package_id)
                    ->where('booking_date', $bookingDate)
                    ->where('slot_time', $slotTime)
                    ->where('payment_method', 'subscription')
                    ->exists();

                if (!$exists) {
                    $subPkgPrice = (float) ($package->price ?? 0);
                    $subGstAmount = (float) round($subPkgPrice * 0.18);
                    $subTotalPrice = (float) round($subPkgPrice + $subGstAmount);

                    Booking::create([
                        'customer_id' => $this->customer_id,
                        'vehicle_id' => $vehicle->id,
                        'franchisee_id' => $franchisee->id,
                        'package_id' => $this->package_id,
                        'booking_date' => $bookingDate,
                        'slot_time' => $slotTime,
                        'address' => $address,
                        'status' => 'pending',
                        'payment_status' => 'paid',
                        'payment_method' => 'subscription',
                        'payment_type' => 'full',
                        'advance_amount' => $subTotalPrice,
                        'paid_amount' => $subTotalPrice,
                        'total_price' => $subTotalPrice,
                        'gst_amount' => $subGstAmount,
                    ]);
                    \App\Http\Controllers\BookingController::syncSlotBookings($franchisee->id, $bookingDate, $slotTime);
                }
            }
            $this->update(['booking_count' => $requiredWashes]);
        }
    }
}
