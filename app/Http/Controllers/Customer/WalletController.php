<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\UserBankDetail;
use App\Models\WithdrawalRequest;
use App\Models\WalletTransaction;
use Illuminate\Support\Facades\DB;

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
            'amount' => 'required|numeric|min:1',
        ]);

        $user = $request->user();
        $amount = $request->amount;

        if ($user->e_points < $amount) {
            return response()->json(['message' => 'Insufficient E-Points balance.'], 400);
        }

        DB::beginTransaction();
        try {
            // Deduct the points immediately
            $user->e_points -= $amount;
            $user->save();

            // Record transaction
            WalletTransaction::create([
                'user_id'     => $user->id,
                'type'        => 'debit',
                'amount'      => $amount,
                'source'      => 'withdrawal',
                'status'      => 'pending',
                'description' => "Requested withdrawal of {$amount} E-Points.",
            ]);

            // Create withdrawal request
            $withdrawal = WithdrawalRequest::create([
                'user_id' => $user->id,
                'amount'  => $amount,
                'status'  => 'pending',
            ]);

            DB::commit();
            return response()->json(['message' => 'Withdrawal request submitted successfully.', 'data' => $withdrawal]);
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
