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
        return response()->json([
            'total_customers'   => User::where('role', 'customer')->count(),
            'total_franchisees' => User::where('role', 'franchisee')->count(),
            'total_admins'      => User::where('role', 'admin')->count(),
            'total_orders'      => Booking::count(),
            'active_subscriptions' => Subscription::where('status', 'active')->count(),
            'total_wallet_credit' => WalletTransaction::where('type', 'credit')->where('status', 'confirmed')->sum('amount'),
            'total_revenue'     => Booking::where('status', 'completed')->sum('total_price'),
            'total_referrals'   => User::whereNotNull('referred_by')->count(),
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
}
