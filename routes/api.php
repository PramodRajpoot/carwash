<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\OtpController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\FranchiseeController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\SuperAdminController;
use App\Http\Controllers\BookingController;
use App\Http\Controllers\WalletController;
use App\Http\Controllers\SupportTicketController;
use App\Http\Controllers\FeedbackController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\BlogController;
use App\Http\Controllers\PartnerController;
use App\Http\Controllers\SuperAdminSlotController;
use App\Http\Controllers\BannerController;

/*
|--------------------------------------------------------------------------
| API Routes — CleanAtDoorstep Platform
|--------------------------------------------------------------------------
*/

// ── Public & Auth ────────────────────────────────────────────────────────

Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login',    [AuthController::class, 'login']);
Route::post('/auth/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/auth/reset-password',  [AuthController::class, 'resetPassword']);

// OTP Authentication (alternative login)
Route::post('/auth/otp/send',   [OtpController::class, 'send']);
Route::post('/auth/otp/verify', [OtpController::class, 'verify']);

// Google OAuth
Route::get('/auth/google', [App\Http\Controllers\GoogleAuthController::class, 'redirect']);
Route::get('/auth/google/callback', [App\Http\Controllers\GoogleAuthController::class, 'callback']);

// Public service data
Route::get('/packages', [BookingController::class, 'getPackages']);
Route::get('/centers',  [BookingController::class, 'getCenters']);
Route::get('/offers',   [BookingController::class, 'getOffers']);
Route::get('/banners',  [BannerController::class, 'index']);

// Public blog
Route::get('/blog',       [BlogController::class, 'index']);

// Public: Become Partner inquiry
Route::post('/partner/apply', [PartnerController::class, 'store']);
Route::get('/blog/{slug}', [BlogController::class, 'show']);

// ── Protected Routes (Sanctum) ───────────────────────────────────────────

