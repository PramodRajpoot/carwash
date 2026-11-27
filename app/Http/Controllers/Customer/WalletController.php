<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\UserBankDetail;
use App\Models\WithdrawalRequest;
use App\Models\WalletTransaction;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class WalletController extends Controller
{
    public function getBankDetails(Request $request)
    {
        $bankDetails = $request->user()->bankDetail;
        return response()->json($bankDetails);
    }

    public function updateBankDetails(Request $request)
    {
        $validated = $request->validate([
            'account_holder_name' => 'nullable|string|max:255',
            'bank_name'           => 'nullable|string|max:255',
            'account_number'      => 'nullable|string|max:255',
            'ifsc_code'           => 'nullable|string|max:50',
            'upi_id'              => 'nullable|string|max:255',
        ]);

        $bankDetail = UserBankDetail::updateOrCreate(
            ['user_id' => $request->user()->id],
            $validated
        );

        return response()->json(['message' => 'Bank details saved successfully', 'data' => $bankDetail]);
    }

    public function requestWithdrawal(Request $request)
    {
        $request->validate([
            'amount' => 'required|numeric|min:100|max:2000',
        ]);

        $user = $request->user();
        $amount = (float) $request->amount;

        if ($user->earning_money < $amount) {
            return response()->json(['message' => 'Insufficient Earning Money balance.'], 400);
        }

        if ($amount < 100) {
            return response()->json(['message' => 'Minimum withdrawal amount is ₹100.'], 400);
        }

        if ($amount > 2000) {
            return response()->json(['message' => 'Maximum withdrawal amount is ₹2,000 per day.'], 400);
        }

        $todayWithdrawn = (float) WithdrawalRequest::where('user_id', $user->id)
            ->whereDate('created_at', Carbon::today())
            ->where('status', '!=', 'rejected')
            ->sum('amount');

        $dailyLimit = 2000;
        $remainingDailyLimit = max(0, $dailyLimit - $todayWithdrawn);

        if ($todayWithdrawn >= $dailyLimit) {
            return response()->json([
                'message' => 'You have already reached your daily withdrawal limit of ₹2,000 for today.'
            ], 400);
        }

        if ($amount > $remainingDailyLimit) {
            return response()->json([
                'message' => "Maximum withdrawal limit is ₹2,000 per day. You can only withdraw up to ₹" . number_format($remainingDailyLimit, 2) . " more today."
            ], 400);
        }

        DB::beginTransaction();
        try {
            // Deduct earning money immediately
            $user->earning_money -= $amount;
            $user->save();

            // Record transaction
            WalletTransaction::create([
                'user_id'     => $user->id,
                'type'        => 'debit',
                'amount'      => $amount,
                'source'      => 'earning_withdrawal',
                'status'      => 'pending',
                'description' => "Requested withdrawal of ₹{$amount} Earning Money.",
            ]);

            // Create withdrawal request
            $withdrawal = WithdrawalRequest::create([
                'user_id' => $user->id,
                'amount'  => $amount,
                'status'  => 'pending',
                'type'    => 'earning_money',
            ]);

            DB::commit();
            return response()->json(['message' => 'Withdrawal request submitted successfully. The amount will be reflected in your account within 24–48 hours.', 'data' => $withdrawal]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to process request.', 'error' => $e->getMessage()], 500);
        }
    }

    public function getWithdrawalHistory(Request $request)
    {
        $history = $request->user()->withdrawalRequests()->orderBy('created_at', 'desc')->get();
        return response()->json($history);
    }
}
