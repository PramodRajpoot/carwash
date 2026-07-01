<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Booking;
use App\Models\Slot;
use App\Models\ServicePackage;
use App\Models\Franchisee;
use App\Models\Vehicle;
use App\Models\Subscription;
use App\Models\Coupon;
use Carbon\Carbon;

class BookingController extends Controller
{
    public function getPackages(Request $request)
    {
        $vehicleType = $request->input('vehicle_type');
        $query = ServicePackage::query();
        if ($vehicleType) {
            $query->where('vehicle_type', $vehicleType);
        }
        return response()->json($query->get());
    }

    public function getCenters(Request $request)
    {
        $centers = Franchisee::where('status', 'active')->get();
        return response()->json($centers);
    }

    public function checkSlotAvailability(Request $request)
    {
        $request->validate([
            'franchisee_id' => 'required|exists:franchisees,id',
            'date' => 'required|date'
        ]);

        $slots = Slot::where('franchisee_id', $request->franchisee_id)
            ->where('date', $request->date)
            ->where('is_active', true)
            ->get();

        return response()->json($slots);
    }

    public function createBooking(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'vehicle_id' => 'required|exists:vehicles,id',
            'franchisee_id' => 'required|exists:franchisees,id',
            'package_id' => 'required|exists:service_packages,id',
            'booking_date' => 'required|date|after_or_equal:today',
            'slot_time' => 'required|string',
            'payment_method' => 'required|string|in:online,cod,subscription',
            'coupon_code' => 'nullable|string',
        ]);

        $vehicle = Vehicle::where('customer_id', $user->id)->findOrFail($request->vehicle_id);
        $package = ServicePackage::findOrFail($request->package_id);
        $franchisee = Franchisee::findOrFail($request->franchisee_id);

        // Check if there is capacity in the selected slot
        $slot = Slot::where('franchisee_id', $franchisee->id)
            ->where('date', $request->booking_date)
            ->where('time_range', $request->slot_time)
            ->first();

        if ($slot && !$slot->is_active) {
            return response()->json([
                'status' => 'error',
                'message' => 'Selected slot is currently unavailable. Please choose another slot.'
            ], 400);
        }

        if ($slot && $slot->current_bookings >= $slot->max_bookings) {
            return response()->json([
                'status' => 'error',
                'message' => 'Selected slot is fully booked. Please choose another slot.'
            ], 400);
        }

        // Validate package fits vehicle type
        if ($package->vehicle_type !== $vehicle->vehicle_type) {
            return response()->json([
                'status' => 'error',
                'message' => 'The selected package is for ' . $package->vehicle_type . 's, but your vehicle is a ' . $vehicle->vehicle_type
            ], 400);
        }

        // Initialize price
        $price = $package->price;
        $paymentStatus = 'unpaid';

        // Check payment details
        if ($request->payment_method === 'subscription') {
            $subscription = Subscription::where('customer_id', $user->id)
                ->where('package_id', $package->id)
                ->where('status', 'active')
                ->first();

            if (!$subscription) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'No active subscription found for this package'
                ], 400);
            }

            if ($subscription->booking_count >= $package->max_bookings) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Monthly booking limit reached for this subscription'
                ], 400);
            }

            $price = 0.00;
            $paymentStatus = 'paid'; // Subscription is pre-paid
        } else {
            // Apply Coupon if applicable
            if ($request->filled('coupon_code')) {
                $coupon = Coupon::where('code', strtoupper($request->coupon_code))
                    ->where('status', 'active')
                    ->first();

                if ($coupon) {
                    if ($coupon->expires_at && Carbon::parse($coupon->expires_at)->isPast()) {
                        // ignore expired coupon or return error? We just don't apply it
                    } else {
                        if ($coupon->discount_type === 'percentage') {
                            $price -= ($price * ($coupon->discount_value / 100));
                        } else {
                            $price -= $coupon->discount_value;
                        }
                        if ($price < 0) {
                            $price = 0.00;
                        }
                    }
                }
            }
        }

        // Increment or create Slot bookings count
        if ($slot) {
            $slot->increment('current_bookings');
        } else {
            $masterSlot = \App\Models\MasterSlot::where('time_range', $request->slot_time)->first();
            $maxBookings = $masterSlot ? $masterSlot->default_max_bookings : 3;
            
            Slot::create([
                'franchisee_id' => $franchisee->id,
                'date' => $request->booking_date,
                'time_range' => $request->slot_time,
                'max_bookings' => $maxBookings,
                'current_bookings' => 1
            ]);
        }

        $booking = Booking::create([
            'customer_id' => $user->id,
            'vehicle_id' => $vehicle->id,
            'franchisee_id' => $franchisee->id,
            'package_id' => $package->id,
            'booking_date' => $request->booking_date,
            'slot_time' => $request->slot_time,
            'status' => 'pending',
            'payment_status' => $paymentStatus,
            'payment_method' => $request->payment_method,
            'total_price' => $price,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Booking placed successfully',
            'booking' => $booking
        ], 201);
    }

    public function cancelBooking(Request $request, $id)
    {
        $user = $request->user();
        $booking = Booking::findOrFail($id);

        // Ensure user owns booking or is franchisee/admin
        if ($user->role === 'customer' && $booking->customer_id !== $user->id) {
            abort(403);
        }

        if ($booking->status === 'completed' || $booking->status === 'cancelled') {
            return response()->json([
                'status' => 'error',
                'message' => 'Booking cannot be cancelled in its current state'
            ], 400);
        }

        $booking->status = 'cancelled';
        $booking->save();

        // Decrement slot count
        $slot = Slot::where('franchisee_id', $booking->franchisee_id)
            ->where('date', $booking->booking_date)
            ->where('time_range', $booking->slot_time)
            ->first();

        if ($slot && $slot->current_bookings > 0) {
            $slot->decrement('current_bookings');
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Booking cancelled successfully'
        ]);
    }

    public function postponeBooking(Request $request, $id)
    {
        $user = $request->user();
        $booking = Booking::findOrFail($id);

        if ($user->role === 'customer' && $booking->customer_id !== $user->id) {
            abort(403);
        }

        $request->validate([
            'booking_date' => 'required|date|after_or_equal:today',
            'slot_time' => 'required|string',
        ]);

        // Check capacity of the NEW slot
        $newSlot = Slot::where('franchisee_id', $booking->franchisee_id)
            ->where('date', $request->booking_date)
            ->where('time_range', $request->slot_time)
            ->first();

        if ($newSlot && $newSlot->current_bookings >= $newSlot->max_bookings) {
            return response()->json([
                'status' => 'error',
                'message' => 'Selected slot is fully booked. Please choose another slot.'
            ], 400);
        }

        // Decrement OLD slot
        $oldSlot = Slot::where('franchisee_id', $booking->franchisee_id)
            ->where('date', $booking->booking_date)
            ->where('time_range', $booking->slot_time)
            ->first();

        if ($oldSlot && $oldSlot->current_bookings > 0) {
            $oldSlot->decrement('current_bookings');
        }

        // Increment NEW slot
        if ($newSlot) {
            $newSlot->increment('current_bookings');
        } else {
            $masterSlot = \App\Models\MasterSlot::where('time_range', $request->slot_time)->first();
            $maxBookings = $masterSlot ? $masterSlot->default_max_bookings : 3;

            Slot::create([
                'franchisee_id' => $booking->franchisee_id,
                'date' => $request->booking_date,
                'time_range' => $request->slot_time,
                'max_bookings' => $maxBookings,
                'current_bookings' => 1
            ]);
        }

        // Update booking details
        $booking->booking_date = $request->booking_date;
        $booking->slot_time = $request->slot_time;
        $booking->status = 'postponed';
        $booking->save();

        return response()->json([
            'status' => 'success',
            'message' => 'Booking postponed successfully',
            'booking' => $booking
        ]);
    }

    public function applyCoupon(Request $request)
    {
        $request->validate([
            'code' => 'required|string',
            'price' => 'required|numeric'
        ]);

        $coupon = Coupon::where('code', strtoupper($request->code))
            ->where('status', 'active')
            ->first();

        if (!$coupon) {
            return response()->json([
                'status' => 'error',
                'message' => 'Coupon code is invalid'
            ], 400);
        }

        if ($coupon->expires_at && Carbon::parse($coupon->expires_at)->isPast()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Coupon code has expired'
            ], 400);
        }

        $price = $request->price;
        $discountAmount = 0.00;

        if ($coupon->discount_type === 'percentage') {
            $discountAmount = $price * ($coupon->discount_value / 100);
        } else {
            $discountAmount = $coupon->discount_value;
        }

        $finalPrice = $price - $discountAmount;
        if ($finalPrice < 0) {
            $finalPrice = 0.00;
        }

        return response()->json([
            'status' => 'success',
            'code' => $coupon->code,
            'discount_amount' => $discountAmount,
            'final_price' => $finalPrice
        ]);
    }
}
