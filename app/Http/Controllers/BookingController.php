<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Booking;
use App\Models\Slot;
use App\Models\ServicePackage;
use App\Models\ServiceCategory;
use App\Models\Franchisee;
use App\Models\Vehicle;
use App\Models\Subscription;
use App\Models\Coupon;
use Carbon\Carbon;

class BookingController extends Controller
{
    public function getCategories(Request $request)
    {
        $categories = ServiceCategory::where('status', 'active')->get();
        return response()->json($categories);
    }

    public function getPackages(Request $request)
    {
        $vehicleType = $request->input('vehicle_type');
        $categoryId = $request->input('category_id');
        $query = ServicePackage::with(['category', 'addons']);

        if ($request->has('is_addon')) {
            $query->where('is_addon', filter_var($request->is_addon, FILTER_VALIDATE_BOOLEAN));
        }

        if ($categoryId && $categoryId !== 'all') {
            $query->where('category_id', $categoryId);
        }

        if ($vehicleType && $vehicleType !== 'all') {
            $query->where(function($q) use ($vehicleType) {
                $q->where('vehicle_type', $vehicleType)
                  ->orWhere('vehicle_type', 'all');
            });
        }

        return response()->json($query->get());
    }

    public function getCenters(Request $request)
    {
        $centers = Franchisee::where('status', 'active')->get();
        return response()->json($centers);
    }

    public function getOffers(Request $request)
    {
        $offers = Coupon::where('status', 'active')
            ->where(function($query) {
                $query->whereNull('expires_at')
                      ->orWhere('expires_at', '>=', Carbon::now());
            })
            ->get();
        return response()->json($offers);
    }

    /**
     * Synchronize a slot's current_bookings count based strictly on actual bookings
     * where full payment or at least ₹99 has been paid.
     * Failed or unpaid/pending payments do NOT book the slot.
     */
    public static function syncSlotBookings($franchiseeId, $bookingDate, $slotTime)
    {
        if (!$franchiseeId || !$bookingDate || !$slotTime) {
            return;
        }

        $activeWashersCount = \App\Models\Washer::where('franchisee_id', $franchiseeId)
            ->where('status', 'active')
            ->count();
        $washerCapacity = $activeWashersCount > 0 ? $activeWashersCount : 1;

        $actual = Booking::where('franchisee_id', $franchiseeId)
            ->where('booking_date', $bookingDate)
            ->where('slot_time', $slotTime)
            ->slotBooked()
            ->count();

        $slot = Slot::where('franchisee_id', $franchiseeId)
            ->where('date', $bookingDate)
            ->where('time_range', $slotTime)
            ->first();

        $effectiveMax = $washerCapacity;
        if ($slot && $slot->max_bookings && $slot->max_bookings <= $washerCapacity) {
            $effectiveMax = $slot->max_bookings;
        }

        if ($slot) {
            $slot->current_bookings = $actual;
            $slot->max_bookings = $effectiveMax;
            $slot->save();
        } else {
            Slot::create([
                'franchisee_id' => $franchiseeId,
                'date' => $bookingDate,
                'time_range' => $slotTime,
                'max_bookings' => $effectiveMax,
                'current_bookings' => $actual,
                'is_active' => true,
                'status' => 'active'
            ]);
        }
    }

