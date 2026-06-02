<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Booking;
use App\Models\Franchisee;
use App\Models\Slot;
use App\Models\Coupon;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AdminController extends Controller
{
    public function dashboard(Request $request)
    {
        $totalUsers = User::count();
        $activeCustomers = User::where('role', 'customer')->where('status', 'active')->count();
        $franchiseesCount = Franchisee::where('status', 'active')->count();

        $upcomingOrders = Booking::whereIn('status', ['pending', 'assigned', 'ongoing'])
            ->count();

        $totalIncome = Booking::where('status', 'completed')->sum('total_price');

        // Order statistics
        $stats = Booking::select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->get();

        // Income chart last 6 months mockup
        $monthlyIncome = Booking::where('status', 'completed')
            ->select(
                DB::raw('sum(total_price) as sum'),
                DB::raw("DATE_FORMAT(booking_date, '%Y-%m') as month")
            )
            ->groupBy('month')
            ->orderBy('month', 'asc')
            ->get();

        return response()->json([
            'total_users' => $totalUsers,
            'active_customers' => $activeCustomers,
            'franchisees_count' => $franchiseesCount,
            'upcoming_orders' => $upcomingOrders,
            'total_income' => $totalIncome,
            'order_stats' => $stats,
            'monthly_income' => $monthlyIncome
        ]);
    }

    public function getUsers(Request $request)
    {
        $users = User::with('franchisee')->orderBy('created_at', 'desc')->get();
        return response()->json($users);
    }

    public function createUser(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'phone' => 'nullable|string|max:20',
            'password' => 'required|string|min:6',
            'role' => 'required|string|in:super_admin,admin,franchisee,customer',
            'status' => 'required|string|in:active,suspended',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
            'password' => Hash::make($request->password),
            'role' => $request->role,
            'status' => $request->status,
        ]);

        if ($request->role === 'franchisee') {
            Franchisee::create([
                'user_id' => $user->id,
                'center_name' => $request->input('center_name', $request->name . '\'s Hub'),
                'address' => $request->input('address', 'Pending Setup'),
                'city' => $request->input('city', 'Pending Setup'),
                'royalty_percentage' => $request->input('royalty_percentage', 10.0),
                'status' => 'active',
            ]);
        }

        return response()->json([
            'status' => 'success',
            'message' => 'User generated successfully',
            'user' => $user->load('franchisee')
        ], 201);
    }

    public function updateUser(Request $request, $id)
    {
        $user = User::findOrFail($id);
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . $user->id,
            'phone' => 'nullable|string|max:20',
            'role' => 'required|string|in:super_admin,admin,franchisee,customer',
            'status' => 'required|string|in:active,suspended',
        ]);

        $user->update([
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
            'role' => $request->role,
            'status' => $request->status,
        ]);

        if ($request->role === 'franchisee' && $user->franchisee) {
            $user->franchisee->update([
                'center_name' => $request->input('center_name', $user->franchisee->center_name),
                'address' => $request->input('address', $user->franchisee->address),
                'city' => $request->input('city', $user->franchisee->city),
                'royalty_percentage' => $request->input('royalty_percentage', $user->franchisee->royalty_percentage),
            ]);
        }

        return response()->json([
            'status' => 'success',
            'message' => 'User updated successfully',
            'user' => $user->load('franchisee')
        ]);
    }

    public function deleteUser($id)
    {
        $user = User::findOrFail($id);
        if ($user->role === 'super_admin') {
            return response()->json([
                'status' => 'error',
                'message' => 'Super Admin cannot be deleted'
            ], 400);
        }
        $user->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'User deleted successfully'
        ]);
    }

    public function resetUserPassword(Request $request, $id)
    {
        $user = User::findOrFail($id);
        $request->validate([
            'password' => 'required|string|min:6'
        ]);

        $user->update([
            'password' => Hash::make($request->password)
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Password reset successfully for ' . $user->name
        ]);
    }

    public function getOrders(Request $request)
    {
        $orders = Booking::with(['customer', 'vehicle', 'franchisee', 'package'])
            ->orderBy('booking_date', 'desc')
            ->get();

        return response()->json($orders);
    }

    public function modifyOrder(Request $request, $id)
    {
        $booking = Booking::findOrFail($id);
        $request->validate([
            'franchisee_id' => 'nullable|exists:franchisees,id',
            'booking_date' => 'nullable|date',
            'slot_time' => 'nullable|string',
            'status' => 'nullable|string|in:pending,assigned,ongoing,completed,cancelled,postponed',
            'payment_status' => 'nullable|string|in:unpaid,paid',
            'total_price' => 'nullable|numeric'
        ]);

        $booking->update($request->only(
            'franchisee_id', 'booking_date', 'slot_time', 
            'status', 'payment_status', 'total_price'
        ));

        return response()->json([
            'status' => 'success',
            'message' => 'Order modified successfully',
            'booking' => $booking->load(['customer', 'vehicle', 'franchisee'])
        ]);
    }

    public function getSlots(Request $request)
    {
        $slots = Slot::with('franchisee')->orderBy('date', 'desc')->get();
        return response()->json($slots);
    }

    public function saveSlotConfig(Request $request)
    {
        $request->validate([
            'franchisee_id' => 'required|exists:franchisees,id',
            'date' => 'required|date',
            'time_range' => 'required|string',
            'max_bookings' => 'required|integer|min:1'
        ]);

        $slot = Slot::updateOrCreate(
            [
                'franchisee_id' => $request->franchisee_id,
                'date' => $request->date,
                'time_range' => $request->time_range
            ],
            [
                'max_bookings' => $request->max_bookings
            ]
        );

        return response()->json([
            'status' => 'success',
            'message' => 'Slot settings updated successfully',
            'slot' => $slot
        ]);
    }

    public function getCoupons(Request $request)
    {
        $coupons = Coupon::orderBy('created_at', 'desc')->get();
        return response()->json($coupons);
    }

    public function createCoupon(Request $request)
    {
        $request->validate([
            'code' => 'required|string|unique:coupons,code',
            'discount_type' => 'required|string|in:fixed,percentage',
            'discount_value' => 'required|numeric|min:0',
            'expires_at' => 'nullable|date',
        ]);

        $coupon = Coupon::create([
            'code' => strtoupper($request->code),
            'discount_type' => $request->discount_type,
            'discount_value' => $request->discount_value,
            'expires_at' => $request->expires_at,
            'status' => 'active'
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Coupon created successfully',
            'coupon' => $coupon
        ], 201);
    }

    public function deleteCoupon($id)
    {
        $coupon = Coupon::findOrFail($id);
        $coupon->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Coupon deleted successfully'
        ]);
    }

    public function getReports(Request $request)
    {
        $franchiseeId = $request->input('franchisee_id');
        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');

        $bookingsQuery = Booking::where('status', 'completed');
        
        if ($franchiseeId) {
            $bookingsQuery->where('franchisee_id', $franchiseeId);
        }
        if ($startDate) {
            $bookingsQuery->whereDate('booking_date', '>=', $startDate);
        }
        if ($endDate) {
            $bookingsQuery->whereDate('booking_date', '<=', $endDate);
        }

        $totalRevenue = $bookingsQuery->sum('total_price');
        $totalBookings = $bookingsQuery->count();

        // Calculate royalty earnings
        // Group by Franchisee and sum their bookings revenue
        $franchiseeStatsQuery = Booking::where('status', 'completed')
            ->select(
                'franchisee_id',
                DB::raw('sum(total_price) as revenue'),
                DB::raw('count(*) as count')
            );

        if ($startDate) {
            $franchiseeStatsQuery->whereDate('booking_date', '>=', $startDate);
        }
        if ($endDate) {
            $franchiseeStatsQuery->whereDate('booking_date', '<=', $endDate);
        }

        $franchiseeStats = $franchiseeStatsQuery->groupBy('franchisee_id')
            ->with('franchisee')
            ->get()
            ->map(function($stat) {
                $royaltyRate = $stat->franchisee ? ($stat->franchisee->royalty_percentage / 100) : 0.10;
                $stat->royalty = $stat->revenue * $royaltyRate;
                return $stat;
            });

        $totalRoyalty = $franchiseeStats->sum('royalty');

        return response()->json([
            'total_revenue' => $totalRevenue,
            'total_bookings' => $totalBookings,
            'total_royalty_earnings' => $totalRoyalty,
            'franchisee_breakdown' => $franchiseeStats
        ]);
    }
}
