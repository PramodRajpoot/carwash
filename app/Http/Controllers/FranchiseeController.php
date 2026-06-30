<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Booking;
use App\Models\Expense;
use App\Models\Franchisee;
use App\Models\Subscription;
use App\Models\Coupon;
use App\Models\RoyaltyPayment;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class FranchiseeController extends Controller
{
    protected function getFranchisee(Request $request): Franchisee
    {
        return Franchisee::where('user_id', $request->user()->id)->firstOrFail();
    }

    public function dashboard(Request $request)
    {
        $franchisee = $this->getFranchisee($request);

        $now = Carbon::now();

        $daily   = Booking::where('franchisee_id', $franchisee->id)->where('status', 'completed')->whereDate('booking_date', $now->toDateString())->sum('total_price');
        $weekly  = Booking::where('franchisee_id', $franchisee->id)->where('status', 'completed')->whereBetween('booking_date', [$now->startOfWeek()->toDateString(), $now->endOfWeek()->toDateString()])->sum('total_price');
        $monthly = Booking::where('franchisee_id', $franchisee->id)->where('status', 'completed')->whereYear('booking_date', $now->year)->whereMonth('booking_date', $now->month)->sum('total_price');
        $yearly  = Booking::where('franchisee_id', $franchisee->id)->where('status', 'completed')->whereYear('booking_date', $now->year)->sum('total_price');

        $totalOrders     = Booking::where('franchisee_id', $franchisee->id)->count();
        $pendingOrders   = Booking::where('franchisee_id', $franchisee->id)->whereIn('status', ['pending', 'assigned'])->count();
        $completedOrders = Booking::where('franchisee_id', $franchisee->id)->where('status', 'completed')->count();

        // Active subscriptions assigned to this franchisee's customers
        $activeSubscriptions = Subscription::whereHas('bookings', function($q) use ($franchisee) {
            $q->where('franchisee_id', $franchisee->id);
        })->where('status', 'active')->count();

        // Upcoming royalty
        $upcomingRoyalty = RoyaltyPayment::where('franchisee_id', $franchisee->id)
            ->where('status', '!=', 'paid')
            ->orderBy('due_date', 'asc')
            ->first();

        $royaltyAlert = false;
        if ($upcomingRoyalty) {
            $daysUntilDue = Carbon::now()->diffInDays(Carbon::parse($upcomingRoyalty->due_date), false);
            $royaltyAlert = $daysUntilDue <= 7;
        }

        $assignedTimeRanges = \App\Models\Slot::where('franchisee_id', $franchisee->id)
            ->select('time_range')
            ->distinct()
            ->pluck('time_range')
            ->toArray();

        return response()->json([
            'franchisee'          => $franchisee,
            'assigned_slots'      => $assignedTimeRanges,
            'revenue'             => compact('daily', 'weekly', 'monthly', 'yearly'),
            'total_orders'        => $totalOrders,
            'pending_orders'      => $pendingOrders,
            'completed_orders'    => $completedOrders,
            'active_subscriptions' => $activeSubscriptions,
            'upcoming_royalty'    => $upcomingRoyalty,
            'royalty_alert'       => $royaltyAlert,
        ]);
    }

    public function getOrders(Request $request)
    {
        $franchisee = $this->getFranchisee($request);

        $orders = Booking::where('franchisee_id', $franchisee->id)
            ->with(['customer:id,name,phone', 'vehicle'])
            ->orderBy('booking_date', 'desc')
            ->get();

        return response()->json($orders);
    }

    public function updateBookingStatus(Request $request, $id)
    {
        $franchisee = $this->getFranchisee($request);

        $booking = Booking::where('franchisee_id', $franchisee->id)->findOrFail($id);

        $request->validate([
            'status' => 'required|string|in:assigned,ongoing,completed,cancelled,postponed',
        ]);

        $oldStatus = $booking->status;
        $booking->update(['status' => $request->status]);

        // When booking is completed, confirm pending E-Points for referrer
        if ($request->status === 'completed' && $oldStatus !== 'completed') {
            $customer = $booking->customer;
            if ($customer && $customer->referred_by && $customer->first_booking_discount) {
                $referrer = \App\Models\User::find($customer->referred_by);
                if ($referrer && $referrer->pending_epoints >= 10) {
                    $referrer->decrement('pending_epoints', 10);
                    $referrer->increment('e_points', 10);

                    \App\Models\WalletTransaction::where('user_id', $referrer->id)
                        ->where('source', 'referral')
                        ->where('status', 'pending')
                        ->latest()
                        ->first()
                        ?->update(['status' => 'confirmed']);

                    \App\Models\NotificationLog::create([
                        'user_id' => $referrer->id,
                        'type'    => 'referral_reward',
                        'title'   => 'E-Points Confirmed!',
                        'body'    => "Your referred customer {$customer->name} completed their first booking. 10 E-Points added to your wallet!",
                    ]);
                }

                // Clear the discount flag so it can't be used again
                $customer->update(['first_booking_discount' => false]);
            }
        }

        return response()->json([
            'status'  => 'success',
            'message' => 'Order status updated.',
            'booking' => $booking->load(['customer:id,name,phone', 'vehicle']),
        ]);
    }

    public function getExpenses(Request $request)
    {
        $franchisee = $this->getFranchisee($request);

        $expenses = Expense::where('franchisee_id', $franchisee->id)
            ->orderBy('expense_date', 'desc')
            ->get();

        return response()->json($expenses);
    }

    public function addExpense(Request $request)
    {
        $franchisee = $this->getFranchisee($request);

        $request->validate([
            'category'     => 'required|string|in:salary,chemical,maintenance,other',
            'amount'       => 'required|numeric|min:0',
            'description'  => 'nullable|string',
            'expense_date' => 'required|date',
        ]);

        $expense = Expense::create([
            'franchisee_id' => $franchisee->id,
            'category'      => $request->category,
            'amount'        => $request->amount,
            'description'   => $request->description,
            'expense_date'  => $request->expense_date,
        ]);

        return response()->json([
            'status'  => 'success',
            'message' => 'Expense recorded.',
            'expense' => $expense,
        ], 201);
    }

    public function deleteExpense(Request $request, $id)
    {
        $franchisee = $this->getFranchisee($request);
        $expense = Expense::where('franchisee_id', $franchisee->id)->findOrFail($id);
        $expense->delete();

        return response()->json(['status' => 'success', 'message' => 'Expense deleted.']);
    }

    public function getReports(Request $request)
    {
        $franchisee = $this->getFranchisee($request);
        $period = $request->input('period', 'monthly'); // daily, weekly, monthly, yearly
        $now = Carbon::now();

        $query = Booking::where('franchisee_id', $franchisee->id)->where('status', 'completed');
        $expQuery = Expense::where('franchisee_id', $franchisee->id);

        switch ($period) {
            case 'daily':
                $query->whereDate('booking_date', $now->toDateString());
                $expQuery->whereDate('expense_date', $now->toDateString());
                break;
            case 'weekly':
                $query->whereBetween('booking_date', [$now->startOfWeek()->toDateString(), $now->endOfWeek()->toDateString()]);
                $expQuery->whereBetween('expense_date', [$now->copy()->startOfWeek()->toDateString(), $now->copy()->endOfWeek()->toDateString()]);
                break;
            case 'yearly':
                $query->whereYear('booking_date', $now->year);
                $expQuery->whereYear('expense_date', $now->year);
                break;
            default: // monthly
                $query->whereYear('booking_date', $now->year)->whereMonth('booking_date', $now->month);
                $expQuery->whereYear('expense_date', $now->year)->whereMonth('expense_date', $now->month);
        }

        $revenue       = $query->sum('total_price');
        $ordersCount   = $query->count();
        $totalExpenses = $expQuery->sum('amount');
        $royaltyAmount = $revenue * ($franchisee->royalty_percentage / 100);
        $netProfit     = $revenue - $totalExpenses - $royaltyAmount;

        $expenseBreakdown = Expense::where('franchisee_id', $franchisee->id)
            ->select('category', \DB::raw('sum(amount) as total'))
            ->groupBy('category')
            ->get();

        return response()->json([
            'period'            => $period,
            'revenue'           => $revenue,
            'orders_count'      => $ordersCount,
            'total_expenses'    => $totalExpenses,
            'royalty_amount'    => $royaltyAmount,
            'net_profit'        => $netProfit,
            'expense_breakdown' => $expenseBreakdown,
        ]);
    }

    public function getRoyalty(Request $request)
    {
        $franchisee = $this->getFranchisee($request);

        $royalties = RoyaltyPayment::where('franchisee_id', $franchisee->id)
            ->orderBy('due_date', 'desc')
            ->get();

        $upcoming = $royalties->where('status', '!=', 'paid')->first();
        $daysUntilDue = null;
        if ($upcoming) {
            $daysUntilDue = Carbon::now()->diffInDays(Carbon::parse($upcoming->due_date), false);
        }

        return response()->json([
            'royalties'      => $royalties,
            'upcoming'       => $upcoming,
            'days_until_due' => $daysUntilDue,
            'alert'          => $daysUntilDue !== null && $daysUntilDue <= 7,
            'royalty_rate'   => $franchisee->royalty_percentage,
        ]);
    }

    public function getSubscriptions(Request $request)
    {
        $franchisee = $this->getFranchisee($request);

        $subscriptions = Subscription::with(['customer:id,name,phone', 'package'])
            ->whereHas('bookings', function($q) use ($franchisee) {
                $q->where('franchisee_id', $franchisee->id);
            })
            ->where('status', 'active')
            ->get();

        return response()->json($subscriptions);
    }

    public function rescheduleService(Request $request, $bookingId)
    {
        $franchisee = $this->getFranchisee($request);

        $booking = Booking::where('franchisee_id', $franchisee->id)
            ->whereIn('status', ['pending', 'assigned'])
            ->findOrFail($bookingId);

        $request->validate([
            'booking_date' => 'required|date|after_or_equal:today',
            'slot_time'    => 'required|string',
        ]);

        $booking->update([
            'booking_date' => $request->booking_date,
            'slot_time'    => $request->slot_time,
            'status'       => 'postponed',
        ]);

        \App\Models\NotificationLog::create([
            'user_id' => $booking->customer_id,
            'type'    => 'service_reminder',
            'title'   => 'Service Rescheduled',
            'body'    => "Your booking has been rescheduled to {$request->booking_date} at {$request->slot_time}.",
        ]);

        return response()->json([
            'status'  => 'success',
            'message' => 'Service rescheduled.',
            'booking' => $booking->fresh(),
        ]);
    }

    public function getOffers(Request $request)
    {
        $coupons = Coupon::where('status', 'active')
            ->where(function($q) {
                $q->whereNull('expires_at')->orWhere('expires_at', '>=', now()->toDateString());
            })
            ->get();

        return response()->json([
            'offers' => $coupons,
        ]);
    }
}
