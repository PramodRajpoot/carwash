<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use App\Models\User;
use Illuminate\Support\Str;

class OtpController extends Controller
{
    // Send OTP to phone
    public function send(Request $request)
    {
        $request->validate([
            'phone' => 'required|numeric|regex:/^[0-9]{10}$/',
        ], [
            'phone.required' => 'Mobile number is required.',
            'phone.numeric'  => 'Mobile number must contain only digits.',
            'phone.regex'    => 'Please enter a valid 10-digit mobile number.',
        ]);

        $phone = $request->phone;
        $otp = str_pad(rand(1000, 9999), 4, '0', STR_PAD_LEFT);

        // Store OTP in cache for 10 minutes
        Cache::put("otp_{$phone}", $otp, now()->addMinutes(10));

        // In production: send via SMS API (Twilio, MSG91, etc.)
        // For dev: log to Laravel log
        \Log::info("OTP for {$phone}: {$otp}");

        return response()->json([
            'status'  => 'success',
            'message' => 'OTP sent successfully.',
            // Only expose OTP in local/dev environment for testing
            'otp'     => app()->environment('local') ? $otp : null,
        ]);
    }

    // Verify OTP and return token
    public function verify(Request $request)
    {
        $request->validate([
            'phone' => 'required|numeric|regex:/^[0-9]{10}$/',
            'otp'   => 'required|string|size:4',
        ], [
            'phone.required' => 'Mobile number is required.',
            'phone.numeric'  => 'Mobile number must contain only digits.',
            'phone.regex'    => 'Please enter a valid 10-digit mobile number.',
            'otp.required'   => 'OTP is required.',
            'otp.size'       => 'OTP must be exactly 4 digits.',
        ]);

        $phone = $request->phone;
        $storedOtp = Cache::get("otp_{$phone}");

        if (!$storedOtp || $storedOtp !== $request->otp) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Invalid or expired OTP.',
            ], 401);
        }

        Cache::forget("otp_{$phone}");

        // Find or auto-create user by phone
        $user = User::where('phone', $phone)->first();

        if (!$user) {
            // Auto-register with phone as identifier
            $referralCode = strtoupper(Str::random(8));
            while (User::where('referral_code', $referralCode)->exists()) {
                $referralCode = strtoupper(Str::random(8));
            }

            $user = User::create([
                'name'          => 'Customer ' . substr($phone, -4),
                'email'         => $phone . '@otp.cleanatdoorstep.in',
                'phone'         => $phone,
                'password'      => bcrypt(Str::random(16)),
                'role'          => 'customer',
                'referral_code' => $referralCode,
                'status'        => 'active',
                'e_points'      => 0,
                'pending_epoints' => 0,
            ]);
        }

        if ($user->status !== 'active') {
            return response()->json([
                'status'  => 'error',
                'message' => 'Your account is suspended.',
            ], 403);
        }

        $token = $user->createToken('otp_token')->plainTextToken;

        return response()->json([
            'status'       => 'success',
            'message'      => 'OTP verified. Logged in.',
            'access_token' => $token,
            'token_type'   => 'Bearer',
            'user'         => $user,
        ]);
    }
}
