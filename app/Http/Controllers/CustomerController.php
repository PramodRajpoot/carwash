<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Vehicle;
use App\Models\ServicePackage;
use App\Models\Subscription;
use App\Models\Booking;
use App\Models\Wishlist;
use App\Models\User;
use Carbon\Carbon;

class CustomerController extends Controller
{
    public function dashboard(Request $request)
    {
        $user = $request->user();

        $activeSubscription = Subscription::where('customer_id', $user->id)
            ->where('status', 'active')
            ->with('package')
            ->first();

        $bookingCount = Booking::where('customer_id', $user->id)
            ->where('status', 'completed')
            ->count();

        $upcomingServices = Booking::where('customer_id', $user->id)
            ->whereIn('status', ['pending', 'assigned', 'ongoing'])
            ->with(['vehicle', 'franchisee'])
            ->orderBy('booking_date', 'asc')
            ->get();

        $wishlistCount = Wishlist::where('customer_id', $user->id)->count();

        return response()->json([
            'subscription' => $activeSubscription,
            'booking_count' => $bookingCount,
            'upcoming_services' => $upcomingServices,
            'wishlist_count' => $wishlistCount,
            'referral_coins' => $user->referral_coins,
            'reward_coins' => $user->reward_coins,
            'referral_code' => $user->referral_code,
        ]);
    }

    public function getVehicles(Request $request)
    {
        $vehicles = Vehicle::where('customer_id', $request->user()->id)->get();
        return response()->json($vehicles);
    }

    public function addVehicle(Request $request)
    {
        $request->validate([
            'vehicle_type' => 'required|string|in:hatchback,sedan,suv,commercial,bus,volvo_bus',
            'make_model' => 'required|string|max:255',
            'plate_number' => 'required|string|max:50',
        ]);

        $vehicle = Vehicle::create([
            'customer_id' => $request->user()->id,
            'vehicle_type' => $request->vehicle_type,
            'make_model' => $request->make_model,
            'plate_number' => $request->plate_number,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Vehicle added successfully',
            'vehicle' => $vehicle
        ], 201);
    }

    public function deleteVehicle(Request $request, $id)
    {
        $vehicle = Vehicle::where('customer_id', $request->user()->id)->findOrFail($id);
        $vehicle->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Vehicle removed successfully'
        ]);
    }

    public function getSubscriptions(Request $request)
    {
        $subscriptions = Subscription::where('customer_id', $request->user()->id)
            ->with('package')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($subscriptions);
    }

    public function buySubscription(Request $request)
    {
        $request->validate([
            'package_id' => 'required|exists:service_packages,id'
        ]);

        $package = ServicePackage::findOrFail($request->package_id);
        $user = $request->user();

        // Expire any existing active subscription for this user
        Subscription::where('customer_id', $user->id)
            ->where('status', 'active')
            ->update(['status' => 'expired']);

        $subscription = Subscription::create([
            'customer_id' => $user->id,
            'package_id' => $package->id,
            'status' => 'active',
            'booking_count' => 0,
            'starts_at' => Carbon::now(),
            'expires_at' => Carbon::now()->addDays($package->frequency_days),
        ]);

        // Reward customer with coins for buying subscription
        $user->increment('reward_coins', 100);

        return response()->json([
            'status' => 'success',
            'message' => 'Subscribed successfully. You earned 100 Reward Coins!',
            'subscription' => $subscription
        ]);
    }

    public function getWishlist(Request $request)
    {
        $wishlist = Wishlist::where('customer_id', $request->user()->id)
            ->with('package')
            ->get();

        return response()->json($wishlist);
    }

    public function addToWishlist(Request $request)
    {
        $request->validate([
            'package_id' => 'required|exists:service_packages,id'
        ]);

        $wish = Wishlist::firstOrCreate([
            'customer_id' => $request->user()->id,
            'package_id' => $request->package_id
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Service added to wishlist',
            'wishlist' => $wish
        ]);
    }

    public function removeFromWishlist(Request $request, $id)
    {
        // Find by ID or package ID
        $wish = Wishlist::where('customer_id', $request->user()->id)
            ->where(function($query) use ($id) {
                $query->where('id', $id)->orWhere('package_id', $id);
            })->firstOrFail();

        $wish->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Removed from wishlist'
        ]);
    }

    public function getReferrals(Request $request)
    {
        $user = $request->user();
        $referredUsers = User::where('referred_by', $user->id)
            ->select('id', 'name', 'email', 'created_at')
            ->get();

        return response()->json([
            'referral_code' => $user->referral_code,
            'referral_coins' => $user->referral_coins,
            'reward_coins' => $user->reward_coins,
            'referred_users' => $referredUsers
        ]);
    }
}
