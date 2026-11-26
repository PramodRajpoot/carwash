<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Vehicle;
use App\Models\ServicePackage;
use App\Models\Subscription;
use App\Models\Booking;
use App\Models\Wishlist;
use App\Models\User;
use App\Models\Coupon;
use App\Models\WalletTransaction;
use App\Models\NotificationLog;
use Carbon\Carbon;

class CustomerController extends Controller
{
    public function dashboard(Request $request)
    {
        $user = $request->user();

        $activeSubscription = Subscription::where('customer_id', $user->id)
            ->where('status', 'active')
            ->with('package')
            ->first();

        $bookingCount = Booking::where('customer_id', $user->id)
            ->where('status', 'completed')
            ->count();

        $limit = $request->query('limit');
        // Wash list shows ONLY those washes which have paid ₹99 advance or full amount
        $upcomingServicesQuery = Booking::where('customer_id', $user->id)
            ->where(function ($q) {
                $q->where('payment_status', 'paid')
                  ->orWhere('paid_amount', '>=', 99)
                  ->orWhere(function ($sub) {
                      $sub->where('payment_status', 'partially_paid')
                          ->where('paid_amount', '>=', 99);
                  });
            })
            ->whereIn('status', ['pending', 'assigned', 'ongoing', 'completed', 'cancelled', 'postponed'])
            ->with(['vehicle', 'franchisee', 'package'])
            ->orderBy('booking_date', 'desc')
            ->orderBy('id', 'desc');

        if ($limit && is_numeric($limit)) {
            $upcomingServicesQuery->limit((int) $limit);
        }

        $upcomingServices = $upcomingServicesQuery->get()->map(function ($booking) {
            $isSub = $booking->payment_method === 'subscription' 
                || ($booking->package && ($booking->package->is_subscription || in_array((int)$booking->package->max_bookings, [4, 26], true)));

            if ($isSub && ((float)$booking->total_price <= 0 || (float)$booking->paid_amount <= 0)) {
                $base = (float)($booking->package->price ?? 0);
                if ($base > 0) {
                    $gst = (float)round($base * 0.18);
                    $total = (float)round($base + $gst);
                    $booking->total_price = (string)$total;
                    $booking->gst_amount = (string)$gst;
                    $booking->paid_amount = (string)$total;
                    $booking->advance_amount = (string)$total;
                }
            }
            return $booking;
        });
        $totalBookings = Booking::where('customer_id', $user->id)
            ->where(function ($q) {
                $q->where('payment_status', 'paid')
                  ->orWhere('paid_amount', '>=', 99);
            })
            ->count();

        $wishlistCount = Wishlist::where('customer_id', $user->id)->count();

        // Active coupons for banner
        $activeCoupons = Coupon::where('status', 'active')
            ->where(function($q) {
                $q->whereNull('expires_at')->orWhere('expires_at', '>=', now()->toDateString());
            })
            ->limit(5)
            ->get();

        $unreadNotifications = NotificationLog::where('user_id', $user->id)
            ->whereNull('read_at')
            ->count();

        $totalEarned = \App\Models\WalletTransaction::where('user_id', $user->id)
            ->where('type', 'credit')
            ->where('source', '!=', 'refund')
            ->where('status', 'confirmed')
            ->sum('amount');

        $totalEpoints = max((int) $totalEarned, $user->e_points);

        $savedAddress = null;
        try {
            $savedAddress = $user->address;
            if (!$savedAddress && \Illuminate\Support\Facades\Schema::hasColumn('bookings', 'address')) {
                $savedAddress = Booking::where('customer_id', $user->id)
                    ->whereNotNull('address')
                    ->where('address', '!=', '')
                    ->latest()
                    ->value('address');
            }
        } catch (\Throwable $e) {
            \Log::warning('Could not retrieve saved address: ' . $e->getMessage());
        }

        // Monthly wash activity for charts
        $monthlyWashes = [];
        for ($i = 5; $i >= 0; $i--) {
            $mDate = Carbon::now()->subMonths($i);
            $ym = $mDate->format('Y-m');
            $label = $mDate->format('M');
            $completed = Booking::where('customer_id', $user->id)
                ->where('booking_date', 'like', "{$ym}%")
                ->where('status', 'completed')
                ->count();
            $total = Booking::where('customer_id', $user->id)
                ->where('booking_date', 'like', "{$ym}%")
                ->where(function ($q) {
                    $q->where('payment_status', 'paid')
                      ->orWhere('paid_amount', '>=', 99);
                })
                ->count();
            $monthlyWashes[] = [
                'month'     => $label,
                'completed' => $completed,
                'total'     => $total,
            ];
        }

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

        return response()->json([
            'user'                  => $user,
            'subscription'          => $activeSubscription,
            'booking_count'         => $bookingCount,
            'total_bookings'        => $totalBookings,
            'upcoming_services'     => $upcomingServices,
            'wishlist_count'        => $wishlistCount,
            'referral_coins'        => $user->referral_coins,
            'reward_coins'          => $user->reward_coins,
            'e_points'              => $user->e_points,
            'pending_epoints'       => $user->pending_epoints,
            'total_epoints'         => $totalEpoints,
            'referral_code'         => $user->referral_code,
            'active_coupons'        => $activeCoupons,
            'unread_notifications'  => $unreadNotifications,
            'first_booking_discount' => $user->first_booking_discount,
            'is_first_wash'         => $isFirstWash,
            'has_taken_first_wash'  => !$isFirstWash,
            'can_use_points'        => $canUsePoints,
            'has_completed_first_wash' => $canUsePoints,
            'completed_washes_count' => $completedWashesCount,
            'earning_money'         => $user->earning_money,
            'address'               => $savedAddress,
            'monthly_washes'        => $monthlyWashes,
            'status'                => $user->status,
        ]);
    }

