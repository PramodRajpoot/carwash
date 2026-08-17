<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use App\Models\Booking;
use App\Models\PaymentGateway;

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
            'booking_id' => 'required|integer|exists:bookings,id',
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

        $credentials = $this->getCredentials();
        if (!$credentials || empty($credentials['client_id'])) {
            return response()->json([
                'status' => 'error',
                'message' => 'Cashfree payment gateway is not configured. Please contact admin.'
            ], 500);
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
                'order_amount'     => (float) $booking->total_price,
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
                $booking->payment_status = 'pending_payment';
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

            $booking = Booking::where('cashfree_order_id', $orderId)->first();

            if (!$booking) {
                return response()->json(['status' => 'error', 'message' => 'Booking not found for this order'], 404);
            }

            $orderStatus = $data['order_status'] ?? 'UNKNOWN';

            if ($orderStatus === 'PAID') {
                $booking->payment_status = 'paid';

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

                $booking->save();

                return response()->json([
                    'status'         => 'success',
                    'payment_status' => 'paid',
                    'order_status'   => $orderStatus,
                    'booking_id'     => $booking->id,
                ]);
            }

            // If not PAID, update booking status accordingly
            if (in_array($orderStatus, ['EXPIRED', 'TERMINATED', 'VOID'])) {
                $booking->payment_status = 'failed';
                $booking->save();
            }

            return response()->json([
                'status'         => 'pending',
                'payment_status' => $booking->payment_status,
                'order_status'   => $orderStatus,
                'booking_id'     => $booking->id,
            ]);

        } catch (\Exception $e) {
            Log::error('Cashfree verify exception', ['error' => $e->getMessage()]);
            return response()->json(['status' => 'error', 'message' => 'Verification failed'], 500);
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

        // Redirect back into the SPA with the order_id as a query param
        return redirect('/customer/bookings?cashfree_order_id=' . urlencode($orderId));
    }
}
