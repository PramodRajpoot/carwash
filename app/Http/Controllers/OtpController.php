<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use App\Models\User;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Mail;
use App\Mail\OtpMail;

class OtpController extends Controller
{
    // Send OTP to phone or email
    public function send(Request $request)
    {
        $request->validate([
            'identifier' => 'required|string',
        ], [
            'identifier.required' => 'Mobile number or email is required.',
        ]);

        $identifier = $request->identifier;
        $isEmail = filter_var($identifier, FILTER_VALIDATE_EMAIL);
        $user = null;

        if ($isEmail) {
            $user = User::where('email', $identifier)->first();
            if (!$user) {
                return response()->json([
                    'errors' => [
                        'identifier' => ['Email is not registered.']
                    ]
                ], 422);
            }
        } else {
            if (!preg_match('/^[0-9]{10}$/', $identifier)) {
                return response()->json([
                    'errors' => [
                        'identifier' => ['Please enter a valid email or 10-digit mobile number.']
                    ]
                ], 422);
            }
            $user = User::where('phone', $identifier)->first();
            if (!$user) {
                return response()->json([
                    'errors' => [
                        'identifier' => ['Mobile number is not registered.']
                    ]
                ], 422);
            }
        }

        $otp = str_pad(rand(1000, 9999), 4, '0', STR_PAD_LEFT);

        // Store OTP in cache for 10 minutes
        Cache::put("otp_{$identifier}", $otp, now()->addMinutes(10));

        if ($isEmail) {
            Mail::to($identifier)->send(new OtpMail($user, $otp));
        } else {
            // In production: send via SMS API (Twilio, MSG91, etc.)
            // For dev: log to Laravel log
            \Log::info("OTP for {$identifier}: {$otp}");
        }

        return response()->json([
            'status'  => 'success',
            'message' => 'OTP sent successfully.',
        ]);
    }

    // Verify OTP and return token
    public function verify(Request $request)
    {
        $request->validate([
            'identifier' => 'required|string',
            'otp'        => 'required|string|size:4',
        ], [
            'identifier.required' => 'Mobile number or email is required.',
            'otp.required'        => 'OTP is required.',
            'otp.size'            => 'OTP must be exactly 4 digits.',
        ]);

        $identifier = $request->identifier;
        $storedOtp = Cache::get("otp_{$identifier}");

        if (!$storedOtp || $storedOtp !== $request->otp) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Invalid or expired OTP.',
            ], 401);
        }

        Cache::forget("otp_{$identifier}");

        $isEmail = filter_var($identifier, FILTER_VALIDATE_EMAIL);
        if ($isEmail) {
            $user = User::where('email', $identifier)->first();
        } else {
            $user = User::where('phone', $identifier)->first();
        }

        if (!$user) {
            return response()->json([
                'status'  => 'error',
                'message' => 'User not found.',
            ], 404);
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
