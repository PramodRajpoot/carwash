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

Route::get('/{any}', function () {
    return view('app');
})->where('any', '.*');
