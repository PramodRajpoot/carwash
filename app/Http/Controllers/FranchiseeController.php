<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Booking;
use App\Models\Expense;
use App\Models\Franchisee;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class FranchiseeController extends Controller
{
    private function getFranchiseeRecord($user)
    {
        $franchisee = Franchisee::where('user_id', $user->id)->first();
        if (!$franchisee) {
            abort(403, 'User is not linked to any Franchisee center.');
        }
        return $franchisee;
    }

    public function dashboard(Request $request)
    {
        $user = $request->user();
        $franchisee = $this->getFranchiseeRecord($user);

        // Earnings
        $todayEarnings = Booking::where('franchisee_id', $franchisee->id)
            ->where('status', 'completed')
            ->whereDate('booking_date', Carbon::today())
            ->sum('total_price');

        $monthlyEarnings = Booking::where('franchisee_id', $franchisee->id)
            ->where('status', 'completed')
            ->whereMonth('booking_date', Carbon::now()->month)
            ->whereYear('booking_date', Carbon::now()->year)
            ->sum('total_price');

        // Orders counts
        $todayOrders = Booking::where('franchisee_id', $franchisee->id)
            ->whereDate('booking_date', Carbon::today())
            ->count();

        $monthlyOrders = Booking::where('franchisee_id', $franchisee->id)
            ->whereMonth('booking_date', Carbon::now()->month)
            ->whereYear('booking_date', Carbon::now()->year)
            ->count();

        // Calculate royalty fee
        // Monthly Royalty is e.g. 10% of monthly earnings
        $royaltyRate = $franchisee->royalty_percentage / 100;
        $royaltyFeesPaid = 0; // Seeding summary values
        $royaltyFeesPending = $monthlyEarnings * $royaltyRate;

        // Recent bookings
        $recentOrders = Booking::where('franchisee_id', $franchisee->id)
            ->with(['customer', 'vehicle'])
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        return response()->json([
            'center_name' => $franchisee->center_name,
            'today_earnings' => $todayEarnings,
            'monthly_earnings' => $monthlyEarnings,
            'today_orders' => $todayOrders,
            'monthly_orders' => $monthlyOrders,
            'royalty_rate' => $franchisee->royalty_percentage,
            'royalty_pending' => $royaltyFeesPending,
            'recent_orders' => $recentOrders
        ]);
    }

    public function getOrders(Request $request)
    {
        $franchisee = $this->getFranchiseeRecord($request->user());
        $orders = Booking::where('franchisee_id', $franchisee->id)
            ->with(['customer', 'vehicle', 'package'])
            ->orderBy('booking_date', 'desc')
            ->get();

        return response()->json($orders);
    }

    public function updateBookingStatus(Request $request, $id)
    {
        $franchisee = $this->getFranchiseeRecord($request->user());
        $booking = Booking::where('franchisee_id', $franchisee->id)->findOrFail($id);

        $request->validate([
            'status' => 'required|string|in:pending,assigned,ongoing,completed,cancelled,postponed',
            'payment_status' => 'nullable|string|in:unpaid,paid',
            'postponed_date' => 'nullable|date',
            'postponed_slot' => 'nullable|string'
        ]);

        $booking->status = $request->status;

        if ($request->filled('payment_status')) {
            $booking->payment_status = $request->payment_status;
        }

        if ($request->status === 'completed') {
            $booking->payment_status = 'paid';
            // If subscription package, increase booking count
            if ($booking->package_id) {
                $sub = $booking->customer->subscriptions()
                    ->where('status', 'active')
                    ->where('package_id', $booking->package_id)
                    ->first();
                if ($sub) {
                    $sub->increment('booking_count');
                }
            }
        }

        if ($request->status === 'postponed' && $request->filled('postponed_date')) {
            $booking->booking_date = $request->postponed_date;
            if ($request->filled('postponed_slot')) {
                $booking->slot_time = $request->postponed_slot;
            }
        }

        $booking->save();

        return response()->json([
            'status' => 'success',
            'message' => 'Booking status updated successfully',
            'booking' => $booking
        ]);
    }

    public function getExpenses(Request $request)
    {
        $franchisee = $this->getFranchiseeRecord($request->user());
        $expenses = Expense::where('franchisee_id', $franchisee->id)
            ->orderBy('expense_date', 'desc')
            ->get();

        return response()->json($expenses);
    }

    public function addExpense(Request $request)
    {
        $franchisee = $this->getFranchiseeRecord($request->user());

        $request->validate([
            'category' => 'required|string|in:salary,chemical,maintenance,other',
            'amount' => 'required|numeric|min:0',
            'description' => 'nullable|string|max:1000',
            'expense_date' => 'required|date'
        ]);

        $expense = Expense::create([
            'franchisee_id' => $franchisee->id,
            'category' => $request->category,
            'amount' => $request->amount,
            'description' => $request->description,
            'expense_date' => $request->expense_date,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Expense logged successfully',
            'expense' => $expense
        ], 201);
    }

    public function deleteExpense(Request $request, $id)
    {
        $franchisee = $this->getFranchiseeRecord($request->user());
        $expense = Expense::where('franchisee_id', $franchisee->id)->findOrFail($id);
        $expense->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Expense deleted successfully'
        ]);
    }

    public function getReports(Request $request)
    {
        $franchisee = $this->getFranchiseeRecord($request->user());

        $year = $request->input('year', Carbon::now()->year);
        $month = $request->input('month', Carbon::now()->month);

        $bookingsQuery = Booking::where('franchisee_id', $franchisee->id)
            ->where('status', 'completed');

        $expensesQuery = Expense::where('franchisee_id', $franchisee->id);

        if ($month) {
            $bookingsQuery->whereMonth('booking_date', $month);
            $expensesQuery->whereMonth('expense_date', $month);
        }
        if ($year) {
            $bookingsQuery->whereYear('booking_date', $year);
            $expensesQuery->whereYear('expense_date', $year);
        }

        $income = $bookingsQuery->sum('total_price');
        $expense = $expensesQuery->sum('amount');
        
        $bookingsList = $bookingsQuery->with(['customer', 'vehicle'])->get();
        $expensesList = $expensesQuery->get();

        return response()->json([
            'year' => $year,
            'month' => $month,
            'total_income' => $income,
            'total_expense' => $expense,
            'net_profit' => $income - $expense - ($income * ($franchisee->royalty_percentage / 100)),
            'royalty_fee' => $income * ($franchisee->royalty_percentage / 100),
            'bookings' => $bookingsList,
            'expenses' => $expensesList
        ]);
    }
}