Route::middleware('auth:sanctum')->group(function () {

    // Auth actions
    Route::post('/auth/logout',      [AuthController::class, 'logout']);
    Route::get('/auth/me',           [AuthController::class, 'me']);
    Route::put('/auth/profile',      [AuthController::class, 'updateProfile']);
    Route::put('/auth/password',     [AuthController::class, 'changePassword']);
    Route::post('/auth/avatar',      [AuthController::class, 'uploadAvatar']);

    // Booking actions
    Route::get('/bookings/slots',         [BookingController::class, 'checkSlotAvailability']);
    Route::post('/bookings/apply-coupon', [BookingController::class, 'applyCoupon']);
    Route::post('/bookings',              [BookingController::class, 'createBooking']);
    Route::post('/bookings/{id}/cancel',  [BookingController::class, 'cancelBooking']);
    Route::post('/bookings/{id}/postpone',[BookingController::class, 'postponeBooking']);

    // Feedback / Reviews
    Route::post('/feedback',                      [FeedbackController::class, 'store']);
    Route::get('/feedback/booking/{bookingId}',   [FeedbackController::class, 'show']);

    // Notifications
    Route::get('/notifications',               [NotificationController::class, 'index']);
    Route::post('/notifications/{id}/read',    [NotificationController::class, 'markRead']);
    Route::post('/notifications/read-all',     [NotificationController::class, 'markAllRead']);

    // ── Customer Panel ───────────────────────────────────────────────────

    Route::prefix('customer')->group(function () {
        Route::get('/dashboard',              [CustomerController::class, 'dashboard']);
        Route::get('/vehicles',               [CustomerController::class, 'getVehicles']);
        Route::post('/vehicles',              [CustomerController::class, 'addVehicle']);
        Route::delete('/vehicles/{id}',       [CustomerController::class, 'deleteVehicle']);
        Route::get('/subscriptions',          [CustomerController::class, 'getSubscriptions']);
        Route::post('/subscriptions',         [CustomerController::class, 'buySubscription']);
        Route::get('/wishlist',               [CustomerController::class, 'getWishlist']);
        Route::post('/wishlist',              [CustomerController::class, 'addToWishlist']);
        Route::delete('/wishlist/{id}',       [CustomerController::class, 'removeFromWishlist']);
        Route::get('/referrals',              [CustomerController::class, 'getReferrals']);
    });

    // Customer Wallet
    Route::prefix('wallet')->group(function () {
        Route::get('/balance',   [WalletController::class, 'balance']);
        Route::get('/history',   [WalletController::class, 'history']);
        Route::post('/redeem',   [WalletController::class, 'redeem']);
    });

    // Customer Support Tickets
    Route::prefix('support')->group(function () {
        Route::get('/tickets',       [SupportTicketController::class, 'index']);
        Route::post('/tickets',      [SupportTicketController::class, 'store']);
        Route::get('/tickets/{id}',  [SupportTicketController::class, 'show']);
    });

    // ── Franchisee Panel ─────────────────────────────────────────────────

    Route::prefix('franchisee')->group(function () {
        Route::get('/dashboard',                        [FranchiseeController::class, 'dashboard']);
        Route::get('/orders',                           [FranchiseeController::class, 'getOrders']);
        Route::put('/orders/{id}/status',               [FranchiseeController::class, 'updateBookingStatus']);
        Route::post('/orders/{id}/reschedule',          [FranchiseeController::class, 'rescheduleService']);
        Route::put('/slots/{id}/toggle',                [FranchiseeController::class, 'toggleSlotStatus']);
        Route::get('/expenses',                         [FranchiseeController::class, 'getExpenses']);
        Route::post('/expenses',                        [FranchiseeController::class, 'addExpense']);
        Route::delete('/expenses/{id}',                 [FranchiseeController::class, 'deleteExpense']);
        Route::get('/reports',                          [FranchiseeController::class, 'getReports']);
        Route::get('/royalty',                          [FranchiseeController::class, 'getRoyalty']);
        Route::get('/subscriptions',                    [FranchiseeController::class, 'getSubscriptions']);
        Route::get('/offers',                           [FranchiseeController::class, 'getOffers']);
    });

    // ── Admin Panel ──────────────────────────────────────────────────────

    Route::prefix('admin')->group(function () {
        // Dashboard
        Route::get('/dashboard', [AdminController::class, 'dashboard']);

        // Users
        Route::get('/users',                        [AdminController::class, 'getUsers']);
        Route::post('/users',                       [AdminController::class, 'createUser']);
        Route::put('/users/{id}',                   [AdminController::class, 'updateUser']);
        Route::delete('/users/{id}',                [AdminController::class, 'deleteUser']);
        Route::post('/users/{id}/reset-password',   [AdminController::class, 'resetUserPassword']);

        // Orders
        Route::get('/orders',          [AdminController::class, 'getOrders']);
        Route::put('/orders/{id}',     [AdminController::class, 'modifyOrder']);

        // Slots
        Route::get('/slots',   [AdminController::class, 'getSlots']);
        Route::post('/slots',  [AdminController::class, 'saveSlotConfig']);
        Route::put('/slots/{id}', [AdminController::class, 'updateSlot']);

        // Coupons
        Route::get('/coupons',          [AdminController::class, 'getCoupons']);
        Route::post('/coupons',         [AdminController::class, 'createCoupon']);
        Route::delete('/coupons/{id}',  [AdminController::class, 'deleteCoupon']);

        // Reports
        Route::get('/reports', [AdminController::class, 'getReports']);

        // Franchise Management
        Route::get('/franchisees',                  [AdminController::class, 'getFranchisees']);
        Route::put('/franchisees/{id}/status',      [AdminController::class, 'updateFranchiseeStatus']);
        Route::get('/franchisees/{id}/slots',       [SuperAdminSlotController::class, 'getAssignedSlots']);
        Route::post('/franchisees/{id}/slots',      [SuperAdminSlotController::class, 'assignSlots']);

        // Master Slots (Read Only for Admin)
        Route::get('/master-slots', [SuperAdminSlotController::class, 'getMasterSlots']);

        // Package Plans CRUD
        Route::get('/packages',             [AdminController::class, 'getPackages']);
        Route::post('/packages',            [AdminController::class, 'createPackage']);
        Route::put('/packages/{id}',        [AdminController::class, 'updatePackage']);
        Route::delete('/packages/{id}',     [AdminController::class, 'deletePackage']);

        // Referral Network
        Route::get('/referrals', [AdminController::class, 'getReferrals']);

        // Support Tickets
        Route::get('/tickets',          [AdminController::class, 'getTickets']);
        Route::put('/tickets/{id}',     [AdminController::class, 'updateTicket']);

        // Blog
        Route::get('/blog',             [BlogController::class, 'adminIndex']);
        Route::post('/blog',            [BlogController::class, 'store']);
        Route::put('/blog/{id}',        [BlogController::class, 'update']);
        Route::delete('/blog/{id}',     [BlogController::class, 'destroy']);

        // Feedback Reviews
        Route::get('/feedback',         [FeedbackController::class, 'adminIndex']);

        // Partner Inquiries
        Route::get('/partners',             [PartnerController::class, 'adminIndex']);
        Route::put('/partners/{id}',        [PartnerController::class, 'adminUpdate']);
        Route::delete('/partners/{id}',     [PartnerController::class, 'adminDestroy']);
    });

    // ── Super Admin Panel ────────────────────────────────────────────────

    Route::prefix('super-admin')->group(function () {
        Route::get('/dashboard',     [SuperAdminController::class, 'dashboard']);

        // Admin Management
        Route::get('/admins',              [SuperAdminController::class, 'getAdmins']);
        Route::post('/admins',             [SuperAdminController::class, 'createAdmin']);
        Route::put('/admins/{id}',         [SuperAdminController::class, 'updateAdmin']);
        Route::delete('/admins/{id}',      [SuperAdminController::class, 'deleteAdmin']);

        // Platform Settings
        Route::get('/settings',     [SuperAdminController::class, 'getSettings']);
        Route::post('/settings',    [SuperAdminController::class, 'updateSettings']);

        // Full Data Access
        Route::get('/users',        [SuperAdminController::class, 'getAllUsers']);
        Route::get('/orders',       [SuperAdminController::class, 'getAllOrders']);
        Route::get('/wallet',       [SuperAdminController::class, 'getAllWalletTransactions']);

        // Master Slots Management
        Route::post('/master-slots', [SuperAdminSlotController::class, 'createMasterSlot']);
        Route::put('/master-slots/{id}', [SuperAdminSlotController::class, 'updateMasterSlot']);
        Route::delete('/master-slots/{id}', [SuperAdminSlotController::class, 'deleteMasterSlot']);

        // Banner Management
        Route::get('/banners', [BannerController::class, 'adminIndex']);
        Route::post('/banners', [BannerController::class, 'store']);
        Route::put('/banners/{id}', [BannerController::class, 'update']);
        Route::delete('/banners/{id}', [BannerController::class, 'destroy']);
    });
});
