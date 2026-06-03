<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Franchisee;
use App\Models\Booking;
use App\Models\Subscription;
use App\Models\WalletTransaction;
use App\Models\PlatformSetting;
use Illuminate\Support\Facades\Hash;
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
        return response()->json(User::with('franchisee')->orderBy('created_at', 'desc')->get());
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
}
