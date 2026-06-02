<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\FranchiseeController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\BookingController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// 1. Public & Auth Routes
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);
Route::get('/packages', [BookingController::class, 'getPackages']);
Route::get('/centers', [BookingController::class, 'getCenters']);

// 2. Protected Routes (Sanctum)
Route::middleware('auth:sanctum')->group(function () {
    // Auth actions
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::put('/auth/profile', [AuthController::class, 'updateProfile']);
    Route::put('/auth/password', [AuthController::class, 'changePassword']);

    // Booking actions
    Route::get('/bookings/slots', [BookingController::class, 'checkSlotAvailability']);
    Route::post('/bookings/apply-coupon', [BookingController::class, 'applyCoupon']);
    Route::post('/bookings', [BookingController::class, 'createBooking']);
    Route::post('/bookings/{id}/cancel', [BookingController::class, 'cancelBooking']);
    Route::post('/bookings/{id}/postpone', [BookingController::class, 'postponeBooking']);

    // 3. Customer Dashboard endpoints
    Route::get('/customer/dashboard', [CustomerController::class, 'dashboard']);
    Route::get('/customer/vehicles', [CustomerController::class, 'getVehicles']);
    Route::post('/customer/vehicles', [CustomerController::class, 'addVehicle']);
    Route::delete('/customer/vehicles/{id}', [CustomerController::class, 'deleteVehicle']);
    Route::get('/customer/subscriptions', [CustomerController::class, 'getSubscriptions']);
    Route::post('/customer/subscriptions', [CustomerController::class, 'buySubscription']);
    Route::get('/customer/wishlist', [CustomerController::class, 'getWishlist']);
    Route::post('/customer/wishlist', [CustomerController::class, 'addToWishlist']);
    Route::delete('/customer/wishlist/{id}', [CustomerController::class, 'removeFromWishlist']);
    Route::get('/customer/referrals', [CustomerController::class, 'getReferrals']);

    // 4. Franchisee Panel endpoints
    Route::get('/franchisee/dashboard', [FranchiseeController::class, 'dashboard']);
    Route::get('/franchisee/orders', [FranchiseeController::class, 'getOrders']);
    Route::put('/franchisee/orders/{id}/status', [FranchiseeController::class, 'updateBookingStatus']);
    Route::get('/franchisee/expenses', [FranchiseeController::class, 'getExpenses']);
    Route::post('/franchisee/expenses', [FranchiseeController::class, 'addExpense']);
    Route::delete('/franchisee/expenses/{id}', [FranchiseeController::class, 'deleteExpense']);
    Route::get('/franchisee/reports', [FranchiseeController::class, 'getReports']);

    // 5. Admin / Super Admin Panel endpoints
    Route::get('/admin/dashboard', [AdminController::class, 'dashboard']);
    Route::get('/admin/users', [AdminController::class, 'getUsers']);
    Route::post('/admin/users', [AdminController::class, 'createUser']);
    Route::put('/admin/users/{id}', [AdminController::class, 'updateUser']);
    Route::delete('/admin/users/{id}', [AdminController::class, 'deleteUser']);
    Route::post('/admin/users/{id}/reset-password', [AdminController::class, 'resetUserPassword']);
    Route::get('/admin/orders', [AdminController::class, 'getOrders']);
    Route::put('/admin/orders/{id}', [AdminController::class, 'modifyOrder']);
    Route::get('/admin/slots', [AdminController::class, 'getSlots']);
    Route::post('/admin/slots', [AdminController::class, 'saveSlotConfig']);
    Route::get('/admin/coupons', [AdminController::class, 'getCoupons']);
    Route::post('/admin/coupons', [AdminController::class, 'createCoupon']);
    Route::delete('/admin/coupons/{id}', [AdminController::class, 'deleteCoupon']);
    Route::get('/admin/reports', [AdminController::class, 'getReports']);
});
