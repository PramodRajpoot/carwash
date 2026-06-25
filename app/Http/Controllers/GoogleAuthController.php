<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Laravel\Socialite\Facades\Socialite;
use App\Models\User;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Auth;

class GoogleAuthController extends Controller
{
    /**
     * Redirect the user to the Google authentication page.
     */
    public function redirect()
    {
        return Socialite::driver('google')->stateless()->redirect();
    }

    /**
     * Obtain the user information from Google.
     */
    public function callback()
    {
        try {
            $googleUser = Socialite::driver('google')->stateless()->user();
            
            // Check if user exists by google_id or email
            $user = User::where('google_id', $googleUser->getId())
                        ->orWhere('email', $googleUser->getEmail())
                        ->first();

            if (!$user) {
                // Register a new user
                $referralCode = strtoupper(Str::random(8));
                while (User::where('referral_code', $referralCode)->exists()) {
                    $referralCode = strtoupper(Str::random(8));
                }

                $user = User::create([
                    'name'          => $googleUser->getName() ?? 'Google User',
                    'email'         => $googleUser->getEmail(),
                    'google_id'     => $googleUser->getId(),
                    'password'      => bcrypt(Str::random(24)),
                    'role'          => 'customer',
                    'referral_code' => $referralCode,
                    'status'        => 'active',
                    'e_points'      => 0,
                    'pending_epoints' => 0,
                    'avatar'        => $googleUser->getAvatar(),
                ]);
            } else {
                // If user exists but google_id is not set, update it
                if (!$user->google_id) {
                    $user->update(['google_id' => $googleUser->getId()]);
                }
            }

            if ($user->status !== 'active') {
                return redirect(config('app.url') . '/login?error=' . urlencode('Your account is suspended.'));
            }

            // Create Sanctum Token
            $token = $user->createToken('google_token')->plainTextToken;
            
            // Redirect to frontend with token
            return redirect(config('app.url') . '/oauth/callback?token=' . $token . '&user=' . urlencode(json_encode($user)));

        } catch (\Exception $e) {
            \Log::error('Google OAuth Error: ' . $e->getMessage());
            return redirect(config('app.url') . '/login?error=' . urlencode('Failed to authenticate with Google.'));
        }
    }
}