    public function getVehicles(Request $request)
    {
        $vehicles = Vehicle::where('customer_id', $request->user()->id)->get();
        return response()->json($vehicles);
    }

    public function addVehicle(Request $request)
    {
        $request->validate([
            'vehicle_type' => 'required|string|in:hatchback,sedan,suv,luxury,commercial,bus,volvo_bus',
            'make_model'   => 'required|string|max:255',
            'plate_number' => 'nullable|string|max:50',
        ]);

        $vehicle = Vehicle::create([
            'customer_id'  => $request->user()->id,
            'vehicle_type' => $request->vehicle_type,
            'make_model'   => $request->make_model,
            'plate_number' => $request->plate_number,
        ]);

        return response()->json([
            'status'  => 'success',
            'message' => 'Vehicle added successfully',
            'vehicle' => $vehicle,
        ], 201);
    }

    public function deleteVehicle(Request $request, $id)
    {
        $vehicle = Vehicle::where('customer_id', $request->user()->id)->findOrFail($id);
        $vehicle->delete();

        return response()->json([
            'status'  => 'success',
            'message' => 'Vehicle removed successfully',
        ]);
    }

    public function getSubscriptions(Request $request)
    {
        $subscriptions = Subscription::where('customer_id', $request->user()->id)
            ->with('package')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($subscriptions);
    }