    public function checkSlotAvailability(Request $request)
    {
        $request->validate([
            'franchisee_id' => 'required|exists:franchisees,id',
            'date' => 'required|date'
        ]);

        $activeWashersCount = \App\Models\Washer::where('franchisee_id', $request->franchisee_id)
            ->where('status', 'active')
            ->count();
        // Slot capacity cannot exceed active washers available at the center (default 1)
        $washerCapacity = $activeWashersCount > 0 ? $activeWashersCount : 1;

        $slots = Slot::where('franchisee_id', $request->franchisee_id)
            ->where('date', $request->date)
            ->where('is_active', true)
            ->get();

        if ($slots->isEmpty()) {
            $masterSlots = \App\Models\MasterSlot::where('status', 'active')->orderBy('id', 'asc')->get();
            $generatedSlots = [];
            foreach ($masterSlots as $ms) {
                $maxCap = min($ms->default_max_bookings ?? 1, $washerCapacity);
                $slot = Slot::firstOrCreate(
                    [
                        'franchisee_id' => $request->franchisee_id,
                        'date' => $request->date,
                        'time_range' => $ms->time_range
                    ],
                    [
                        'max_bookings' => $maxCap,
                        'current_bookings' => 0,
                        'is_active' => true,
                        'status' => 'active'
                    ]
                );
                $generatedSlots[] = $slot;
            }
            $slots = collect($generatedSlots);
        }

        foreach ($slots as $slot) {
            $actual = Booking::where('franchisee_id', $request->franchisee_id)
                ->where('booking_date', $request->date)
                ->where('slot_time', $slot->time_range)
                ->slotBooked()
                ->count();
            if ($slot->current_bookings !== $actual) {
                $slot->current_bookings = $actual;
            }
            $max = $washerCapacity;
            if ($slot->max_bookings && $slot->max_bookings <= $washerCapacity) {
                $max = $slot->max_bookings;
            }
            $slot->max_bookings = $max;
            $slot->save();
            $slot->is_full = ($slot->current_bookings >= $max);
        }

        return response()->json($slots);
    }

