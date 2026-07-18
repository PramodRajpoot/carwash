<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Franchisee;
use App\Models\Booking;
use App\Models\Subscription;
use App\Models\WalletTransaction;
use App\Models\PlatformSetting;
use App\Models\ServiceCategory;
use App\Models\ServicePackage;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class SuperAdminController extends Controller
{
    // ─── Dashboard ───────────────────────────────────────────────

    public function dashboard()
    {
        $now = now();
        $thirtyDaysAgo = now()->subDays(30);
        
        $credits = WalletTransaction::where('type', 'credit')->where('status', 'confirmed')->sum('amount');
        $debits = WalletTransaction::where('type', 'debit')->where('status', 'confirmed')->sum('amount');
        $total_wallet_balance = $credits - $debits;

        // Daily Revenue (last 30 days)
        $dailyRevenue = Booking::where('status', 'completed')
            ->where('booking_date', '>=', $thirtyDaysAgo->toDateString())
            ->groupBy('booking_date')
            ->orderBy('booking_date')
            ->selectRaw('DATE(booking_date) as date, sum(total_price) as revenue')
            ->get();

        // Monthly Revenue (current year)
        $monthlyRevenue = Booking::where('status', 'completed')
            ->whereYear('booking_date', $now->year)
            ->groupByRaw('MONTH(booking_date)')
            ->orderByRaw('MONTH(booking_date)')
            ->selectRaw('MONTH(booking_date) as month, sum(total_price) as revenue')
            ->get();

        // Booking Analytics (Status Count)
        $bookingAnalytics = Booking::groupBy('status')
            ->selectRaw('status, count(*) as count')
            ->get();

        // Services & City wise Revenue
        $serviceRevenue = Booking::where('bookings.status', 'completed')
            ->join('service_packages', 'bookings.package_id', '=', 'service_packages.id')
            ->groupBy('service_packages.name')
            ->selectRaw('service_packages.name as service_name, sum(bookings.total_price) as revenue')
            ->get();

        $cityRevenue = Booking::where('bookings.status', 'completed')
            ->join('franchisees', 'bookings.franchisee_id', '=', 'franchisees.id')
            ->groupBy('franchisees.city')
            ->selectRaw('franchisees.city as city, sum(bookings.total_price) as revenue')
            ->get();

        // Franchise wise Revenue
        $franchiseRevenue = Booking::where('bookings.status', 'completed')
            ->join('franchisees', 'bookings.franchisee_id', '=', 'franchisees.id')
            ->groupBy('franchisees.center_name')
            ->selectRaw('franchisees.center_name as center, sum(bookings.total_price) as revenue')
            ->orderByDesc('revenue')
            ->limit(10)
            ->get();

        // Partner Growth (new franchisees per month current year)
        $partnerGrowth = User::where('role', 'franchisee')
            ->whereYear('created_at', $now->year)
            ->groupByRaw('MONTH(created_at)')
            ->orderByRaw('MONTH(created_at)')
            ->selectRaw('MONTH(created_at) as month, count(*) as count')
            ->get();

        return response()->json([
            // Cards
            'gross_revenue' => Booking::where('status', 'completed')->sum('total_price'),
            'total_bookings' => Booking::count(),
            'pending_bookings' => Booking::where('status', 'pending')->count(),
            'completed_bookings' => Booking::where('status', 'completed')->count(),
            'cancelled_bookings' => Booking::where('status', 'cancelled')->count(),
            'total_subscriptions' => Subscription::count(),
            'active_cities' => Franchisee::whereHas('user', function($q) { $q->where('status', 'active'); })->distinct('city')->count('city'),
            'inactive_cities' => Franchisee::whereHas('user', function($q) { $q->where('status', '!=', 'active'); })->distinct('city')->count('city'),
            'total_franchise' => User::where('role', 'franchisee')->count(),
            'total_wallet_balance' => $total_wallet_balance,
            'total_referrals' => User::whereNotNull('referred_by')->count(),
            'active_franchise_partners' => User::where('role', 'franchisee')->where('status', 'active')->count(),
            'inactive_franchise_partners' => User::where('role', 'franchisee')->where('status', '!=', 'active')->count(),
            
            // Analytics
            'daily_revenue' => $dailyRevenue,
            'monthly_revenue' => $monthlyRevenue,
            'booking_analytics' => $bookingAnalytics,
            'service_revenue' => $serviceRevenue,
            'city_revenue' => $cityRevenue,
            'franchise_revenue' => $franchiseRevenue,
            'partner_growth' => $partnerGrowth,
        ]);
    }

    // ─── Admin Management ────────────────────────────────────────

    public function getAdmins()
    {
        $admins = User::whereIn('role', ['admin', 'super_admin'])
            ->orderBy('created_at', 'desc')
            ->get(['id', 'name', 'email', 'phone', 'role', 'status', 'created_at']);

        return response()->json($admins);
    }

    public function createAdmin(Request $request)
    {
        $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|string|email|unique:users',
            'phone'    => 'nullable|string|max:20',
            'password' => 'required|string|min:6',
            'role'     => 'required|in:admin,super_admin',
        ]);

        $referralCode = strtoupper(Str::random(8));
        while (User::where('referral_code', $referralCode)->exists()) {
            $referralCode = strtoupper(Str::random(8));
        }

        $admin = User::create([
            'name'          => $request->name,
            'email'         => $request->email,
            'phone'         => $request->phone,
            'password'      => Hash::make($request->password),
            'role'          => $request->role,
            'referral_code' => $referralCode,
            'status'        => 'active',
        ]);

        return response()->json([
            'status'  => 'success',
            'message' => 'Admin created successfully.',
            'admin'   => $admin,
        ], 201);
    }

    public function updateAdmin(Request $request, $id)
    {
        $admin = User::whereIn('role', ['admin', 'super_admin'])->findOrFail($id);

        $request->validate([
            'name'   => 'nullable|string|max:255',
            'email'  => 'nullable|string|email|unique:users,email,' . $admin->id,
            'phone'  => 'nullable|string|max:20',
            'role'   => 'nullable|in:admin,super_admin',
            'status' => 'nullable|in:active,suspended',
        ]);

        $admin->update(array_filter($request->only('name', 'email', 'phone', 'role', 'status')));

        return response()->json([
            'status'  => 'success',
            'message' => 'Admin updated.',
            'admin'   => $admin->fresh(),
        ]);
    }

    public function deleteAdmin($id)
    {
        $admin = User::whereIn('role', ['admin', 'super_admin'])->findOrFail($id);

        if ($admin->role === 'super_admin') {
            return response()->json(['status' => 'error', 'message' => 'Cannot delete Super Admin.'], 400);
        }

        $admin->delete();
        return response()->json(['status' => 'success', 'message' => 'Admin deleted.']);
    }

    // ─── Platform Settings ───────────────────────────────────────

    public function getSettings()
    {
        $defaults = [
            ['key' => 'epoints_per_referral',    'value' => '10',    'group' => 'referral', 'label' => 'E-Points per Referral'],
            ['key' => 'min_wallet_redemption',   'value' => '1000',  'group' => 'wallet',   'label' => 'Minimum E-Points to Redeem'],
            ['key' => 'default_royalty_percent', 'value' => '10',    'group' => 'royalty',  'label' => 'Default Royalty Percentage (%)'],
            ['key' => 'referral_discount_pct',   'value' => '10',    'group' => 'referral', 'label' => 'First Booking Discount for Referred Customer (%)'],
            ['key' => 'sms_notifications',       'value' => 'false', 'group' => 'notifications', 'label' => 'Enable SMS Notifications'],
            ['key' => 'email_notifications',     'value' => 'true',  'group' => 'notifications', 'label' => 'Enable Email Notifications'],
            ['key' => 'push_notifications',      'value' => 'false', 'group' => 'notifications', 'label' => 'Enable Push Notifications'],
            ['key' => 'platform_name',           'value' => 'CleanAtDoorstep', 'group' => 'general', 'label' => 'Platform Name'],
        ];

        foreach ($defaults as $d) {
            PlatformSetting::firstOrCreate(['key' => $d['key']], $d);
        }

        $settings = PlatformSetting::orderBy('group')->get();
        return response()->json($settings);
    }

    public function updateSettings(Request $request)
    {
        $request->validate([
            'settings'          => 'required|array',
            'settings.*.key'   => 'required|string',
            'settings.*.value' => 'required',
        ]);

        foreach ($request->settings as $setting) {
            PlatformSetting::set($setting['key'], $setting['value']);
        }

        return response()->json(['status' => 'success', 'message' => 'Settings updated.']);
    }

    // ─── Full Database Access ────────────────────────────────────

    public function getAllUsers()
    {
        return response()->json(User::with(['franchisee', 'vehicles'])->orderBy('created_at', 'desc')->get());
    }

    public function getAllOrders()
    {
        return response()->json(Booking::with(['customer:id,name,phone', 'vehicle', 'franchisee', 'package'])->orderBy('created_at', 'desc')->get());
    }

    public function getAllWalletTransactions()
    {
        return response()->json(
            WalletTransaction::with('user:id,name,email')
                ->orderBy('created_at', 'desc')
                ->paginate(50)
        );
    }

    public function createOrder(Request $request)
    {
        $request->validate([
            'customer_id'   => 'required|exists:users,id',
            'vehicle_id'    => 'required|exists:vehicles,id',
            'package_id'    => 'nullable|exists:service_packages,id',
            'franchisee_id' => 'nullable|exists:franchisees,id',
            'booking_date'  => 'required|date',
            'slot_time'     => 'required|string',
            'total_price'   => 'required|numeric|min:0',
            'payment_status'=> 'required|in:unpaid,paid',
        ]);

        $booking = Booking::create([
            'customer_id'   => $request->customer_id,
            'vehicle_id'    => $request->vehicle_id,
            'package_id'    => $request->package_id,
            'franchisee_id' => $request->franchisee_id,
            'booking_date'  => $request->booking_date,
            'slot_time'     => $request->slot_time,
            'total_price'   => $request->total_price,
            'payment_status'=> $request->payment_status,
            'status'        => $request->franchisee_id ? 'assigned' : 'pending',
            'payment_method'=> 'manual',
        ]);

        return response()->json([
            'status'  => 'success',
            'message' => 'Booking created successfully.',
            'booking' => $booking->load(['customer', 'vehicle', 'franchisee', 'package'])
        ], 201);
    }

    public function assignOrder(Request $request, $id)
    {
        $booking = Booking::findOrFail($id);
        $request->validate(['franchisee_id' => 'required|exists:franchisees,id']);
        
        $booking->update([
            'franchisee_id' => $request->franchisee_id,
            'status' => 'assigned'
        ]);

        return response()->json(['status' => 'success', 'message' => 'Booking assigned successfully.', 'booking' => $booking]);
    }

    public function rescheduleOrder(Request $request, $id)
    {
        $booking = Booking::findOrFail($id);
        $request->validate([
            'booking_date' => 'required|date',
            'slot_time'    => 'required|string'
        ]);

        $booking->update([
            'booking_date' => $request->booking_date,
            'slot_time'    => $request->slot_time,
            'status'       => $booking->status === 'cancelled' ? 'pending' : ($booking->status === 'pending' ? 'pending' : 'postponed')
        ]);

        return response()->json(['status' => 'success', 'message' => 'Booking rescheduled successfully.', 'booking' => $booking]);
    }

    public function changePlan(Request $request, $id)
    {
        $booking = Booking::findOrFail($id);
        $request->validate([
            'package_id'      => 'required|exists:service_packages,id',
            'total_price'     => 'required|numeric|min:0',
            'addon_services'  => 'nullable|array',
            'addon_services.*.name'  => 'required_with:addon_services|string',
            'addon_services.*.price' => 'required_with:addon_services|numeric|min:0',
            'addon_price'     => 'nullable|numeric|min:0',
        ]);

        $updateData = [
            'package_id'  => $request->package_id,
            'total_price' => $request->total_price,
        ];

        if ($request->has('addon_services')) {
            $updateData['addon_services'] = $request->addon_services;
            $updateData['addon_price'] = $request->addon_price ?? 0;
        }

        $booking->update($updateData);

        return response()->json(['status' => 'success', 'message' => 'Plan updated successfully.', 'booking' => $booking->load('package')]);
    }

    public function cancelOrder(Request $request, $id)
    {
        $booking = Booking::findOrFail($id);
        $booking->update(['status' => 'cancelled']);
        return response()->json(['status' => 'success', 'message' => 'Booking cancelled successfully.', 'booking' => $booking]);
    }

    public function refundOrder(Request $request, $id)
    {
        $booking = Booking::findOrFail($id);
        if ($booking->status !== 'cancelled') {
            return response()->json(['status' => 'error', 'message' => 'Only cancelled bookings can be refunded.'], 400);
        }
        $booking->update(['payment_status' => 'refunded']);
        return response()->json(['status' => 'success', 'message' => 'Booking refunded successfully.', 'booking' => $booking]);
    }

    public function downloadInvoice($id)
    {
        $booking = Booking::with(['customer', 'vehicle', 'franchisee', 'package'])->findOrFail($id);
        return view('invoice.booking', compact('booking'));
    }

    // ─── Categories Management ──────────────────────────────────────────

    public function getCategories()
    {
        return response()->json(ServiceCategory::all());
    }

    public function createCategory(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'status' => 'required|in:active,inactive'
        ]);

        $category = ServiceCategory::create($request->all());
        return response()->json(['status' => 'success', 'message' => 'Category created successfully.', 'category' => $category]);
    }

    public function updateCategory(Request $request, $id)
    {
        $category = ServiceCategory::findOrFail($id);
        
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'status' => 'required|in:active,inactive'
        ]);

        $category->update($request->all());
        return response()->json(['status' => 'success', 'message' => 'Category updated successfully.', 'category' => $category]);
    }

    public function deleteCategory($id)
    {
        $category = ServiceCategory::findOrFail($id);
        $category->delete();
        return response()->json(['status' => 'success', 'message' => 'Category deleted successfully.']);
    }

    // ─── Services Management ────────────────────────────────────────────

    public function getServices()
    {
        return response()->json(ServicePackage::with('category')->get());
    }

    public function createService(Request $request)
    {
        $request->validate([
            'category_id' => 'required|exists:service_categories,id',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'vehicle_type' => 'required|string|max:100',
            'price' => 'required|numeric|min:0',
            'frequency_days' => 'required|integer|min:1',
            'max_bookings' => 'required|integer|min:1',
            'custom_badge' => 'nullable|string|max:255',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048'
        ]);

        $data = $request->except('image');

        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('services', 'public');
            $data['image_path'] = $path;
        }

        $service = ServicePackage::create($data);
        return response()->json(['status' => 'success', 'message' => 'Service created successfully.', 'service' => $service->load('category')]);
    }

    public function updateService(Request $request, $id)
    {
        $service = ServicePackage::findOrFail($id);

        $request->validate([
            'category_id' => 'required|exists:service_categories,id',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'vehicle_type' => 'required|string|max:100',
            'price' => 'required|numeric|min:0',
            'frequency_days' => 'required|integer|min:1',
            'max_bookings' => 'required|integer|min:1',
            'custom_badge' => 'nullable|string|max:255',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048'
        ]);

        $data = $request->except('image');

        if ($request->hasFile('image')) {
            // Delete old image if exists
            if ($service->image_path) {
                Storage::disk('public')->delete($service->image_path);
            }
            $path = $request->file('image')->store('services', 'public');
            $data['image_path'] = $path;
        }

        $service->update($data);
        return response()->json(['status' => 'success', 'message' => 'Service updated successfully.', 'service' => $service->load('category')]);
    }

    public function deleteService($id)
    {
        $service = ServicePackage::findOrFail($id);
        if ($service->image_path) {
            Storage::disk('public')->delete($service->image_path);
        }
        $service->delete();
        return response()->json(['status' => 'success', 'message' => 'Service deleted successfully.']);
    }

    // ── Customer Management ──────────────────────────────────────────────────

    public function getCustomers(Request $request)
    {
        $query = User::where('role', 'customer')
            ->withCount(['bookings', 'supportTickets']);

        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        if ($request->has('status') && !empty($request->status)) {
            $query->where('status', $request->status);
        }

        $perPage = $request->input('per_page', 10);
        $customers = $query->orderBy('created_at', 'desc')->paginate($perPage);
            
        return response()->json($customers);
    }

    public function getCustomerDetails($id)
    {
        $customer = User::where('role', 'customer')
            ->with([
                'vehicles',
                'bookings' => function($q) { $q->orderBy('booking_date', 'desc'); },
                'bookings.package',
                'subscriptions' => function($q) { $q->orderBy('created_at', 'desc'); },
                'subscriptions.package',
                'walletTransactions' => function($q) { $q->orderBy('created_at', 'desc'); },
                'supportTickets' => function($q) { $q->orderBy('created_at', 'desc'); },
                'referrals',
                'referrer'
            ])
            ->findOrFail($id);
            
        return response()->json($customer);
    }

    public function toggleCustomerStatus($id)
    {
        $customer = User::where('role', 'customer')->findOrFail($id);
        $customer->status = ($customer->status === 'active') ? 'blocked' : 'active';
        $customer->save();
        
        return response()->json([
            'status' => 'success',
            'message' => 'Customer status updated successfully.',
            'customer_status' => $customer->status
        ]);
    }
}
