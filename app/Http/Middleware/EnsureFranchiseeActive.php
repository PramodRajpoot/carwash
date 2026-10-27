<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Models\Franchisee;

class EnsureFranchiseeActive
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     */
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        if ($user && $user->role === 'franchisee') {
            $franchisee = $user->franchisee ?? Franchisee::where('user_id', $user->id)->first();

            if ($franchisee && $franchisee->status === 'inactive') {
                return response()->json([
                    'status'  => 'error',
                    'message' => 'Your franchise account is inactive. Operations are restricted.',
                ], 403);
            }
        }

        return $next($request);
    }
}
