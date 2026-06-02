<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'phone' => 'nullable|string|max:20',
            'password' => 'required|string|min:6|confirmed',
            'referred_by_code' => 'nullable|string',
            'role' => 'nullable|string' // for franchisee self-registration or customers
        ]);

        $referredBy = null;
        if ($request->filled('referred_by_code')) {
            $referredUser = User::where('referral_code', $request->referred_by_code)->first();
            if ($referredUser) {
                $referredBy = $referredUser->id;
                // Reward referrer
                $referredUser->increment('referral_coins', 100);
            }
        }

        // Generate a clean referral code for this user
        $referralCode = strtoupper(Str::random(8));
        while (User::where('referral_code', $referralCode)->exists()) {
            $referralCode = strtoupper(Str::random(8));
        }

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
            'password' => Hash::make($request->password),
            'role' => $request->role ?? 'customer',
            'referral_code' => $referralCode,
            'referred_by' => $referredBy,
            'referral_coins' => $referredBy ? 50 : 0, // Reward new referee
            'reward_coins' => 0,
            'status' => 'active'
        ]);

        // If franchisee role, create empty Franchisee record
        if ($user->role === 'franchisee') {
            $user->franchisee()->create([
                'center_name' => $user->name . '\'s Car Wash',
                'address' => 'Pending Setup',
                'city' => 'Pending Setup',
                'royalty_percentage' => 10.0,
                'status' => 'pending'
            ]);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'status' => 'success',
            'message' => 'User registered successfully',
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => $user
        ], 201);
    }

    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|string|email',
            'password' => 'required|string',
        ]);

        if (!Auth::attempt($request->only('email', 'password'))) {
            return response()->json([
                'status' => 'error',
                'message' => 'Invalid login credentials'
            ], 401);
        }

        $user = User::where('email', $request->email)->firstOrFail();

        if ($user->status !== 'active') {
            Auth::logout();
            return response()->json([
                'status' => 'error',
                'message' => 'Your account is suspended'
            ], 403);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'status' => 'success',
            'message' => 'Logged in successfully',
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => $user
        ]);
    }

    public function me(Request $request)
    {
        $user = $request->user();
        if ($user->role === 'franchisee') {
            $user->load('franchisee');
        }
        return response()->json($user);
    }

    public function updateProfile(Request $request)
    {
        $user = $request->user();
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . $user->id,
            'phone' => 'nullable|string|max:20',
        ]);

        $user->update($request->only('name', 'email', 'phone'));

        if ($user->role === 'franchisee' && $request->has('center_name')) {
            $user->franchisee()->update($request->only('center_name', 'address', 'city'));
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Profile updated successfully',
            'user' => $user->fresh($user->role === 'franchisee' ? ['franchisee'] : [])
        ]);
    }

    public function changePassword(Request $request)
    {
        $user = $request->user();
        $request->validate([
            'current_password' => 'required|string',
            'password' => 'required|string|min:6|confirmed',
        ]);

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Current password does not match'
            ], 400);
        }

        $user->update([
            'password' => Hash::make($request->password)
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Password changed successfully'
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Logged out successfully'
        ]);
    }
}
