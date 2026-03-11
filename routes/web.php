<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;
use App\Http\Controllers\GeocodeController;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

Route::middleware(['auth'])->get('/reverse-geocode', [GeocodeController::class, 'reverse'])
    ->name('reverse-geocode');

Route::middleware(['auth'])->get('/dashboard', function () {
    return match (auth()->user()->role) {
        'admin' => redirect()->route('admin.dashboard'),
        'collector' => redirect()->route('collector.dashboard'),
        default => redirect()->route('resident.dashboard'),
    };
})->name('dashboard');

Route::middleware(['auth'])->prefix('c')->name('admin.')->group(function () {
    Route::get('/dashboard', fn () => Inertia::render('admin/dashboard'))->name('dashboard');
});

Route::middleware(['auth', 'role:collector'])->prefix('collector')->name('collector.')->group(function () {
    Route::get('/dashboard', fn () => Inertia::render('collector/dashboard'))->name('dashboard');
});

Route::middleware(['auth', 'role:resident'])->prefix('resident')->name('resident.')->group(function () {
    Route::get('/dashboard', fn () => Inertia::render('resident/dashboard'))->name('dashboard');
    Route::get('/location/setup', [\App\Http\Controllers\Resident\LocationController::class, 'create'])->name('location.create');
    Route::post('/location/setup', [\App\Http\Controllers\Resident\LocationController::class, 'store'])->name('location.store');
});
require __DIR__.'/settings.php';
