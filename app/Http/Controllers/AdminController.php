<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Booking;
use App\Models\Franchisee;
use App\Models\Slot;
use App\Models\Coupon;
use App\Models\ServicePackage;
use App\Models\SupportTicket;
use App\Models\RoyaltyPayment;
use App\Models\PlatformSetting;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AdminController extends Controller
{
    // ─── Dashboard ───────────────────────────────────────────────

    public function dashboard(Request $request)
    {
        $totalUsers       = User::count();
        $activeCustomers  = User::where('role', 'customer')->where('status', 'active')->count();
        $totalFranchisees = Franchisee::count();
        $activeFranchisees   = Franchisee::where('status', 'active')->count();
        $inactiveFranchisees = Franchisee::where('status', '!=', 'active')->count();

        $upcomingOrders = Booking::whereIn('status', ['pending', 'assigned', 'ongoing'])->count();
        $totalIncome    = Booking::where('status', 'completed')->sum('total_price');

        $stats = Booking::select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->get();

        $monthlyIncome = Booking::where('status', 'completed')
            ->select(DB::raw('sum(total_price) as sum'), DB::raw("DATE_FORMAT(booking_date, '%Y-%m') as month"))
            ->groupBy('month')
            ->orderBy('month', 'asc')
            ->get();

        $totalReferrals = User::whereNotNull('referred_by')->count();

        return response()->json([
            'total_users'          => $totalUsers,
            'active_customers'     => $activeCustomers,
            'total_franchisees'    => $totalFranchisees,
            'active_franchisees'   => $activeFranchisees,
            'inactive_franchisees' => $inactiveFranchisees,
            'upcoming_orders'      => $upcomingOrders,
            'total_income'         => $totalIncome,
            'order_stats'          => $stats,
            'monthly_income'       => $monthlyIncome,
            'total_referrals'      => $totalReferrals,
        ]);
    }

    // ─── Users ───────────────────────────────────────────────────

    public function getUsers(Request $request)
    {
        $users = User::with('franchisee')->orderBy('created_at', 'desc')->get();
        return response()->json($users);
    }

    public function createUser(Request $request)
    {
        $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|string|email|max:255|unique:users',
            'phone'    => 'nullable|string|max:20',
            'password' => 'required|string|min:6',
            'role'     => 'required|string|in:super_admin,admin,franchisee,customer',
            'status'   => 'required|string|in:active,suspended',
        ]);

        $user = User::create([
            'name'     => $request->name,
            'email'    => $request->email,
            'phone'    => $request->phone,
            'password' => Hash::make($request->password),
            'role'     => $request->role,
            'status'   => $request->status,
        ]);

        if ($request->role === 'franchisee') {
            Franchisee::create([
                'user_id'            => $user->id,
                'center_name'        => $request->input('center_name', $request->name . "'s Center"),
                'address'            => $request->input('address', 'Pending Setup'),
                'city'               => $request->input('city', 'Pending Setup'),
                'royalty_percentage' => $request->input('royalty_percentage', 10.0),
                'status'             => 'active',
            ]);
        }

        return response()->json([
            'status'  => 'success',
            'message' => 'User created successfully',
            'user'    => $user->load('franchisee'),
        ], 201);
    }

    public function updateUser(Request $request, $id)
    {
        $user = User::findOrFail($id);
        $request->validate([
            'name'   => 'required|string|max:255',
            'email'  => 'required|string|email|max:255|unique:users,email,' . $user->id,
            'phone'  => 'nullable|string|max:20',
            'role'   => 'required|string|in:super_admin,admin,franchisee,customer',
            'status' => 'required|string|in:active,suspended',
        ]);

        $user->update([
            'name'   => $request->name,
            'email'  => $request->email,
            'phone'  => $request->phone,
            'role'   => $request->role,
            'status' => $request->status,
        ]);

        if ($request->role === 'franchisee' && $user->franchisee) {
            $user->franchisee->update([
                'center_name'        => $request->input('center_name', $user->franchisee->center_name),
                'address'            => $request->input('address', $user->franchisee->address),
                'city'               => $request->input('city', $user->franchisee->city),
                'royalty_percentage' => $request->input('royalty_percentage', $user->franchisee->royalty_percentage),
            ]);
        }

        return response()->json([
            'status'  => 'success',
            'message' => 'User updated successfully',
            'user'    => $user->load('franchisee'),
        ]);
    }

    public function deleteUser($id)
    {
        $user = User::findOrFail($id);
        if ($user->role === 'super_admin') {
            return response()->json(['status' => 'error', 'message' => 'Super Admin cannot be deleted'], 400);
        }
        $user->delete();
        return response()->json(['status' => 'success', 'message' => 'User deleted successfully']);
    }

    public function resetUserPassword(Request $request, $id)
    {
        $user = User::findOrFail($id);
        $request->validate(['password' => 'required|string|min:6']);
        $user->update(['password' => Hash::make($request->password)]);
        return response()->json(['status' => 'success', 'message' => 'Password reset for ' . $user->name]);
    }

    // ─── Orders ──────────────────────────────────────────────────

    public function getOrders(Request $request)
    {
        $orders = Booking::with(['customer:id,name,phone', 'vehicle', 'franchisee', 'package'])
            ->orderBy('booking_date', 'desc')
            ->get();
        return response()->json($orders);
    }

    public function modifyOrder(Request $request, $id)
    {
        $booking = Booking::findOrFail($id);
        $request->validate([
            'franchisee_id'  => 'nullable|exists:franchisees,id',
            'booking_date'   => 'nullable|date',
            'slot_time'      => 'nullable|string',
            'status'         => 'nullable|string|in:pending,assigned,ongoing,completed,cancelled,postponed',
            'payment_status' => 'nullable|string|in:unpaid,paid',
            'total_price'    => 'nullable|numeric',
        ]);

        $booking->update($request->only('franchisee_id', 'booking_date', 'slot_time', 'status', 'payment_status', 'total_price'));

        return response()->json([
            'status'  => 'success',
            'message' => 'Order modified successfully',
            'booking' => $booking->load(['customer', 'vehicle', 'franchisee']),
        ]);
    }

    // ─── Slots ───────────────────────────────────────────────────

    public function getSlots(Request $request)
    {
        $slots = Slot::with('franchisee')->orderBy('date', 'desc')->get();
        return response()->json($slots);
    }

    public function saveSlotConfig(Request $request)
    {
        $request->validate([
            'franchisee_id' => 'required|exists:franchisees,id',
            'start_date'    => 'required|date',
            'end_date'      => 'required|date|after_or_equal:start_date',
            'time_ranges'   => 'required|array|min:1',
            'time_ranges.*' => 'required|string',
            'max_bookings'  => 'required|integer|min:1',
        ]);

        $createdSlots = [];
        $start = Carbon::parse($request->start_date);
        $end = Carbon::parse($request->end_date);

        for ($date = $start; $date->lte($end); $date->addDay()) {
            $dateString = $date->format('Y-m-d');
            foreach ($request->time_ranges as $time_range) {
                $slot = Slot::updateOrCreate(
                    ['franchisee_id' => $request->franchisee_id, 'date' => $dateString, 'time_range' => $time_range],
                    ['max_bookings'  => $request->max_bookings]
                );
                $createdSlots[] = $slot;
            }
        }

        return response()->json(['status' => 'success', 'message' => 'Slot configs saved.', 'slots' => $createdSlots]);
    }

    // ─── Coupons ─────────────────────────────────────────────────

    public function getCoupons()
    {
        return response()->json(Coupon::orderBy('created_at', 'desc')->get());
    }

    public function createCoupon(Request $request)
    {
        $request->validate([
            'code'           => 'required|string|unique:coupons,code',
            'discount_type'  => 'required|string|in:fixed,percentage',
            'discount_value' => 'required|numeric|min:0',
            'expires_at'     => 'nullable|date',
        ]);

        $coupon = Coupon::create([
            'code'           => strtoupper($request->code),
            'discount_type'  => $request->discount_type,
            'discount_value' => $request->discount_value,
            'expires_at'     => $request->expires_at,
            'status'         => 'active',
        ]);

        return response()->json(['status' => 'success', 'message' => 'Coupon created.', 'coupon' => $coupon], 201);
    }

    public function deleteCoupon($id)
    {
        Coupon::findOrFail($id)->delete();
        return response()->json(['status' => 'success', 'message' => 'Coupon deleted.']);
    }

    // ─── Reports ─────────────────────────────────────────────────

    public function getReports(Request $request)
    {
        $franchiseeId = $request->input('franchisee_id');
        $startDate    = $request->input('start_date');
        $endDate      = $request->input('end_date');

        $query = Booking::where('status', 'completed');
        if ($franchiseeId) $query->where('franchisee_id', $franchiseeId);
        if ($startDate)    $query->whereDate('booking_date', '>=', $startDate);
        if ($endDate)      $query->whereDate('booking_date', '<=', $endDate);

        $totalRevenue  = $query->sum('total_price');
        $totalBookings = $query->count();

        $fQuery = Booking::where('status', 'completed')
            ->select('franchisee_id', DB::raw('sum(total_price) as revenue'), DB::raw('count(*) as count'));
        if ($startDate) $fQuery->whereDate('booking_date', '>=', $startDate);
        if ($endDate)   $fQuery->whereDate('booking_date', '<=', $endDate);

        $franchiseeStats = $fQuery->groupBy('franchisee_id')
            ->with('franchisee')
            ->get()
            ->map(function($stat) {
                $rate = $stat->franchisee ? ($stat->franchisee->royalty_percentage / 100) : 0.10;
                $stat->royalty = $stat->revenue * $rate;
                return $stat;
            });

        return response()->json([
            'total_revenue'         => $totalRevenue,
            'total_bookings'        => $totalBookings,
            'total_royalty_earnings' => $franchiseeStats->sum('royalty'),
            'franchisee_breakdown'  => $franchiseeStats,
        ]);
    }

    // ─── Franchise Management ────────────────────────────────────

    public function getFranchisees()
    {
        $franchisees = Franchisee::with('user:id,name,email,phone,status')
            ->withCount(['bookings as total_orders', 'bookings as completed_orders' => function($q) {
                $q->where('status', 'completed');
            }])
            ->withSum(['bookings as total_revenue' => function($q) {
                $q->where('status', 'completed');
            }], 'total_price')
            ->get();

        return response()->json($franchisees);
    }

    public function updateFranchiseeStatus(Request $request, $id)
    {
        $franchisee = Franchisee::findOrFail($id);
        $request->validate(['status' => 'required|in:active,inactive,pending']);
        $franchisee->update(['status' => $request->status]);
        return response()->json(['status' => 'success', 'message' => 'Franchise status updated.', 'franchisee' => $franchisee]);
    }

    // ─── Package Management ──────────────────────────────────────

    public function getPackages()
    {
        return response()->json(ServicePackage::orderBy('vehicle_type')->get());
    }

    public function createPackage(Request $request)
    {
        $request->validate([
            'name'           => 'required|string|max:255',
            'description'    => 'nullable|string',
            'vehicle_type'   => 'required|string|in:hatchback,sedan,suv,commercial,bus,volvo_bus',
            'price'          => 'required|numeric|min:0',
            'frequency_days' => 'required|integer|min:0',
            'max_bookings'   => 'required|integer|min:1',
        ]);

        $package = ServicePackage::create($request->only('name', 'description', 'vehicle_type', 'price', 'frequency_days', 'max_bookings'));

        return response()->json(['status' => 'success', 'message' => 'Package created.', 'package' => $package], 201);
    }

    public function updatePackage(Request $request, $id)
    {
        $package = ServicePackage::findOrFail($id);
        $request->validate([
            'name'           => 'nullable|string|max:255',
            'description'    => 'nullable|string',
            'vehicle_type'   => 'nullable|string|in:hatchback,sedan,suv,commercial,bus,volvo_bus',
            'price'          => 'nullable|numeric|min:0',
            'frequency_days' => 'nullable|integer|min:0',
            'max_bookings'   => 'nullable|integer|min:1',
        ]);

        $package->update($request->only('name', 'description', 'vehicle_type', 'price', 'frequency_days', 'max_bookings'));
        return response()->json(['status' => 'success', 'message' => 'Package updated.', 'package' => $package]);
    }

    public function deletePackage($id)
    {
        ServicePackage::findOrFail($id)->delete();
        return response()->json(['status' => 'success', 'message' => 'Package deleted.']);
    }

    // ─── Referral Network ────────────────────────────────────────

    public function getReferrals()
    {
        $users = User::whereNotNull('referred_by')
            ->with(['referrer:id,name,email', 'bookings' => function($q) { $q->where('status', 'completed'); }])
            ->select('id', 'name', 'email', 'referred_by', 'e_points', 'pending_epoints', 'created_at')
            ->get()
            ->map(function($u) {
                $u->total_completed = $u->bookings->count();
                $u->epoint_status   = $u->total_completed > 0 ? 'confirmed' : 'pending';
                unset($u->bookings);
                return $u;
            });

        $topReferrers = User::withCount('referrals')
            ->orderBy('referrals_count', 'desc')
            ->limit(10)
            ->get(['id', 'name', 'email', 'referral_code', 'e_points']);

        return response()->json([
            'total_referrals'  => $users->count(),
            'confirmed'        => $users->where('epoint_status', 'confirmed')->count(),
            'pending'          => $users->where('epoint_status', 'pending')->count(),
            'referral_list'    => $users,
            'top_referrers'    => $topReferrers,
        ]);
    }

    // ─── Support Tickets ─────────────────────────────────────────

    public function getTickets()
    {
        $tickets = SupportTicket::with('customer:id,name,email,phone')
            ->orderBy('created_at', 'desc')
            ->get();
        return response()->json($tickets);
    }

    public function updateTicket(Request $request, $id)
    {
        $ticket = SupportTicket::findOrFail($id);
        $request->validate([
            'status'      => 'nullable|in:open,in_progress,closed',
            'admin_reply' => 'nullable|string',
        ]);

        $ticket->update([
            'status'      => $request->input('status', $ticket->status),
            'admin_reply' => $request->admin_reply,
            'replied_at'  => $request->admin_reply ? now() : $ticket->replied_at,
        ]);

        return response()->json(['status' => 'success', 'message' => 'Ticket updated.', 'ticket' => $ticket->load('customer:id,name,email')]);
    }
}
