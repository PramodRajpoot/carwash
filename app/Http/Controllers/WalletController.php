<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\WalletTransaction;
use App\Models\NotificationLog;

class WalletController extends Controller
{
    public function balance(Request $request)
    {
        $user = $request->user();
        return response()->json([
            'e_points'        => $user->e_points,
            'pending_epoints' => $user->pending_epoints,
            'total'           => $user->e_points + $user->pending_epoints,
            'can_redeem'      => $user->e_points >= 1000,
            'min_redeem'      => 1000,
        ]);
    }

    public function history(Request $request)
    {
        $transactions = WalletTransaction::where('user_id', $request->user()->id)
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json($transactions);
    }

    public function redeem(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'amount' => 'required|integer|min:1000',
        ]);

        $amount = (int) $request->amount;

        if ($user->e_points < $amount) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Insufficient confirmed E-Points. Minimum 1000 required.',
            ], 400);
        }

        if ($amount < 1000) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Minimum redemption is 1000 E-Points.',
            ], 400);
        }

        $user->decrement('e_points', $amount);

        WalletTransaction::create([
            'user_id'     => $user->id,
            'type'        => 'debit',
            'amount'      => $amount,
            'source'      => 'redeem',
            'status'      => 'confirmed',
            'description' => "Redeemed {$amount} E-Points",
        ]);

        // Notification
        NotificationLog::create([
            'user_id' => $user->id,
            'type'    => 'wallet_credit',
            'title'   => 'E-Points Redeemed',
            'body'    => "You have successfully redeemed {$amount} E-Points.",
        ]);

        return response()->json([
            'status'    => 'success',
            'message'   => "Successfully redeemed {$amount} E-Points.",
            'remaining' => $user->fresh()->e_points,
        ]);
    }
}
