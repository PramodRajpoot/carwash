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
    return 'Cache cleared';
});

// Cashfree payment return — redirect back into SPA
Route::get('/cashfree/return', [\App\Http\Controllers\CashfreeController::class, 'handleReturn']);

// Direct franchise documents stream / download fallback
Route::get('/franchise_documents/{filename}', [\App\Http\Controllers\AdminController::class, 'serveFranchiseDocument']);

Route::get('/{any}', function () {
    return view('app');
})->where('any', '.*');
