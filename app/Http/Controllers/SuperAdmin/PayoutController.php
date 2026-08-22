<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\WithdrawalRequest;
use App\Models\WalletTransaction;
use Illuminate\Support\Facades\DB;

class PayoutController extends Controller
{
    public function getWithdrawalRequests(Request $request)
    {
        $query = WithdrawalRequest::with(['user.bankDetail'])
            ->where('type', 'earning_money');

        if ($request->has('status') && $request->status !== '') {
            $query->where('status', $request->status);
        }

        $requests = $query->orderBy('created_at', 'desc')->paginate($request->get('per_page', 20));

        return response()->json($requests);
    }

    public function processWithdrawal(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:approved,rejected',
            'admin_notes' => 'nullable|string'
        ]);

        $withdrawal = WithdrawalRequest::findOrFail($id);

        if ($withdrawal->status !== 'pending') {
            return response()->json(['message' => 'This request has already been processed.'], 400);
        }

        DB::beginTransaction();
        try {
            $withdrawal->status = $request->status;
            $withdrawal->admin_notes = $request->admin_notes;
            $withdrawal->save();

            $user = $withdrawal->user;

            // Find the pending transaction associated with this withdrawal request
            // We match by amount, source, and user, assuming recent pending request
            $transaction = WalletTransaction::where('user_id', $user->id)
                ->where('type', 'debit')
                ->whereIn('source', ['withdrawal', 'earning_withdrawal'])
                ->where('status', 'pending')
                ->where('amount', $withdrawal->amount)
                ->latest()
                ->first();

            if ($request->status === 'approved') {
                if ($transaction) {
                    $transaction->status = 'completed';
                    $transaction->save();
                }
            } else if ($request->status === 'rejected') {
                // Refund the earning money
                $user->earning_money += $withdrawal->amount;
                $user->save();

                if ($transaction) {
                    $transaction->status = 'failed';
                    $transaction->save();
                }

                // Create a refund transaction record
                WalletTransaction::create([
                    'user_id'     => $user->id,
                    'type'        => 'credit',
                    'amount'      => $withdrawal->amount,
                    'source'      => 'earning_refund',
                    'status'      => 'completed',
                    'description' => "Refund for rejected earning money withdrawal request.",
                ]);
            }

            DB::commit();
            return response()->json(['message' => 'Withdrawal request processed successfully.', 'data' => $withdrawal]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to process request.', 'error' => $e->getMessage()], 500);
        }
    }
}