    public function buySubscription(Request $request)
    {
        $user = $request->user();

        if ($user->status !== 'active') {
            return response()->json([
                'status'  => 'error',
                'message' => 'Your account is currently blocked/suspended. You cannot purchase subscriptions. Please contact support.',
            ], 403);
        }

        $request->validate([
            'package_id' => 'required|exists:service_packages,id',
            'selected_month' => 'nullable|regex:/^\\d{4}-\\d{2}$/',
            'cashfree_order_id' => 'required|string',
        ]);

        $package = ServicePackage::findOrFail($request->package_id);

        if (!(bool) $package->is_subscription || !in_array((int) $package->max_bookings, [4, 26], true)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Only 4-wash and 26-wash monthly subscription plans are available.',
            ], 422);
        }

        $selectedMonth = $request->input('selected_month', Carbon::now()->format('Y-m'));
        try {
            $monthStart = Carbon::createFromFormat('Y-m', $selectedMonth)->startOfMonth();
        } catch (\Exception $e) {
            return response()->json(['status' => 'error', 'message' => 'Invalid subscription month.'], 422);
        }

        if ($monthStart->lt(Carbon::now()->startOfMonth())) {
            return response()->json(['status' => 'error', 'message' => 'Please select the current or a future month.'], 422);
        }

        // Subscription plans are sold only with a full, advance, non-refundable payment.
        $paidAmount = (float) $request->input('paid_amount', $package->price);
        $paymentStatus = $request->input('payment_status', 'paid');
        if ($paymentStatus !== 'paid' || $paidAmount + 0.001 < (float) $package->price) {
            return response()->json([
                'status' => 'error',
                'message' => 'Full advance payment is required for subscription plans. Partial or pending payments are not allowed.',
            ], 422);
        }

        $subscription = Subscription::where('customer_id', $user->id)
            ->where('package_id', $package->id)
            ->where('selected_month', $selectedMonth)
            ->where('cashfree_order_id', $request->cashfree_order_id)
            ->where('status', 'pending')
            ->first();

        if (!$subscription) {
            return response()->json([
                'status' => 'error',
                'message' => 'A verified full payment is required before this subscription can be activated.',
            ], 422);
        }

        Subscription::where('customer_id', $user->id)
            ->where('status', 'active')
            ->update(['status' => 'expired']);

        $subscription->update([
            'status' => 'active',
            'payment_status' => 'paid',
            'paid_amount' => $package->price,
            'payment_method' => 'online',
            'is_refundable' => false,
        ]);

        NotificationLog::create([
            'user_id' => $user->id,
            'type' => 'subscription_expiry',
            'title' => 'Subscription Activated!',
            'body' => "Your {$package->name} subscription is active for {$monthStart->format('F Y')} and fully paid. Payment is non-refundable; rescheduling is available.",
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Subscribed successfully!',
            'subscription' => $subscription->fresh(['package']),
        ]);
    }

    public function getWishlist(Request $request)
    {
        $wishlist = Wishlist::where('customer_id', $request->user()->id)
            ->with('package')
            ->get();

        return response()->json($wishlist);
    }

    public function addToWishlist(Request $request)
    {
        $request->validate(['package_id' => 'required|exists:service_packages,id']);

        $wish = Wishlist::firstOrCreate([
            'customer_id' => $request->user()->id,
            'package_id'  => $request->package_id,
        ]);

        return response()->json([
            'status'   => 'success',
            'message'  => 'Service added to wishlist',
            'wishlist' => $wish,
        ]);
    }

    public function removeFromWishlist(Request $request, $id)
    {
        $wish = Wishlist::where('customer_id', $request->user()->id)
            ->where(function($query) use ($id) {
                $query->where('id', $id)->orWhere('package_id', $id);
            })->firstOrFail();

        $wish->delete();

        return response()->json(['status' => 'success', 'message' => 'Removed from wishlist']);
    }

    public function getReferrals(Request $request)
    {
        $user = $request->user();

        $referredUsers = User::where('referred_by', $user->id)
            ->select('id', 'name', 'email', 'phone', 'created_at')
            ->withCount(['bookings as completed_bookings' => function($q) {
                $q->where('status', 'completed');
            }])
            ->get()
            ->map(function($u) use ($user) {
                // Pending points are for users who haven't completed first booking yet
                $u->epoint_status = $u->completed_bookings > 0 ? 'confirmed' : 'pending';
                return $u;
            });

        $pendingReferrals  = $referredUsers->where('epoint_status', 'pending')->count();
        $confirmedReferrals = $referredUsers->where('epoint_status', 'confirmed')->count();

        return response()->json([
            'referral_code'       => $user->referral_code,
            'referral_coins'      => $user->referral_coins,
            'reward_coins'        => $user->reward_coins,
            'e_points'            => $user->e_points,
            'pending_epoints'     => $user->pending_epoints,
            'earning_money'       => $user->earning_money,
            'total_referrals'     => $referredUsers->count(),
            'pending_referrals'   => $pendingReferrals,
            'confirmed_referrals' => $confirmedReferrals,
            'referred_users'      => $referredUsers,
        ]);
    }
}
