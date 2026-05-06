<?php

use App\Http\Controllers\Settings\PasswordController;
use App\Http\Controllers\Settings\ProfileController;
use Illuminate\Support\Facades\Route;

// Redirect settings pages to account page
Route::middleware(['auth'])->group(function () {
    Route::redirect('settings', '/resident/account');
    Route::redirect('settings/profile', '/resident/account');
    Route::redirect('settings/password', '/resident/account');
    Route::redirect('settings/appearance', '/resident/account');

    // Keep action routes (POST/PUT/DELETE) — used by account page forms
    Route::post('settings/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('settings/profile/avatar', [ProfileController::class, 'removeAvatar'])->name('profile.avatar.remove');
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::put('settings/password', [PasswordController::class, 'update'])
        ->middleware('throttle:6,1')
        ->name('user-password.update');
});
