<?php

use Illuminate\Support\Facades\Route;

// Legacy settings URLs — redirect to the correct account page based on role
Route::middleware(['auth'])->group(function () {
    $redirect = function () {
        return match (auth()->user()->role) {
            'admin' => redirect('/admin/account'),
            'collector' => redirect('/collector/account'),
            default => redirect('/resident/account'),
        };
    };

    Route::get('settings', $redirect);
    Route::get('settings/profile', $redirect);
    Route::get('settings/password', $redirect);
    Route::get('settings/appearance', $redirect);
});
