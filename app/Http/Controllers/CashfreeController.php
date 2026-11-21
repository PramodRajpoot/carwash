<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use App\Models\Booking;
use App\Models\PaymentGateway;
use App\Models\Subscription;
use App\Models\ServicePackage;
use App\Models\NotificationLog;
use Carbon\Carbon;

class CashfreeController extends Controller
{
    /**
     * Get Cashfree credentials from the payment_gateways table.
     */
    private function getCredentials()
    {
        $gateway = PaymentGateway::where('slug', 'cashfree')
            ->where('is_active', true)
            ->first();

        if (!$gateway || empty($gateway->config)) {
            return null;
        }

        $config = $gateway->config;
        $environment = $config['environment'] ?? 'sandbox';

        return [
            'client_id'     => $config['client_id'] ?? '',
            'client_secret' => $config['client_secret'] ?? '',
            'environment'   => $environment,
            'base_url'      => $environment === 'production'
                ? 'https://api.cashfree.com/pg'
                : 'https://sandbox.cashfree.com/pg',
        ];
    }

    /**
     * Create a Cashfree order for an existing booking.
     * POST /api/cashfree/create-order
     */
    public function createOrder(Request $request)
    {
        $request->validate([
            'booking_id'    => 'required|integer|exists:bookings,id',
            'payment_split' => 'nullable|string|in:full,half,remaining,partial,advance',
        ]);

        $user = $request->user();
        $booking = Booking::findOrFail($request->booking_id);

        // Ensure booking belongs to the current user
        if ($booking->customer_id !== $user->id) {
            return response()->json(['status' => 'error', 'message' => 'Unauthorized'], 403);
        }

        // Ensure booking is in an appropriate state for payment
        if ($booking->payment_status === 'paid') {
            return response()->json(['status' => 'error', 'message' => 'Booking already paid'], 400);
        }

        if ($booking->status === 'cancelled') {
            return response()->json(['status' => 'error', 'message' => 'Cannot pay for a cancelled booking'], 400);
        }

        $credentials = $this->getCredentials();
        if (!$credentials || empty($credentials['client_id'])) {
            return response()->json([
                'status' => 'error',
                'message' => 'Cashfree payment gateway is not configured. Please contact admin.'
            ], 500);
        }

        // Calculate amount to pay for this transaction
        $isPartiallyPaid = ($booking->payment_status === 'partially_paid') || ((float) $booking->paid_amount > 0);

        if ($isPartiallyPaid) {
            // Paying remaining balance: full or half
            $remainingDue = max(0, (float) $booking->total_price - (float) $booking->paid_amount);
            if ($request->input('payment_split') === 'half' && $remainingDue > 1) {
                $orderAmount = round($remainingDue / 2, 2);
            } else {
                $orderAmount = round($remainingDue, 2);
            }
        } elseif ($booking->payment_type === 'partial' && (float) $booking->paid_amount <= 0) {
            // Paying initial slot booking advance (₹99)
            $orderAmount = (float) ($booking->advance_amount > 0 ? $booking->advance_amount : 99.00);
        } else {
            // Paying full amount
            $orderAmount = (float) $booking->total_price;
        }

        if ($orderAmount <= 0) {
            $booking->payment_status = 'paid';
            $booking->paid_amount = $booking->total_price;
            $booking->save();
            return response()->json(['status' => 'error', 'message' => 'No outstanding balance on this booking.'], 400);
        }

        // Before taking initial payment for an unpaid booking, check if slot is still available
        if (!$isPartiallyPaid) {
            $activeWashersCount = \App\Models\Washer::where('franchisee_id', $booking->franchisee_id)
                ->where('status', 'active')
                ->count();
            $washerCapacity = $activeWashersCount > 0 ? $activeWashersCount : 1;
            $slot = \App\Models\Slot::where('franchisee_id', $booking->franchisee_id)
                ->where('date', $booking->booking_date)
                ->where('time_range', $booking->slot_time)
                ->first();
            $effectiveMax = $slot ? min($slot->max_bookings, $washerCapacity) : $washerCapacity;
            $paidCount = Booking::where('franchisee_id', $booking->franchisee_id)
                ->where('booking_date', $booking->booking_date)
                ->where('slot_time', $booking->slot_time)
                ->where('id', '!=', $booking->id)
                ->slotBooked()
                ->count();

            if ($paidCount >= $effectiveMax) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'This slot is now fully booked by other confirmed payments. Please select another slot.'
                ], 400);
            }
        }

        // Generate a unique order ID
        $orderId = 'CW_' . $booking->id . '_' . time();

        // Prepare customer details
        $customerName = $user->name ?? 'Customer';
        $customerEmail = $user->email ?? 'customer@example.com';
        $customerPhone = $user->phone ?? '9999999999';

        // Build the return URL — redirects back into the SPA
        $returnUrl = url('/cashfree/return?order_id={order_id}');

        try {
            $response = Http::withHeaders([
                'x-client-id'     => $credentials['client_id'],
                'x-client-secret' => $credentials['client_secret'],
                'x-api-version'   => '2023-08-01',
                'Content-Type'    => 'application/json',
            ])->post($credentials['base_url'] . '/orders', [
                'order_id'         => $orderId,
                'order_amount'     => $orderAmount,
                'order_currency'   => 'INR',
                'customer_details' => [
                    'customer_id'    => 'cust_' . $user->id,
                    'customer_name'  => $customerName,
                    'customer_email' => $customerEmail,
                    'customer_phone' => $customerPhone,
                ],
                'order_meta' => [
                    'return_url' => $returnUrl,
                ],
            ]);

            $data = $response->json();

            if ($response->successful() && isset($data['payment_session_id'])) {
                // Save Cashfree details on the booking
                $booking->cashfree_order_id = $orderId;
                $booking->cashfree_payment_session_id = $data['payment_session_id'];
                if ($booking->payment_status !== 'partially_paid' && (float) $booking->paid_amount <= 0) {
                    $booking->payment_status = 'pending_payment';
                }
                $booking->save();

                return response()->json([
                    'status'             => 'success',
                    'payment_session_id' => $data['payment_session_id'],
                    'cashfree_order_id'  => $orderId,
                    'environment'        => $credentials['environment'],
                ]);
            }

            Log::error('Cashfree create order failed', ['response' => $data]);

            return response()->json([
                'status'  => 'error',
                'message' => $data['message'] ?? 'Failed to create payment order',
                'details' => $data,
            ], 422);

        } catch (\Exception $e) {
            Log::error('Cashfree create order exception', ['error' => $e->getMessage()]);

            return response()->json([
                'status'  => 'error',
                'message' => 'Payment service error. Please try again.',
            ], 500);
        }
    }

    /**
     * Verify payment status for a Cashfree order.
     * GET /api/cashfree/verify/{orderId}
     */
    public function verifyPayment(Request $request, $orderId)
    {
        $credentials = $this->getCredentials();
        if (!$credentials) {
            return response()->json(['status' => 'error', 'message' => 'Gateway not configured'], 500);
        }

        try {
            $response = Http::withHeaders([
                'x-client-id'     => $credentials['client_id'],
                'x-client-secret' => $credentials['client_secret'],
                'x-api-version'   => '2023-08-01',
            ])->get($credentials['base_url'] . '/orders/' . $orderId);

            $data = $response->json();

            if (!$response->successful()) {
                return response()->json([
                    'status'  => 'error',
                    'message' => 'Failed to verify payment',
                    'details' => $data,
                ], 422);
            }

            $orderStatus = $data['order_status'] ?? 'UNKNOWN';

            if (str_starts_with($orderId, 'CW_SUB_')) {
                $subscription = Subscription::with('package')->where('cashfree_order_id', $orderId)->first();
                if (!$subscription) {
                    return response()->json(['status' => 'error', 'message' => 'Subscription not found for this order'], 404);
                }

                if ($orderStatus === 'PAID') {
                    Subscription::where('customer_id', $subscription->customer_id)
                        ->where('status', 'active')
                        ->where('id', '!=', $subscription->id)
                        ->update(['status' => 'expired']);

                    $subscription->update([
                        'status' => 'active',
                        'payment_status' => 'paid',
                        'paid_amount' => (float) $subscription->package->price,
                        'payment_method' => 'online',
                    ]);

                    NotificationLog::create([
                        'user_id' => $subscription->customer_id,
                        'type' => 'subscription_expiry',
                        'title' => 'Subscription Activated!',
                        'body' => "Your {$subscription->package->name} subscription is active and fully paid for {$subscription->selected_month}. Payment is non-refundable; rescheduling is available.",
                    ]);

                    // Automatically create the 4 or 26 scheduled wash bookings after successful paid subscription verification.
                    if (in_array((int) $subscription->package->max_bookings, [4, 26], true) && is_array($subscription->schedules)) {
                        $scheduleData = $subscription->schedules;
                        $vehicleId = (int) ($scheduleData['vehicle_id'] ?? 0);
                        $franchiseeId = (int) ($scheduleData['franchisee_id'] ?? 0);
                        $address = (string) ($scheduleData['address'] ?? '');
                        $washes = $scheduleData['washes'] ?? [];
                        $requiredWashes = (int) $subscription->package->max_bookings;

                        $vehicle = \App\Models\Vehicle::where('customer_id', $subscription->customer_id)->find($vehicleId);
                        $franchisee = \App\Models\Franchisee::find($franchiseeId);

                        if ($vehicle && $franchisee && count($washes) === $requiredWashes) {
                            foreach ($washes as $wash) {
                                $bookingDate = Carbon::parse($wash['date'])->format('Y-m-d');
                                $slotTime = (string) ($wash['slot'] ?? '');
                                if ($slotTime === '' && $requiredWashes === 26) {
                                    $masterSlot = \App\Models\MasterSlot::where('status', 'active')->orderBy('id')->first();
                                    $slotTime = $masterSlot ? $masterSlot->time_range : '09:00 AM - 11:00 AM';
                                }


                                $exists = Booking::where('customer_id', $subscription->customer_id)
                                    ->where('package_id', $subscription->package_id)
                                    ->where('booking_date', $bookingDate)
                                    ->where('slot_time', $slotTime)
                                    ->where('payment_method', 'subscription')
                                    ->exists();

                                if (!$exists) {
                                    Booking::create([
                                        'customer_id' => $subscription->customer_id,
                                        'vehicle_id' => $vehicle->id,
                                        'franchisee_id' => $franchisee->id,
                                        'package_id' => $subscription->package_id,
                                        'booking_date' => $bookingDate,
                                        'slot_time' => $slotTime,
                                        'address' => $address,
                                        'status' => 'pending',
                                        'payment_status' => 'paid',
                                        'payment_method' => 'subscription',
                                        'payment_type' => 'full',
                                        'advance_amount' => 0,
                                        'paid_amount' => 0,
                                        'total_price' => 0,
                                        'gst_amount' => 0,
                                    ]);
                                    \App\Http\Controllers\BookingController::syncSlotBookings($franchisee->id, $bookingDate, $slotTime);
                                }
                            }
                            $subscription->update(['booking_count' => $requiredWashes]);
                        }
                    }

                    return response()->json([
                        'status' => 'success',
                        'payment_status' => 'paid',
                        'order_status' => $orderStatus,
                        'subscription' => $subscription->fresh(['package']),
                    ]);
                }

                if (in_array($orderStatus, ['EXPIRED', 'TERMINATED', 'VOID', 'FAILED'], true)) {
                    $subscription->update(['status' => 'cancelled', 'payment_status' => 'failed']);
                }

                return response()->json([
                    'status' => 'pending',
                    'payment_status' => $subscription->payment_status,
                    'order_status' => $orderStatus,
                    'subscription' => $subscription,
                ]);
            }

            $booking = Booking::where('cashfree_order_id', $orderId)->first();

            if (!$booking) {
                return response()->json(['status' => 'error', 'message' => 'Booking not found for this order'], 404);
            }

            if ($orderStatus === 'PAID') {
                // Fetch payment details to get the payment ID
                $paymentsResponse = Http::withHeaders([
                    'x-client-id'     => $credentials['client_id'],
                    'x-client-secret' => $credentials['client_secret'],
                    'x-api-version'   => '2023-08-01',
                ])->get($credentials['base_url'] . '/orders/' . $orderId . '/payments');

                $payments = $paymentsResponse->json();
                if (is_array($payments) && count($payments) > 0) {
                    $booking->cashfree_payment_id = $payments[0]['cf_payment_id'] ?? null;
                }

                $paidOrderAmount = (float) ($data['order_amount'] ?? 0);
                $totalPrice = (float) $booking->total_price;

                if ($booking->payment_status === 'partially_paid') {
                    // Accumulate previously paid amount with newly paid amount (e.g. half or full remaining due)
                    $newPaid = round((float) $booking->paid_amount + $paidOrderAmount, 2);
                    if ($newPaid >= ($totalPrice - 1.0)) {
                        $booking->paid_amount = $totalPrice;
                        $booking->payment_status = 'paid';
                    } else {
                        $booking->paid_amount = $newPaid;
                        $booking->payment_status = 'partially_paid';
                    }
                    $booking->payment_method = 'online';
                } elseif ($booking->payment_type === 'partial') {
                    $advance = (float) ($booking->advance_amount > 0 ? $booking->advance_amount : 99.00);

                    if ($paidOrderAmount <= ($advance + 1.0) && $paidOrderAmount < $totalPrice) {
                        // Advance payment of ₹99 completed
                        $booking->paid_amount = $advance;
                        $booking->payment_status = 'partially_paid';
                    } else {
                        // Remaining balance payment completed
                        $booking->paid_amount = $totalPrice;
                        $booking->payment_status = 'paid';
                        $booking->payment_method = 'online';
                    }
                } else {
                    // Full payment booking completed
                    $booking->paid_amount = $totalPrice;
                    $booking->payment_status = 'paid';
                    $booking->payment_method = 'online';
                }

                $booking->save();

                // Synchronize slot bookings count: user has paid full payment or at least ₹99, so slot is booked!
                \App\Http\Controllers\BookingController::syncSlotBookings(
                    $booking->franchisee_id,
                    $booking->booking_date,
                    $booking->slot_time
                );

                return response()->json([
                    'status'         => 'success',
                    'payment_status' => $booking->payment_status,
                    'paid_amount'    => $booking->paid_amount,
                    'total_price'    => $booking->total_price,
                    'order_status'   => $orderStatus,
                    'booking_id'     => $booking->id,
                    'booking'        => $booking,
                ]);
            }

            // If not PAID, update booking status accordingly
            if (in_array($orderStatus, ['EXPIRED', 'TERMINATED', 'VOID', 'FAILED'])) {
                if ($booking->payment_status !== 'partially_paid' && (float)$booking->paid_amount < 99) {
                    $booking->payment_status = 'failed';
                    $booking->save();

                    \App\Http\Controllers\BookingController::syncSlotBookings(
                        $booking->franchisee_id,
                        $booking->booking_date,
                        $booking->slot_time
                    );
                }
            }

            return response()->json([
                'status'         => 'pending',
                'payment_status' => $booking->payment_status,
                'order_status'   => $orderStatus,
                'booking_id'     => $booking->id,
            ]);

        } catch (\Exception $e) {
            Log::error('Cashfree verify exception', ['error' => $e->getMessage()]);
            return response()->json(['status' => 'error', 'message' => 'Verification failed', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Handle Cashfree return redirect.
     * GET /cashfree/return?order_id=xxx
     * Verifies payment server-side and redirects user back into the SPA.
     */
    public function handleReturn(Request $request)
    {
        $orderId = $request->query('order_id', '');

        if ($orderId) {
            try {
                $this->verifyPayment($request, $orderId);
            } catch (\Exception $e) {
                Log::error('Auto-verify error on return: ' . $e->getMessage());
            }
        }

        $redirectPath = str_starts_with($orderId, 'CW_SUB_')
            ? '/customer/subscriptions'
            : '/customer/bookings';

        return redirect($redirectPath . '?cashfree_order_id=' . urlencode($orderId));
    }

    /**
     * Render Cashfree JS SDK checkout wrapper for in-app mobile WebView.
     * GET /cashfree/checkout?payment_session_id=...&env=...
     */
    public function renderCheckout(Request $request)
    {
        $paymentSessionId = $request->query('payment_session_id');
        $environment = $request->query('env', 'sandbox');
        $bookingId = $request->query('booking_id');

        if (!$paymentSessionId && $bookingId) {
            $booking = Booking::find($bookingId);
            if ($booking && $booking->cashfree_payment_session_id) {
                $paymentSessionId = $booking->cashfree_payment_session_id;
                $credentials = $this->getCredentials();
                $environment = $credentials['environment'] ?? 'sandbox';
            }
        }

        if (!$paymentSessionId) {
            return response('<div style="font-family:sans-serif;padding:30px;text-align:center;"><h2>Payment Session Expired</h2><p>Please return to the app and retry.</p></div>', 400);
        }

        return view('cashfree_checkout', [
            'paymentSessionId' => $paymentSessionId,
            'environment'      => $environment,
            'bookingId'        => $bookingId,
        ]);
    }

    /**
     * Create a Cashfree order for a new subscription.
     * POST /api/cashfree/create-subscription-order
     */
    public function createSubscriptionOrder(Request $request)
    {
        $request->validate([
            'package_id' => 'required|integer|exists:service_packages,id',
            'selected_month' => 'required|regex:/^\\d{4}-\\d{2}$/',
            'vehicle_id' => 'nullable|integer|exists:vehicles,id',
            'franchisee_id' => 'nullable|integer|exists:franchisees,id',
            'address' => 'nullable|string|min:5|max:1000',
            'schedules' => 'nullable|array',
            'schedules.*.date' => 'nullable|date',
            'schedules.*.slot' => 'nullable|string',
        ]);

        $user = $request->user();
        if ($user->status !== 'active') {
            return response()->json(['status' => 'error', 'message' => 'Your account is suspended or blocked.'], 403);
        }

        $package = ServicePackage::findOrFail($request->package_id);
        if (!(bool) $package->is_subscription || !in_array((int) $package->max_bookings, [4, 26], true)) {
            return response()->json(['status' => 'error', 'message' => 'Invalid subscription plan.'], 422);
        }

        try {
            $monthStart = Carbon::createFromFormat('Y-m', $request->selected_month)->startOfMonth();
        } catch (\Exception $e) {
            return response()->json(['status' => 'error', 'message' => 'Invalid subscription month.'], 422);
        }

        if ($monthStart->lt(Carbon::now()->startOfMonth())) {
            return response()->json(['status' => 'error', 'message' => 'Please select the current or a future month.'], 422);
        }

        $nextMonth = $monthStart->copy()->addMonth()->format('Y-m');
        $allowedMonths = [$request->selected_month, $nextMonth];
        $subscriptionEnd = $monthStart->copy()->addMonth()->endOfMonth();

        $requiredWashes = (int) $package->max_bookings;
        if (in_array($requiredWashes, [4, 26], true)) {
            $schedules = $request->input('schedules', []);
            if (count($schedules) !== $requiredWashes) {
                return response()->json(['status' => 'error', 'message' => "Please select {$requiredWashes} wash dates and slots."], 422);
            }
            if (!$request->filled('vehicle_id') || !$request->filled('franchisee_id') || !$request->filled('address')) {
                return response()->json(['status' => 'error', 'message' => "Vehicle, center and address are required for {$requiredWashes}-wash booking."], 422);
            }

            $dates = [];
            foreach ($schedules as $schedule) {
                if (empty($schedule['date'])) {
                    return response()->json(['status' => 'error', 'message' => 'A date is required for each wash.'], 422);
                }
                if ($requiredWashes === 4 && empty($schedule['slot'])) {
                    return response()->json(['status' => 'error', 'message' => 'Date and slot are required for each wash.'], 422);
                }
                if (!in_array(substr($schedule['date'], 0, 7), $allowedMonths, true)) {
                    return response()->json(['status' => 'error', 'message' => 'All wash dates must be inside the selected month or following month.'], 422);
                }
                if (Carbon::parse($schedule['date'])->lt(Carbon::today())) {
                    return response()->json(['status' => 'error', 'message' => 'Wash dates cannot be in the past.'], 422);
                }
                if (Carbon::parse($schedule['date'])->gt($subscriptionEnd)) {
                    return response()->json(['status' => 'error', 'message' => 'Wash dates cannot exceed the allowed subscription period.'], 422);
                }
                $dates[] = $schedule['date'];
            }

            if ($requiredWashes === 4) {
                for ($i = 1; $i < count($dates); $i++) {
                    $previous = Carbon::parse($dates[$i - 1]);
                    $current = Carbon::parse($dates[$i]);
                    if ($current->lte($previous)) {
                        return response()->json([
                            'status' => 'error',
                            'message' => "Wash " . ($i + 1) . " date must be after Wash {$i} date (" . $previous->format('d M Y') . ")."
                        ], 422);
                    }
                }
            }

            if ($requiredWashes === 26) {
                for ($i = 1; $i < count($dates); $i++) {
                    $previous = Carbon::parse($dates[$i - 1]);
                    $current = Carbon::parse($dates[$i]);
                    if (!$current->equalTo($previous->copy()->addDay())) {
                        return response()->json(['status' => 'error', 'message' => 'The 26-wash plan requires 26 consecutive daily dates.'], 422);
                    }
                }
            }
            if (count(array_unique($dates)) !== $requiredWashes) {
                return response()->json(['status' => 'error', 'message' => "Please select {$requiredWashes} different wash dates."], 422);
            }
        }

        $credentials = $this->getCredentials();
        if (!$credentials || empty($credentials['client_id'])) {
            return response()->json(['status' => 'error', 'message' => 'Cashfree payment gateway is not configured.'], 500);
        }

        Subscription::where('customer_id', $user->id)->where('status', 'pending')->delete();

        $subscription = Subscription::create([
            'customer_id' => $user->id,
            'package_id' => $package->id,
            'status' => 'pending',
            'booking_count' => 0,
            'starts_at' => $monthStart,
            'expires_at' => $subscriptionEnd,
            'selected_month' => $request->selected_month,
            'payment_status' => 'pending',
            'paid_amount' => 0,
            'payment_method' => 'online',
            'is_refundable' => false,
            'schedules' => in_array((int) $package->max_bookings, [4, 26], true) ? [
                'vehicle_id' => (int) $request->vehicle_id,
                'franchisee_id' => (int) $request->franchisee_id,
                'address' => trim((string) $request->address),
                'washes' => $request->input('schedules', []),
            ] : null,
        ]);

        $orderId = 'CW_SUB_' . $subscription->id . '_' . time();
        $subscription->update(['cashfree_order_id' => $orderId]);

        try {
            $response = Http::withHeaders([
                'x-client-id' => $credentials['client_id'],
                'x-client-secret' => $credentials['client_secret'],
                'x-api-version' => '2023-08-01',
                'Content-Type' => 'application/json',
            ])->post($credentials['base_url'] . '/orders', [
                'order_id' => $orderId,
                'order_amount' => (float) $package->price,
                'order_currency' => 'INR',
                'customer_details' => [
                    'customer_id' => 'cust_' . $user->id,
                    'customer_name' => $user->name ?? 'Customer',
                    'customer_email' => $user->email ?? 'customer@example.com',
                    'customer_phone' => $user->phone ?? '9999999999',
                ],
                'order_meta' => ['return_url' => url('/cashfree/return?order_id={order_id}')],
            ]);

            $data = $response->json();
            if ($response->successful() && isset($data['payment_session_id'])) {
                return response()->json([
                    'status' => 'success',
                    'payment_session_id' => $data['payment_session_id'],
                    'cashfree_order_id' => $orderId,
                    'environment' => $credentials['environment'],
                    'amount' => (float) $package->price,
                ]);
            }

            $subscription->delete();
            return response()->json(['status' => 'error', 'message' => $data['message'] ?? 'Failed to create subscription payment order'], 422);
        } catch (\Exception $e) {
            $subscription->delete();
            Log::error('Subscription Cashfree order failed', ['error' => $e->getMessage()]);
            return response()->json(['status' => 'error', 'message' => 'Payment service error. Please try again.'], 500);
        }
    }
}
