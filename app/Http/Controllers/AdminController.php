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
use App\Models\Washer;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\File;
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
        $users = User::with(['franchisee', 'washer.franchisee'])->orderBy('created_at', 'desc')->get();
        return response()->json($users);
    }

    public function createUser(Request $request)
    {
        if ($request->user()->role !== 'super_admin') {
            return response()->json([
                'status'  => 'error',
                'message' => 'Unauthorized. Only Super Admin can create users.',
            ], 403);
        }

        $request->validate([
            'name'          => 'required|string|max:255',
            'email'         => 'required|string|email|max:255|unique:users',
            'phone'         => 'nullable|string|max:20',
            'password'      => 'required|string|min:6',
            'role'          => 'required|string|in:super_admin,admin,franchisee,washer,customer',
            'status'        => 'required|string|in:active,suspended',
            'royalty_percentage' => 'nullable|numeric|min:0',
            'franchisee_id' => 'nullable|exists:franchisees,id',
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
                'royalty_percentage' => $request->input('royalty_percentage', 100.0),
                'status'             => 'active',
            ]);
        } elseif ($request->role === 'washer') {
            Washer::create([
                'user_id'       => $user->id,
                'franchisee_id' => $request->franchisee_id,
                'status'        => $request->status === 'suspended' ? 'inactive' : 'active',
            ]);
        }

        return response()->json([
            'status'  => 'success',
            'message' => 'User created successfully',
            'user'    => $user->load(['franchisee', 'washer.franchisee']),
        ], 201);
    }

    public function updateUser(Request $request, $id)
    {
        $user = User::findOrFail($id);
        $request->validate([
            'name'          => 'required|string|max:255',
            'email'         => 'required|string|email|max:255|unique:users,email,' . $user->id,
            'phone'         => 'nullable|string|max:20',
            'role'          => 'required|string|in:super_admin,admin,franchisee,washer,customer',
            'status'        => 'required|string|in:active,inactive,suspended',
            'royalty_percentage' => 'nullable|numeric|min:0',
            'franchisee_id' => 'nullable|exists:franchisees,id',
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
                'status'             => in_array($request->status, ['active', 'inactive', 'suspended']) ? $request->status : $user->franchisee->status,
            ]);
        } elseif ($request->role === 'washer') {
            Washer::updateOrCreate(
                ['user_id' => $user->id],
                [
                    'franchisee_id' => $request->franchisee_id,
                    'status'        => $request->status === 'suspended' ? 'inactive' : 'active',
                ]
            );
        }

        return response()->json([
            'status'  => 'success',
            'message' => 'User updated successfully',
            'user'    => $user->load(['franchisee', 'washer.franchisee']),
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

        if (empty($user->email)) {
            return response()->json([
                'status'  => 'error',
                'message' => 'This user account does not have a registered email address.',
            ], 422);
        }

        try {
            DB::table('password_reset_tokens')->where('email', $user->email)->delete();

            $status = Password::broker()->sendResetLink(['email' => $user->email]);

            if ($status === Password::RESET_LINK_SENT) {
                return response()->json([
                    'status'  => 'success',
                    'message' => 'Password reset link sent to ' . $user->email . ' successfully. The link will expire in 10 minutes.',
                ]);
            }

            return response()->json([
                'status'  => 'error',
                'message' => __($status),
            ], 400);
        } catch (\Throwable $e) {
            Log::error('Password reset email failed for ' . $user->email . ': ' . $e->getMessage());
            return response()->json([
                'status'  => 'error',
                'message' => 'Failed to send password reset email: ' . $e->getMessage(),
            ], 500);
        }
    }

    // ─── Orders ──────────────────────────────────────────────────

    public function getOrders(Request $request)
    {
        $orders = Booking::with(['customer:id,name,phone', 'vehicle', 'franchisee', 'package', 'washer.user'])
            ->orderBy('booking_date', 'desc')
            ->get();
        return response()->json($orders);
    }

    public function modifyOrder(Request $request, $id)
    {
        $booking = Booking::findOrFail($id);

        if ($booking->status === 'completed' || $booking->status === 'cancelled') {
            return response()->json([
                'status'  => 'error',
                'message' => 'Completed or cancelled wash bookings cannot be edited.',
            ], 422);
        }

        $request->validate([
            'franchisee_id'  => 'nullable|exists:franchisees,id',
            'washer_id'      => 'nullable|exists:washers,id',
            'booking_date'   => 'nullable|date',
            'slot_time'      => 'nullable|string',
            'status'         => 'nullable|string|in:pending,assigned,ongoing,completed,cancelled,postponed',
            'payment_status' => 'nullable|string|in:unpaid,paid,partially_paid,pending_payment,failed,refunded',
            'total_price'    => 'nullable|numeric',
        ]);

        $booking->update($request->only('franchisee_id', 'washer_id', 'booking_date', 'slot_time', 'status', 'payment_status', 'total_price'));

        if ($booking->payment_status === 'paid' && $booking->paid_amount < $booking->total_price) {
            $booking->paid_amount = $booking->total_price;
            $booking->save();
        }

        return response()->json([
            'status'  => 'success',
            'message' => 'Order modified successfully',
            'booking' => $booking->load(['customer', 'vehicle', 'franchisee', 'washer.user']),
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

    public function updateSlot(Request $request, $id)
    {
        $slot = Slot::findOrFail($id);
        $request->validate([
            'max_bookings' => 'nullable|integer|min:1',
            'status'       => 'nullable|in:active,inactive',
        ]);
        $slot->update($request->only('max_bookings', 'status'));
        return response()->json(['status' => 'success', 'message' => 'Slot updated.', 'slot' => $slot]);
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
            'vehicle_type'   => 'nullable|string',
            'expires_at'     => 'nullable|date',
        ]);

        $coupon = Coupon::create([
            'code'           => strtoupper($request->code),
            'discount_type'  => $request->discount_type,
            'discount_value' => $request->discount_value,
            'vehicle_type'   => $request->vehicle_type ?: 'all',
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
                $rate = $stat->franchisee ? $stat->franchisee->royalty_percentage : 0;
                $stat->royalty = $stat->count * $rate;
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
        $request->validate(['status' => 'required|in:active,inactive,pending,suspended,rejected']);
        $franchisee->update(['status' => $request->status]);

        if ($franchisee->user) {
            if ($request->status === 'suspended' || $request->status === 'rejected') {
                $franchisee->user->update(['status' => 'suspended']);
            } else {
                // For 'inactive', 'active', 'pending': user status is active so they can log in
                $franchisee->user->update(['status' => 'active']);
            }
        }

        return response()->json([
            'status'     => 'success',
            'message'    => 'Franchise status updated.',
            'franchisee' => $franchisee->load('user:id,name,email,phone,status')
        ]);
    }

    public function renewAgreement(Request $request, $id)
    {
        $franchisee = Franchisee::findOrFail($id);
        $request->validate(['agreement_expires_at' => 'required|date']);
        $franchisee->update(['agreement_expires_at' => $request->agreement_expires_at]);
        return response()->json(['status' => 'success', 'message' => 'Agreement renewed.', 'franchisee' => $franchisee]);
    }

    public function uploadDocument(Request $request, $id)
    {
        try {
            $franchisee = Franchisee::findOrFail($id);
            $request->validate([
                'document'    => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:10240',
                'documents'   => 'nullable|array',
                'documents.*' => 'file|mimes:pdf,jpg,jpeg,png|max:10240',
            ]);

            $files = [];
            if ($request->hasFile('documents')) {
                $files = $request->file('documents');
            } elseif ($request->hasFile('document')) {
                $files = [$request->file('document')];
            }

            if (empty($files)) {
                return response()->json(['status' => 'error', 'message' => 'Please select at least one document to upload.'], 422);
            }

            // Ensure destination directory exists and is writable
            $targetDir = public_path('franchise_documents');
            if (!file_exists($targetDir)) {
                @mkdir($targetDir, 0777, true);
            }
            if (file_exists($targetDir)) {
                @chmod($targetDir, 0777);
            }

            // Auto-heal: Ensure `documents` JSON column exists on franchisees table
            if (!Schema::hasColumn('franchisees', 'documents')) {
                try {
                    Schema::table('franchisees', function (Blueprint $table) {
                        $table->json('documents')->nullable()->after('document_path');
                    });
                } catch (\Throwable $colEx) {
                    Log::warning('Could not auto-add documents column: ' . $colEx->getMessage());
                }
            }

            $existingDocs = is_array($franchisee->documents) ? $franchisee->documents : [];
            if (empty($existingDocs) && !empty($franchisee->document_path)) {
                $existingDocs[] = [
                    'id'          => 'legacy_1',
                    'name'        => basename($franchisee->document_path),
                    'path'        => $franchisee->document_path,
                    'uploaded_at' => now()->toDateTimeString(),
                ];
            }

            $uploadedDocs = [];
            foreach ($files as $file) {
                $filename = time() . '_' . uniqid() . '_' . preg_replace('/[^a-zA-Z0-9._-]/', '_', $file->getClientOriginalName());
                $file->move($targetDir, $filename);
                @chmod($targetDir . '/' . $filename, 0666);

                $uploadedDocs[] = [
                    'id'          => uniqid('doc_'),
                    'name'        => $file->getClientOriginalName(),
                    'path'        => 'franchise_documents/' . $filename,
                    'uploaded_at' => now()->toDateTimeString(),
                    'size'        => @filesize($targetDir . '/' . $filename) ?: null,
                ];
            }

            $allDocs = array_merge($existingDocs, $uploadedDocs);
            $firstPath = !empty($allDocs) ? $allDocs[0]['path'] : null;

            if (Schema::hasColumn('franchisees', 'documents')) {
                $franchisee->documents = $allDocs;
            }
            $franchisee->document_path = $firstPath;
            $franchisee->save();

            return response()->json([
                'status'     => 'success',
                'message'    => count($uploadedDocs) . ' document(s) uploaded successfully.',
                'franchisee' => $franchisee->fresh(),
                'documents'  => $allDocs,
            ]);
        } catch (\Throwable $e) {
            Log::error('Upload document error on franchisee #' . $id . ': ' . $e->getMessage(), [
                'exception' => $e
            ]);
            return response()->json([
                'status'  => 'error',
                'message' => 'Upload failed: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function deleteDocument(Request $request, $id, $docId = null)
    {
        try {
            $franchisee = Franchisee::findOrFail($id);
            $targetDocId = $docId ?: $request->input('doc_id');

            $existingDocs = is_array($franchisee->documents) ? $franchisee->documents : [];
            if (empty($existingDocs) && !empty($franchisee->document_path)) {
                $existingDocs[] = [
                    'id'   => 'legacy_1',
                    'name' => basename($franchisee->document_path),
                    'path' => $franchisee->document_path,
                ];
            }

            if ($targetDocId) {
                // Delete only the specified document
                $remainingDocs = [];
                foreach ($existingDocs as $doc) {
                    if (($doc['id'] ?? '') === $targetDocId || ($doc['path'] ?? '') === $targetDocId) {
                        if (!empty($doc['path']) && file_exists(public_path($doc['path']))) {
                            @unlink(public_path($doc['path']));
                        }
                    } else {
                        $remainingDocs[] = $doc;
                    }
                }
                if (Schema::hasColumn('franchisees', 'documents')) {
                    $franchisee->documents = array_values($remainingDocs);
                }
                $franchisee->document_path = !empty($remainingDocs) ? $remainingDocs[0]['path'] : null;
                $franchisee->save();
            } else {
                // Delete all documents
                foreach ($existingDocs as $doc) {
                    if (!empty($doc['path']) && file_exists(public_path($doc['path']))) {
                        @unlink(public_path($doc['path']));
                    }
                }
                if ($franchisee->document_path && file_exists(public_path($franchisee->document_path))) {
                    @unlink(public_path($franchisee->document_path));
                }
                if (Schema::hasColumn('franchisees', 'documents')) {
                    $franchisee->documents = [];
                }
                $franchisee->document_path = null;
                $franchisee->save();
            }

            return response()->json([
                'status'     => 'success',
                'message'    => 'Document removed successfully.',
                'franchisee' => $franchisee->fresh(),
                'documents'  => $franchisee->fresh()->documents,
            ]);
        } catch (\Throwable $e) {
            Log::error('Delete document error on franchisee #' . $id . ': ' . $e->getMessage());
            return response()->json([
                'status'  => 'error',
                'message' => 'Failed to delete document: ' . $e->getMessage(),
            ], 500);
        }
    }

    // ─── Package Management ──────────────────────────────────────

    public function getPackages()
    {
        return response()->json(ServicePackage::onlySubscriptions()->orderBy('vehicle_type')->get());
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

        $data = $request->only('name', 'description', 'vehicle_type', 'price', 'frequency_days', 'max_bookings');
        $data['is_subscription'] = true;
        $data['is_addon'] = false;

        $package = ServicePackage::create($data);

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

        $data = $request->only('name', 'description', 'vehicle_type', 'price', 'frequency_days', 'max_bookings');
        $data['is_subscription'] = true;
        $package->update($data);
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
            ->with([
                'referrer:id,name,email,phone,referral_code',
                'bookings' => function($q) { $q->where('status', 'completed'); }
            ])
            ->select('id', 'name', 'email', 'phone', 'referral_code', 'status', 'referred_by', 'e_points', 'pending_epoints', 'created_at')
            ->orderBy('created_at', 'desc')
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
            ->get(['id', 'name', 'email', 'phone', 'referral_code', 'e_points']);

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

    public function storeTicket(Request $request)
    {
        $request->validate([
            'subject' => 'required|string|max:255',
            'body'    => 'required|string',
            'image'   => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:10240',
        ]);

        $imagePath = null;
        if ($request->hasFile('image')) {
            $file = $request->file('image');
            $filename = 'ticket_' . time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
            $destinationPath = public_path('uploads/tickets');
            if (!File::exists($destinationPath)) {
                File::makeDirectory($destinationPath, 0777, true, true);
            }
            if (File::exists($destinationPath) && !is_writable($destinationPath)) {
                @chmod($destinationPath, 0777);
            }
            $file->move($destinationPath, $filename);
            $imagePath = '/uploads/tickets/' . $filename;
        }

        $ticket = SupportTicket::create([
            'customer_id' => $request->user()->id,
            'subject'     => $request->subject,
            'body'        => $request->body,
            'image'       => $imagePath,
            'status'      => 'open',
        ]);

        return response()->json([
            'status'  => 'success',
            'message' => 'Support ticket created successfully.',
            'ticket'  => $ticket->load('customer:id,name,email,phone'),
        ], 201);
    }

    public function updateTicket(Request $request, $id)
    {
        $ticket = SupportTicket::findOrFail($id);
        $request->validate([
            'status'      => 'nullable|in:open,in_progress,closed',
            'admin_reply' => 'nullable|string',
            'reply_image' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:10240',
        ]);

        $data = [];
        if ($request->has('status')) {
            $data['status'] = $request->input('status');
        }
        if ($request->filled('admin_reply')) {
            $data['admin_reply'] = $request->admin_reply;
            $data['replied_at']  = now();
        }
        if ($request->hasFile('reply_image')) {
            $file = $request->file('reply_image');
            $filename = 'reply_' . time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
            $destinationPath = public_path('uploads/tickets');
            if (!File::exists($destinationPath)) {
                File::makeDirectory($destinationPath, 0777, true, true);
            }
            if (File::exists($destinationPath) && !is_writable($destinationPath)) {
                @chmod($destinationPath, 0777);
            }
            $file->move($destinationPath, $filename);
            $data['reply_image'] = '/uploads/tickets/' . $filename;
        }

        $ticket->update($data);

        return response()->json([
            'status'  => 'success',
            'message' => 'Ticket updated.',
            'ticket'  => $ticket->load('customer:id,name,email,phone'),
        ]);
    }
}
