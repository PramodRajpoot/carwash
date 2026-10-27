<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Washer;
use App\Models\User;
use App\Models\Franchisee;
use App\Models\Booking;
use App\Models\WalletTransaction;
use App\Models\NotificationLog;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

class WasherController extends Controller
{
    // ─── Admin & Super Admin Management ──────────────────────────────

    public function index(Request $request)
    {
        $query = Washer::with(['user', 'franchisee']);

        if ($request->has('franchisee_id') && $request->franchisee_id !== '') {
            $query->where('franchisee_id', $request->franchisee_id);
        }

        if ($request->has('status') && $request->status !== '') {
            $query->where('status', $request->status);
        }

        $washers = $query->withCount([
            'bookings as total_tasks',
            'bookings as completed_tasks' => function ($q) {
                $q->where('status', 'completed');
            },
            'bookings as active_tasks' => function ($q) {
                $q->whereIn('status', ['assigned', 'ongoing']);
            }
        ])->orderBy('id', 'desc')->get();

        return response()->json($washers);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name'          => 'required|string|max:255',
            'email'         => 'required|string|email|max:255|unique:users',
            'phone'         => 'nullable|string|max:20',
            'password'      => 'required|string|min:6',
            'franchisee_id' => 'nullable|exists:franchisees,id',
            'status'        => 'required|string|in:active,inactive',
            'notes'         => 'nullable|string',
        ]);

        $user = User::create([
            'name'     => $request->name,
            'email'    => $request->email,
            'phone'    => $request->phone,
            'password' => Hash::make($request->password),
            'role'     => 'washer',
            'status'   => $request->status,
        ]);

        $washer = Washer::create([
            'user_id'       => $user->id,
            'franchisee_id' => $request->franchisee_id,
            'status'        => $request->status,
            'notes'         => $request->notes,
        ]);

        return response()->json([
            'status'  => 'success',
            'message' => 'Washer created successfully',
            'washer'  => $washer->load(['user', 'franchisee']),
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $washer = Washer::with('user')->findOrFail($id);

        $request->validate([
            'name'          => 'required|string|max:255',
            'email'         => 'required|string|email|max:255|unique:users,email,' . $washer->user_id,
            'phone'         => 'nullable|string|max:20',
            'password'      => 'nullable|string|min:6',
            'franchisee_id' => 'nullable|exists:franchisees,id',
            'status'        => 'required|string|in:active,inactive',
            'notes'         => 'nullable|string',
        ]);

        $userData = [
            'name'   => $request->name,
            'email'  => $request->email,
            'phone'  => $request->phone,
            'status' => $request->status,
        ];

        if ($request->filled('password')) {
            $userData['password'] = Hash::make($request->password);
        }

        $washer->user->update($userData);

        $washer->update([
            'franchisee_id' => $request->franchisee_id,
            'status'        => $request->status,
            'notes'         => $request->notes,
        ]);

        return response()->json([
            'status'  => 'success',
            'message' => 'Washer updated successfully',
            'washer'  => $washer->fresh(['user', 'franchisee']),
        ]);
    }

    public function destroy($id)
    {
        $washer = Washer::findOrFail($id);
        $user = $washer->user;
        $washer->delete();
        if ($user) {
            $user->delete();
        }

        return response()->json([
            'status'  => 'success',
            'message' => 'Washer removed successfully',
        ]);
    }

    public function assignFranchise(Request $request, $id)
    {
        $washer = Washer::findOrFail($id);

        $request->validate([
            'franchisee_id' => 'nullable|exists:franchisees,id',
        ]);

        $washer->update([
            'franchisee_id' => $request->franchisee_id,
        ]);

        return response()->json([
            'status'  => 'success',
            'message' => 'Franchise center assigned successfully',
            'washer'  => $washer->fresh(['user', 'franchisee']),
        ]);
    }

    // ─── Franchisee Portal Actions ────────────────────────────────────

    public function franchiseeWashers(Request $request)
    {
        $franchisee = Franchisee::where('user_id', $request->user()->id)->firstOrFail();

        $washers = Washer::where('franchisee_id', $franchisee->id)
            ->with('user')
            ->withCount([
                'bookings as total_tasks',
                'bookings as completed_tasks' => function ($q) {
                    $q->where('status', 'completed');
                },
                'bookings as active_tasks' => function ($q) {
                    $q->whereIn('status', ['assigned', 'ongoing']);
                }
            ])
            ->get();

        return response()->json($washers);
    }

    public function franchiseeAssignTask(Request $request, $id)
    {
        $franchisee = Franchisee::where('user_id', $request->user()->id)->firstOrFail();
        $booking = Booking::where('franchisee_id', $franchisee->id)->findOrFail($id);

        if ($booking->status === 'completed' || $booking->status === 'cancelled') {
            return response()->json([
                'status'  => 'error',
                'message' => 'Completed or cancelled bookings cannot be assigned to a washer.',
            ], 422);
        }
            'washer_id' => 'nullable|exists:washers,id',
        ]);

        if ($request->filled('washer_id')) {
            $washer = Washer::where('id', $request->washer_id)
                ->where('franchisee_id', $franchisee->id)
                ->firstOrFail();

            $booking->washer_id = $washer->id;
            if ($booking->status === 'pending') {
                $booking->status = 'assigned';
            }
        } else {
            $booking->washer_id = null;
        }

        $booking->save();

        return response()->json([
            'status'  => 'success',
            'message' => $request->filled('washer_id') ? 'Task assigned to washer successfully' : 'Washer unassigned from task',
            'booking' => $booking->load(['customer', 'vehicle', 'package', 'washer.user']),
        ]);
    }

    // ─── Washer Portal Actions ────────────────────────────────────────

    protected function getAuthenticatedWasher(Request $request): Washer
    {
        $washer = Washer::where('user_id', $request->user()->id)->with('franchisee')->first();
        if (!$washer) {
            $washer = Washer::create([
                'user_id' => $request->user()->id,
                'status'  => 'active',
            ]);
            $washer->load('franchisee');
        }
        return $washer;
    }

    public function washerDashboard(Request $request)
    {
        $washer = $this->getAuthenticatedWasher($request);
        $today = Carbon::today()->toDateString();

        $totalTasks = Booking::where('washer_id', $washer->id)->count();
        $todayTasks = Booking::where('washer_id', $washer->id)->whereDate('booking_date', $today)->count();
        $activeTasks = Booking::where('washer_id', $washer->id)->whereIn('status', ['assigned', 'ongoing'])->count();
        $completedTasks = Booking::where('washer_id', $washer->id)->where('status', 'completed')->count();

        $recentTasks = Booking::where('washer_id', $washer->id)
            ->with(['customer:id,name,phone', 'vehicle', 'package'])
            ->orderBy('booking_date', 'desc')
            ->orderBy('slot_time', 'asc')
            ->limit(5)
            ->get();

        return response()->json([
            'washer'          => $washer,
            'franchisee'      => $washer->franchisee,
            'total_tasks'     => $totalTasks,
            'today_tasks'     => $todayTasks,
            'active_tasks'    => $activeTasks,
            'completed_tasks' => $completedTasks,
            'recent_tasks'    => $recentTasks,
        ]);
    }

    public function washerTasks(Request $request)
    {
        $washer = $this->getAuthenticatedWasher($request);

        $query = Booking::where('washer_id', $washer->id)
            ->with(['customer:id,name,phone,email', 'vehicle', 'package', 'franchisee']);

        if ($request->has('status') && $request->status !== '') {
            $query->where('status', $request->status);
        }

        if ($request->has('date') && $request->date !== '') {
            $query->whereDate('booking_date', $request->date);
        }

        $tasks = $query->orderBy('booking_date', 'desc')->orderBy('slot_time', 'asc')->get();

        return response()->json($tasks);
    }

    public function washerUpdateTaskStatus(Request $request, $id)
    {
        $washer = $this->getAuthenticatedWasher($request);
        $booking = Booking::where('washer_id', $washer->id)->findOrFail($id);

        if ($booking->status === 'completed' || $booking->status === 'cancelled') {
            return response()->json([
                'status'  => 'error',
                'message' => 'Completed or cancelled tasks cannot be updated.',
            ], 422);
        }

        $request->validate([
            'status' => 'required|string|in:ongoing,completed',
        ]);

        $oldStatus = $booking->status;
        $booking->update(['status' => $request->status]);

        // When booking is completed, confirm pending E-Points for referrer as Earning Money
        if ($request->status === 'completed' && $oldStatus !== 'completed') {
            $customer = $booking->customer;
            if ($customer && $customer->referred_by && $customer->first_booking_discount) {
                $referrer = User::find($customer->referred_by);
                if ($referrer) {
                    $commission = (int) round($booking->total_price * 0.10);
                    $referrer->increment('earning_money', $commission);
                    $referrer->pending_epoints = max(0, $referrer->pending_epoints - $commission);
                    $referrer->save();

                    WalletTransaction::create([
                        'user_id'     => $referrer->id,
                        'type'        => 'credit',
                        'amount'      => $commission,
                        'source'      => 'referral_commission',
                        'status'      => 'confirmed',
                        'description' => "10% referral commission for {$customer->name}'s booking #{$booking->id}",
                    ]);

                    NotificationLog::create([
                        'user_id' => $referrer->id,
                        'type'    => 'referral_reward',
                        'title'   => 'Earning Money Received!',
                        'body'    => "Your referred customer {$customer->name} completed their first booking. You earned ₹{$commission} Earning Money!",
                    ]);
                }

                $customer->update(['first_booking_discount' => false]);
            }
        }

        return response()->json([
            'status'  => 'success',
            'message' => 'Task status updated to ' . $request->status,
            'booking' => $booking->fresh(['customer', 'vehicle', 'package']),
        ]);
    }
}
