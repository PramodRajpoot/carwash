<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use App\Models\WalletTransaction;
use App\Models\NotificationLog;
use App\Mail\WelcomeCustomerMail;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $request->validate([
            'name'             => 'required|string|min:2|max:255',
            'email'            => 'required|string|email|max:255|unique:users',
            'phone'            => 'required|numeric|regex:/^[0-9]{10}$/',
            'password'         => 'required|string|min:6|confirmed',
            'referred_by_code' => 'nullable|string',
            'role'             => 'nullable|string',
        ], [
            'name.required'     => 'Full name is required.',
            'name.min'          => 'Name must be at least 2 characters.',
            'email.required'    => 'Email address is required.',
            'email.email'       => 'Please enter a valid email address.',
            'email.unique'      => 'This email is already registered.',
            'phone.required'    => 'Mobile number is required.',
            'phone.regex'       => 'Please enter a valid 10-digit mobile number.',
            'password.required' => 'Password is required.',
            'password.min'      => 'Password must be at least 6 characters.',
            'password.confirmed' => 'Passwords do not match.',
        ]);

        $referredBy = null;
        $firstBookingDiscount = false;

        if ($request->filled('referred_by_code')) {
            $referredUser = User::where('referral_code', $request->referred_by_code)->first();
            if ($referredUser) {
                $referredBy = $referredUser->id;

                // Referrer gets 10 PENDING E-Points (confirmed after referred user's first booking)
                $referredUser->increment('pending_epoints', 10);
                WalletTransaction::create([
                    'user_id'     => $referredUser->id,
                    'type'        => 'credit',
                    'amount'      => 10,
                    'source'      => 'referral',
                    'status'      => 'pending',
                    'description' => "Pending reward for referring {$request->name}",
                ]);

                NotificationLog::create([
                    'user_id' => $referredUser->id,
                    'type'    => 'referral_reward',
                    'title'   => 'New Referral!',
                    'body'    => "{$request->name} registered using your referral code. You'll earn 10 E-Points once they complete their first booking.",
                ]);

                // New customer gets 10% discount on first booking
                $firstBookingDiscount = true;
            }
        }

        // Generate unique referral code
        $referralCode = strtoupper(Str::random(8));
        while (User::where('referral_code', $referralCode)->exists()) {
            $referralCode = strtoupper(Str::random(8));
        }

        $user = User::create([
            'name'                  => $request->name,
            'email'                 => $request->email,
            'phone'                 => $request->phone,
            'password'              => Hash::make($request->password),
            'role'                  => $request->role ?? 'customer',
            'referral_code'         => $referralCode,
            'referred_by'           => $referredBy,
            'referral_coins'        => 0,
            'reward_coins'          => 0,
            'e_points'              => 0,
            'pending_epoints'       => 0,
            'first_booking_discount' => $firstBookingDiscount,
            'status'                => 'active',
        ]);

        if ($user->role === 'franchisee') {
            $user->franchisee()->create([
                'center_name'        => $user->name . "'s Center",
                'address'            => 'Pending Setup',
                'city'               => 'Pending Setup',
                'royalty_percentage' => 10.0,
                'status'             => 'pending',
            ]);
        }

        // Dispatch welcome email via queue job (non-blocking)
        try {
           \App\Jobs\SendWelcomeEmailJob::dispatch($user);
        } catch (\Exception $e) {
            Log::warning('Welcome email dispatch failed for user #' . $user->id . ': ' . $e->getMessage());
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'status'       => 'success',
            'message'      => 'Registered successfully. Welcome to CleanAtDoorstep!',
            'access_token' => $token,
            'token_type'   => 'Bearer',
            'user'         => $user,
        ], 201);
    }

    public function login(Request $request)
    {
        $request->validate([
            'email'    => 'required|string|email',
            'password' => 'required|string',
        ]);

        if (!Auth::attempt($request->only('email', 'password'))) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Invalid login credentials',
            ], 401);
        }

        $user = User::where('email', $request->email)->firstOrFail();

        if ($user->status !== 'active') {
            Auth::logout();
            return response()->json([
                'status'  => 'error',
                'message' => 'Your account is suspended',
            ], 403);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'status'       => 'success',
            'message'      => 'Logged in successfully',
            'access_token' => $token,
            'token_type'   => 'Bearer',
            'user'         => $user,
        ]);
    }

    public function forgotPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email|exists:users,email',
        ], [
            'email.exists' => 'We could not find an account with that email address.',
        ]);

        $status = \Illuminate\Support\Facades\Password::broker()->sendResetLink(
            $request->only('email')
        );

        if ($status === \Illuminate\Support\Facades\Password::RESET_LINK_SENT) {
            return response()->json([
                'status'  => 'success',
                'message' => 'Password reset link sent to your email.',
            ]);
        }

        return response()->json([
            'status'  => 'error',
            'message' => __($status),
        ], 400);
    }

    public function resetPassword(Request $request)
    {
        $request->validate([
            'token'    => 'required',
            'email'    => 'required|email|exists:users,email',
            'password' => 'required|string|min:6|confirmed',
        ], [
            'email.exists' => 'We could not find an account with that email address.',
            'password.confirmed' => 'The password confirmation does not match.',
            'password.min' => 'The password must be at least 6 characters.',
        ]);

        $status = \Illuminate\Support\Facades\Password::broker()->reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function ($user, $password) {
                $user->password = Hash::make($password);
                $user->save();
            }
        );

        if ($status === \Illuminate\Support\Facades\Password::PASSWORD_RESET) {
            return response()->json([
                'status'  => 'success',
                'message' => 'Password has been successfully reset.',
            ]);
        }

        return response()->json([
            'status'  => 'error',
            'message' => __($status),
        ], 400);
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
            'name'  => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . $user->id,
            'phone' => 'nullable|string|max:20',
        ]);

        $user->update($request->only('name', 'email', 'phone'));

        if ($user->role === 'franchisee' && $request->has('center_name')) {
            $user->franchisee()->update($request->only('center_name', 'address', 'city'));
        }

        return response()->json([
            'status'  => 'success',
            'message' => 'Profile updated successfully',
            'user'    => $user->fresh($user->role === 'franchisee' ? ['franchisee'] : []),
        ]);
    }

    public function changePassword(Request $request)
    {
        $user = $request->user();
        $request->validate([
            'current_password' => 'required|string',
            'password'         => 'required|string|min:6|confirmed',
        ]);

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Current password does not match',
            ], 400);
        }

        $user->update(['password' => Hash::make($request->password)]);

        return response()->json([
            'status'  => 'success',
            'message' => 'Password changed successfully',
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'status'  => 'success',
            'message' => 'Logged out successfully',
        ]);
    }

    public function uploadAvatar(Request $request)
    {
        $request->validate([
            'avatar' => 'required|image|mimes:jpeg,png,jpg,webp|max:2048',
        ], [
            'avatar.required' => 'Please select an image.',
            'avatar.image'    => 'The file must be an image.',
            'avatar.mimes'    => 'Only JPEG, PNG, JPG, and WebP formats are allowed.',
            'avatar.max'      => 'Image size must not exceed 2MB.',
        ]);

        $user = $request->user();

        // Delete old avatar if exists
        if ($user->avatar) {
            $oldPath = public_path($user->avatar);
            if (file_exists($oldPath)) {
                unlink($oldPath);
            }
        }

        $file = $request->file('avatar');
        $filename = 'avatar_' . $user->id . '_' . time() . '.' . $file->getClientOriginalExtension();
        $file->move(public_path('avatars'), $filename);

        $user->update(['avatar' => 'avatars/' . $filename]);

        return response()->json([
            'status'  => 'success',
            'message' => 'Profile photo updated successfully',
            'avatar'  => 'avatars/' . $filename,
            'user'    => $user->fresh(),
        ]);
    }
}