    public function createBooking(Request $request)
    {
        $user = $request->user();

        if ($user->status !== 'active') {
            return response()->json([
                'status'  => 'error',
                'message' => 'Your account is currently blocked/suspended. You cannot book any services. Please contact support.',
            ], 403);
        }

        // Auto-provision or assign home vehicle if booking a Home Cleaning service
        $isHomeCleaning = false;
        $carTypes = ['hatchback', 'sedan', 'suv', 'luxury', 'commercial', 'bus', 'volvo_bus', 'all'];
        if ($request->filled('package_id')) {
            $requestedPkg = ServicePackage::with('category')->find($request->package_id);
            $isHomeCleaning = $requestedPkg && (
                !in_array(strtolower($requestedPkg->vehicle_type ?? ''), $carTypes) ||
                ($requestedPkg->category && stripos($requestedPkg->category->name, 'home') !== false) ||
                stripos($requestedPkg->name, 'sofa') !== false ||
                stripos($requestedPkg->name, 'home') !== false ||
                stripos($requestedPkg->vehicle_type, 'sofa') !== false ||
                stripos($requestedPkg->vehicle_type, 'seator') !== false
            );

            if ($isHomeCleaning) {
                $homeVehicle = Vehicle::where('customer_id', $user->id)
                    ->where('vehicle_type', 'home')
                    ->first();
                if (!$homeVehicle) {
                    $homeVehicle = Vehicle::create([
                        'customer_id'  => $user->id,
                        'make_model'   => 'Doorstep Home Care',
                        'plate_number' => 'HOME',
                        'vehicle_type' => 'home',
                    ]);
                }
                $request->merge(['vehicle_id' => $homeVehicle->id]);
            }
        }

        $request->validate([
            'vehicle_id' => 'required|exists:vehicles,id',
            'franchisee_id' => 'required|exists:franchisees,id',
            'package_id' => 'required|exists:service_packages,id',
            'booking_date' => 'required|date|after_or_equal:today',
            'slot_time' => 'required|string',
            'address' => 'required|string|min:5|max:1000',
            'save_as_default_address' => 'nullable|boolean',
            'payment_method' => 'required|string|in:online,cod',
            'coupon_code' => 'nullable|string',
            'addon_ids' => 'nullable|array',
            'addon_ids.*' => 'exists:service_packages,id',
            'use_epoints' => 'nullable|boolean',
            'use_earning_money' => 'nullable|boolean',
            'payment_type' => 'nullable|string|in:full,partial',
            'remaining_payment_method' => 'nullable|string|in:online,cod',
            'has_water_electricity' => 'nullable|boolean',
        ]);

        $vehicle = Vehicle::where('customer_id', $user->id)->findOrFail($request->vehicle_id);
        $package = ServicePackage::findOrFail($request->package_id);
        $franchisee = Franchisee::findOrFail($request->franchisee_id);

        // Check if there is capacity in the selected slot
        $activeWashersCount = \App\Models\Washer::where('franchisee_id', $franchisee->id)
            ->where('status', 'active')
            ->count();
        $washerCapacity = $activeWashersCount > 0 ? $activeWashersCount : 1;

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

        $effectiveMax = $slot ? min($slot->max_bookings, $washerCapacity) : $washerCapacity;
        $actualCurrentBookings = Booking::where('franchisee_id', $franchisee->id)
            ->where('booking_date', $request->booking_date)
            ->where('slot_time', $request->slot_time)
            ->slotBooked()
            ->count();

        if ($actualCurrentBookings >= $effectiveMax) {
            return response()->json([
                'status' => 'error',
                'message' => 'Selected slot is fully booked. Please choose another slot.'
            ], 400);
        }

        // Validate package fits vehicle type (only for vehicle/carwash packages, skip for Home Cleaning or 'all')
        $isNonVehiclePackage = $isHomeCleaning || !in_array(strtolower($package->vehicle_type ?? ''), $carTypes);
        if (!$isNonVehiclePackage && $package->vehicle_type !== 'all' && $package->vehicle_type !== $vehicle->vehicle_type) {
            return response()->json([
                'status' => 'error',
                'message' => 'The selected package is for ' . $package->vehicle_type . 's, but your vehicle is a ' . $vehicle->vehicle_type
            ], 400);
        }

        // Prevent double booking of 4-wash subscription on the same day
        if ((int) $package->max_bookings === 4) {
            $alreadyBookedThatDay = Booking::where('customer_id', $user->id)
                ->where('package_id', $package->id)
                ->where('booking_date', $request->booking_date)
                ->where('payment_method', 'subscription')
                ->whereNotIn('status', ['cancelled'])
                ->exists();

            if ($alreadyBookedThatDay) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'The 4-wash plan allows one wash on each separate day.'
                ], 400);
            }
        }

        // Initialize price
        $price = $package->price;
        $paymentStatus = 'unpaid';

        $addonPrice = 0;
        $addonServices = [];

        if ($request->filled('addon_ids')) {
            $addons = ServicePackage::whereIn('id', $request->addon_ids)->get();
            foreach ($addons as $addon) {
                $addonPrice += $addon->price;
                $addonServices[] = [
                    'id' => $addon->id,
                    'name' => $addon->name,
                    'price' => (float)$addon->price
                ];
            }
        }

        $price += $addonPrice;

        $completedWashesCount = Booking::where('customer_id', $user->id)
            ->where('status', 'completed')
            ->count();
        // A wash only counts as a prior wash if it actually booked a slot (paid ₹99 or full amount)
        $priorWashExists = Booking::where('customer_id', $user->id)
            ->slotBooked()
            ->exists();
        $tookFirstWashDiscount = Booking::where('customer_id', $user->id)
            ->where('coupon_code', 'FIRSTWASH10')
            ->slotBooked()
            ->exists();

        // Only the first wash gets 10% discount. Once a wash is booked with paid 99 or full amount, rest washes can use points & earning money.
        $isFirstWash = (!$priorWashExists && !$tookFirstWashDiscount);
        $canUsePoints = !$isFirstWash;

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

            $bookingDate = Carbon::parse($request->booking_date);
            if ($subscription->selected_month && $bookingDate->format('Y-m') !== $subscription->selected_month) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'This subscription can only be used in ' . $subscription->selected_month . '.'
                ], 400);
            }

            if ($subscription->expires_at && $bookingDate->gt(Carbon::parse($subscription->expires_at)->endOfDay())) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'This subscription has expired for the selected month.'
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
            // Apply Coupon or First Wash 10% Discount
            $couponCode = null;
            $couponDiscount = 0.00;

            if ($isFirstWash) {
                // First wash automatically gets 10% discount
                $couponDiscount = (float) round($price * 0.10, 2);
                $couponCode = 'FIRSTWASH10';
                $price -= $couponDiscount;
                if ($price < 0) {
                    $price = 0.00;
                }
            } elseif ($request->filled('coupon_code')) {
                $coupon = Coupon::where('code', strtoupper($request->coupon_code))
                    ->where('status', 'active')
                    ->first();

                if ($coupon) {
                    if ($coupon->expires_at && Carbon::parse($coupon->expires_at)->isPast()) {
                        return response()->json([
                            'status' => 'error',
                            'message' => 'Coupon code has expired'
                        ], 400);
                    }

                    // Check if coupon is restricted to a specific vehicle category
                    if (!$isHomeCleaning && $coupon->vehicle_type && $coupon->vehicle_type !== 'all' && strtolower($coupon->vehicle_type) !== strtolower($vehicle->vehicle_type)) {
                        return response()->json([
                            'status' => 'error',
                            'message' => 'Coupon ' . $coupon->code . ' is only valid for ' . ucfirst($coupon->vehicle_type) . ' vehicles, but your vehicle is a ' . ucfirst($vehicle->vehicle_type) . '.'
                        ], 400);
                    }

                    if ($coupon->discount_type === 'percentage') {
                        $couponDiscount = (float) round($price * ($coupon->discount_value / 100));
                    } else {
                        $couponDiscount = min((float) round($coupon->discount_value), (float)$price);
                    }

                    $price -= $couponDiscount;
                    if ($price < 0) {
                        $price = 0.00;
                    }
                    $couponCode = $coupon->code;
                } else {
                    return response()->json([
                        'status' => 'error',
                        'message' => 'Coupon code is invalid'
                    ], 400);
                }
            }
        }

        // Apply E-Points if requested (allowed on rest washes, after first wash is taken/booked)
        $epointsUsed = 0;
        if ($canUsePoints && $request->boolean('use_epoints')) {
            if ($user->e_points > 0) {
                $maxPointsAllowed = (int) floor($price * 0.125);
                $epointsUsed = min($user->e_points, $maxPointsAllowed);
                if ($epointsUsed > 0) {
                    $price -= $epointsUsed;
                    $user->decrement('e_points', $epointsUsed);
                }
            }
        }

        // Apply Earning Money if requested (allowed on rest washes, after first wash is taken/booked)
        $earningMoneyUsed = 0.00;
        if ($canUsePoints && $request->boolean('use_earning_money')) {
            if ($user->earning_money > 0) {
                $earningMoneyUsed = min($user->earning_money, $price);
                if ($earningMoneyUsed > 0) {
                    $price -= $earningMoneyUsed;
                    $user->decrement('earning_money', $earningMoneyUsed);
                }
            }
        }

        // Calculate 18% GST on taxable subtotal (unless subscription booking)
        $taxableSubtotal = max(0, (float)$price);
        $gstAmount = ($request->payment_method === 'subscription') ? 0.00 : (float) round($taxableSubtotal * 0.18);
        $totalPrice = (float) round($taxableSubtotal + $gstAmount);

        // Determine payment type and advance amount
        $paymentType = 'full';
        $advanceAmount = $totalPrice;
        $paymentMethod = $request->payment_method;
        if ($request->input('payment_type') === 'partial' && $totalPrice > 99) {
            $paymentType = 'partial';
            $advanceAmount = 99.00;
            if ($request->filled('remaining_payment_method')) {
                $paymentMethod = $request->remaining_payment_method;
            }
        }

        // For online payments or advance bookings, mark as pending_payment until Cashfree checkout completes
        if ($request->payment_method === 'online' || $paymentType === 'partial') {
            if ($totalPrice <= 0) {
                $paymentStatus = 'paid';
            } else {
                $paymentStatus = 'pending_payment';
            }
        }

        $bookingAddress = trim($request->input('address'));
        if ($request->boolean('save_as_default_address') || empty($user->address)) {
            $user->update(['address' => $bookingAddress]);
        }

        $booking = Booking::create([
            'customer_id' => $user->id,
            'vehicle_id' => $vehicle->id,
            'franchisee_id' => $franchisee->id,
            'package_id' => $package->id,
            'booking_date' => $request->booking_date,
            'slot_time' => $request->slot_time,
            'address' => $bookingAddress,
            'status' => 'pending',
            'payment_status' => $paymentStatus,
            'payment_method' => $paymentMethod,
            'payment_type' => $paymentType,
            'advance_amount' => $advanceAmount,
            'paid_amount' => 0.00,
            'total_price' => $totalPrice,
            'gst_amount' => $gstAmount,
            'addon_price' => $addonPrice,
            'addon_services' => empty($addonServices) ? null : $addonServices,
            'coupon_code' => $couponCode,
            'coupon_discount' => $couponDiscount,
            'epoints_used' => $epointsUsed,
            'earning_money_used' => $earningMoneyUsed,
            'has_water_electricity' => $request->boolean('has_water_electricity', true),
        ]);

        if ($request->payment_method === 'subscription' && isset($subscription)) {
            $subscription->increment('booking_count');
            $subscription->refresh();
        }

        // Sync slot bookings count: slot is ONLY booked if user paid full payment (e.g. subscription or zero-price).
        // If payment is pending/failed/unpaid, the slot is NOT booked until payment completes.
        self::syncSlotBookings($franchisee->id, $request->booking_date, $request->slot_time);

        if ($epointsUsed > 0) {
            \App\Models\WalletTransaction::create([
                'user_id'     => $user->id,
                'type'        => 'debit',
                'amount'      => $epointsUsed,
                'source'      => 'booking',
                'status'      => 'confirmed',
                'description' => "Used {$epointsUsed} E-Points for booking #{$booking->id}",
            ]);

            \App\Models\NotificationLog::create([
                'user_id' => $user->id,
                'type'    => 'wallet_credit',
                'title'   => 'E-Points Used',
                'body'    => "You used {$epointsUsed} E-Points for booking #{$booking->id}.",
            ]);
        }

        if ($earningMoneyUsed > 0) {
            \App\Models\WalletTransaction::create([
                'user_id'     => $user->id,
                'type'        => 'debit',
                'amount'      => $earningMoneyUsed,
                'source'      => 'booking_earning',
                'status'      => 'confirmed',
                'description' => "Used ₹{$earningMoneyUsed} Earning Money for booking #{$booking->id}",
            ]);

            \App\Models\NotificationLog::create([
                'user_id' => $user->id,
                'type'    => 'wallet_credit',
                'title'   => 'Earning Money Used',
                'body'    => "You used ₹{$earningMoneyUsed} Earning Money for booking #{$booking->id}.",
            ]);
        }

        // Reward pending e-points to the referrer if this is the customer's first booking
        if ($user->referred_by && $user->first_booking_discount) {
            $isFirstBooking = Booking::where('customer_id', $user->id)->count() === 1;
            if ($isFirstBooking) {
                $referrer = \App\Models\User::find($user->referred_by);
                if ($referrer) {
                    $pendingCommission = (int) round($booking->total_price * 0.10);
                    $referrer->increment('pending_epoints', $pendingCommission);
                }
            }
        }

        $responseData = [
            'status' => 'success',
            'message' => 'Booking placed successfully',
            'booking' => $booking,
            'saved_address' => $user->fresh()->address,
        ];

        // Signal frontend to initiate Cashfree checkout
        if ($request->payment_method === 'online' && $price > 0) {
            $responseData['requires_payment'] = true;
            $responseData['message'] = 'Booking created. Please complete payment.';
        }

        return response()->json($responseData, 201);
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

        if ($booking->payment_method === 'subscription') {
            $subscription = Subscription::where('customer_id', $booking->customer_id)
                ->where('package_id', $booking->package_id)
                ->where('status', 'active')
                ->first();
            if ($subscription && $subscription->booking_count > 0) {
                $subscription->decrement('booking_count');
            }
        }

        // Refund points if epoints_used > 0
        if ($booking->epoints_used > 0) {
            $customer = $booking->customer;
            if ($customer) {
                $customer->increment('e_points', $booking->epoints_used);

                \App\Models\WalletTransaction::create([
                    'user_id'     => $customer->id,
                    'type'        => 'credit',
                    'amount'      => $booking->epoints_used,
                    'source'      => 'booking_refund',
                    'status'      => 'confirmed',
                    'description' => "Refunded {$booking->epoints_used} E-Points for cancelled booking #{$booking->id}",
                ]);

                \App\Models\NotificationLog::create([
                    'user_id' => $customer->id,
                    'type'    => 'wallet_credit',
                    'title'   => 'E-Points Refunded',
                    'body'    => "Refunded {$booking->epoints_used} E-Points for cancelled booking #{$booking->id}.",
                ]);
            }
        }

        // Refund earning money if earning_money_used > 0
        if ($booking->earning_money_used > 0) {
            $customer = $booking->customer;
            if ($customer) {
                $customer->increment('earning_money', $booking->earning_money_used);

                \App\Models\WalletTransaction::create([
                    'user_id'     => $customer->id,
                    'type'        => 'credit',
                    'amount'      => $booking->earning_money_used,
                    'source' => 'booking_earning_refund',
                    'status'      => 'confirmed',
                    'description' => "Refunded ₹{$booking->earning_money_used} Earning Money for cancelled booking #{$booking->id}",
                ]);

                \App\Models\NotificationLog::create([
                    'user_id' => $customer->id,
                    'type'    => 'wallet_credit',
                    'title'   => 'Earning Money Refunded',
                    'body'    => "Refunded ₹{$booking->earning_money_used} Earning Money for cancelled booking #{$booking->id}.",
                ]);
            }
        }

        // If this was the first booking, revert the pending e-points from the referrer
        if ($booking->customer->referred_by && $booking->customer->first_booking_discount) {
            $isFirstBooking = Booking::where('customer_id', $booking->customer_id)
                ->orderBy('id', 'asc')->first();
            if ($isFirstBooking && $isFirstBooking->id === $booking->id) {
                $referrer = \App\Models\User::find($booking->customer->referred_by);
                if ($referrer) {
                    $pendingCommission = (int) round($booking->total_price * 0.10);
                    $referrer->pending_epoints = max(0, $referrer->pending_epoints - $pendingCommission);
                    $referrer->save();
                }
            }
        }

        // Synchronize slot count: only bookings with full payment or at least ₹99 occupy slots
        self::syncSlotBookings($booking->franchisee_id, $booking->booking_date, $booking->slot_time);

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

        if ($booking->status === 'completed') {
            return response()->json([
                'status' => 'error',
                'message' => 'Completed wash bookings cannot be edited or rescheduled.'
            ], 422);
        }

        if ($booking->status === 'cancelled') {
            $isPaid99 = ((float) $booking->paid_amount >= 99) || ($booking->payment_status === 'partially_paid');
            if (!$isPaid99) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Cancelled bookings cannot be rescheduled unless advance payment was completed.'
                ], 422);
            }
        }

        $request->validate([
            'booking_date' => 'required|date|after_or_equal:today',
            'slot_time' => 'required|string',
        ]);

        // Check capacity of the NEW slot
        $activeWashersCount = \App\Models\Washer::where('franchisee_id', $booking->franchisee_id)
            ->where('status', 'active')
            ->count();
        $washerCapacity = $activeWashersCount > 0 ? $activeWashersCount : 1;

        $newSlot = Slot::where('franchisee_id', $booking->franchisee_id)
            ->where('date', $request->booking_date)
            ->where('time_range', $request->slot_time)
            ->first();

        $effectiveNewMax = $newSlot ? min($newSlot->max_bookings, $washerCapacity) : $washerCapacity;
        $actualNewCount = Booking::where('franchisee_id', $booking->franchisee_id)
            ->where('booking_date', $request->booking_date)
            ->where('slot_time', $request->slot_time)
            ->slotBooked()
            ->count();

        if ($actualNewCount >= $effectiveNewMax) {
            return response()->json([
                'status' => 'error',
                'message' => 'Selected slot is fully booked. Please choose another slot.'
            ], 400);
        }

        $oldDate = $booking->booking_date;
        $oldSlotTime = $booking->slot_time;

        // Update booking details
        $booking->booking_date = $request->booking_date;
        $booking->slot_time = $request->slot_time;
        $booking->status = 'postponed';
        $booking->save();

        // Synchronize both old and new slots based on actual paid bookings
        self::syncSlotBookings($booking->franchisee_id, $oldDate, $oldSlotTime);
        self::syncSlotBookings($booking->franchisee_id, $request->booking_date, $request->slot_time);

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

        $user = $request->user();
        if ($user) {
            $priorWashExists = Booking::where('customer_id', $user->id)
                ->slotBooked()
                ->exists();
            $tookFirstWashDiscount = Booking::where('customer_id', $user->id)
                ->where('coupon_code', 'FIRSTWASH10')
                ->slotBooked()
                ->exists();

            $isFirstWash = (!$priorWashExists && !$tookFirstWashDiscount);
            if ($isFirstWash) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'First wash already includes 10% discount! Additional coupons cannot be stacked.'
                ], 400);
            }
        }

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

        // Check vehicle category compatibility if coupon is restricted
        if ($coupon->vehicle_type && $coupon->vehicle_type !== 'all') {
            $isHomeCleaningCoupon = false;
            if ($request->filled('package_id')) {
                $pkg = ServicePackage::with('category')->find($request->package_id);
                $isHomeCleaningCoupon = $pkg && (
                    ($pkg->category && stripos($pkg->category->name, 'home') !== false) ||
                    stripos($pkg->name, 'sofa') !== false ||
                    stripos($pkg->name, 'home') !== false ||
                    stripos($pkg->vehicle_type, 'sofa') !== false
                );
            }
            if (!$isHomeCleaningCoupon) {
                $vehicleType = $request->input('vehicle_type');
                if (!$vehicleType && $request->filled('vehicle_id')) {
                    $vehicle = Vehicle::find($request->vehicle_id);
                    $vehicleType = $vehicle?->vehicle_type;
                }

                if ($vehicleType && strtolower($coupon->vehicle_type) !== strtolower($vehicleType)) {
                    return response()->json([
                        'status' => 'error',
                        'message' => 'Coupon ' . $coupon->code . ' is only valid for ' . ucfirst($coupon->vehicle_type) . ' vehicles.'
                    ], 400);
                }
            }
        }

        $price = (float) $request->price;
        $discountAmount = 0.00;

        if ($coupon->discount_type === 'percentage') {
            $discountAmount = (float) round($price * ($coupon->discount_value / 100));
        } else {
            $discountAmount = (float) round($coupon->discount_value);
        }

        $finalPrice = max(0, (float) round($price - $discountAmount));

        return response()->json([
            'status' => 'success',
            'code' => $coupon->code,
            'discount_amount' => $discountAmount,
            'final_price' => $finalPrice
        ]);
    }

    public function updatePaymentMethod(Request $request, $id)
    {
        $request->validate([
            'payment_method' => 'required|string|in:online,cod'
        ]);

        $user = $request->user();
        $booking = Booking::where('customer_id', $user->id)->findOrFail($id);

        if ($booking->payment_status === 'paid' || $booking->status === 'cancelled' || $booking->status === 'completed') {
            return response()->json([
                'status' => 'error',
                'message' => 'Cannot update payment method for a completed or cancelled booking'
            ], 400);
        }

        $booking->payment_method = $request->payment_method;
        $booking->save();

        return response()->json([
            'status' => 'success',
            'message' => $request->payment_method === 'cod'
                ? 'Payment method updated to COD. You can pay the remaining balance in cash upon wash completion.'
                : 'Payment method updated to Online.',
            'booking' => $booking
        ]);
    }

    public function downloadInvoice(Request $request, $id)
    {
        $user = $request->user();
        $booking = Booking::with(['customer', 'vehicle', 'franchisee', 'package'])
            ->where(function ($query) use ($user) {
                if ($user->role === 'customer') {
                    $query->where('customer_id', $user->id);
                } elseif ($user->role === 'franchisee') {
                    $query->where('franchisee_id', $user->franchisee->id ?? 0);
                }
            })
            ->findOrFail($id);

        return view('invoice.booking', compact('booking'));
    }
}
