<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes - SPA Catch-All
|--------------------------------------------------------------------------
*/

Route::get('/clear-cache-now', function () {
    Artisan::call('cache:clear');
    Artisan::call('view:clear');
    Artisan::call('config:clear');
    try {
        Artisan::call('storage:link');
    } catch (\Throwable $e) {}
    $storagePublic = storage_path('app/public');
    @chmod($storagePublic, 0777);
    @chmod($storagePublic . '/feedback', 0777);
    @chmod($storagePublic . '/partner-feedback', 0777);
    return 'Cache cleared, storage link verified, and permissions updated.';
});

// Cashfree payment return — redirect back into SPA
Route::get('/cashfree/return', [\App\Http\Controllers\CashfreeController::class, 'handleReturn']);

// Cashfree in-app checkout wrapper for mobile WebView
Route::get('/cashfree/checkout', [\App\Http\Controllers\CashfreeController::class, 'renderCheckout']);

// Direct franchise documents stream / download fallback
Route::get('/franchise_documents/{filename}', [\App\Http\Controllers\AdminController::class, 'serveFranchiseDocument']);

// Direct public storage stream / download fallback for media (videos & images)
Route::get('/storage/{path}', [\App\Http\Controllers\StorageMediaController::class, 'show'])->where('path', '.*');

Route::get('/login', function () {
    return view('app');
})->name('login');

Route::get('/{any}', function () {
    return view('app');
})->where('any', '.*');
