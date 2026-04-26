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

Route::middleware(['auth'])->get('/tuy-boundary', \App\Http\Controllers\TuyBoundaryController::class)
    ->name('tuy-boundary');

Route::middleware(['auth'])->get('/dashboard', function () {
    return match (auth()->user()->role) {
        'admin' => redirect()->route('admin.dashboard'),
        'collector' => redirect()->route('collector.dashboard'),
        default => redirect()->route('resident.dashboard'),
    };
})->name('dashboard');

Route::middleware(['auth'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/dashboard', [\App\Http\Controllers\Admin\AdminListController::class, 'dashboard'])->name('dashboard');

    Route::get('/routes', [\App\Http\Controllers\Admin\RoutePlanController::class, 'index'])->name('routes.index');
    Route::get('/routes/create', [\App\Http\Controllers\Admin\RoutePlanController::class, 'create'])->name('routes.create');
    Route::post('/routes', [\App\Http\Controllers\Admin\RoutePlanController::class, 'store'])->name('routes.store');
    Route::get('/routes/{route}', [\App\Http\Controllers\Admin\RoutePlanController::class, 'show'])->name('routes.show');
    Route::get('/zones/{zone}/households', [\App\Http\Controllers\Admin\RoutePlanController::class, 'households'])->name('zones.households');

    Route::get('/barangays', [\App\Http\Controllers\Admin\AdminListController::class, 'barangays'])->name('barangays.index');
    Route::get('/barangays/{barangay}/boundary', [\App\Http\Controllers\Admin\AdminListController::class, 'barangayBoundary'])->name('barangays.boundary');
    Route::get('/zones', [\App\Http\Controllers\Admin\AdminListController::class, 'zones'])->name('zones.index');
    Route::post('/zones', [\App\Http\Controllers\Admin\AdminListController::class, 'storeZone'])->name('zones.store');
    Route::put('/zones/{zone}', [\App\Http\Controllers\Admin\AdminListController::class, 'updateZone'])->name('zones.update');
    Route::delete('/zones/{zone}', [\App\Http\Controllers\Admin\AdminListController::class, 'destroyZone'])->name('zones.destroy');
    Route::get('/residents', [\App\Http\Controllers\Admin\AdminListController::class, 'residents'])->name('residents.index');
    Route::post('/residents', [\App\Http\Controllers\Admin\AdminListController::class, 'storeResident'])->name('residents.store');
    Route::put('/residents/{user}', [\App\Http\Controllers\Admin\AdminListController::class, 'updateResident'])->name('residents.update');
    Route::delete('/residents/{user}', [\App\Http\Controllers\Admin\AdminListController::class, 'destroyResident'])->name('residents.destroy');

    Route::get('/collectors', [\App\Http\Controllers\Admin\AdminListController::class, 'collectors'])->name('collectors.index');
    Route::post('/collectors', [\App\Http\Controllers\Admin\AdminListController::class, 'storeCollector'])->name('collectors.store');
    Route::put('/collectors/{user}', [\App\Http\Controllers\Admin\AdminListController::class, 'updateCollector'])->name('collectors.update');
    Route::delete('/collectors/{user}', [\App\Http\Controllers\Admin\AdminListController::class, 'destroyCollector'])->name('collectors.destroy');

    Route::get('/schedules', [\App\Http\Controllers\Admin\ScheduleController::class, 'index'])->name('schedules.index');

    Route::get('/collection-reports', [\App\Http\Controllers\Admin\AdminListController::class, 'collectionReports'])->name('collection-reports.index');
    Route::get('/reports', [\App\Http\Controllers\Admin\AdminListController::class, 'reports'])->name('reports.index');
});

Route::middleware(['auth', 'role:collector'])->prefix('collector')->name('collector.')->group(function () {
    Route::get('/dashboard', \App\Http\Controllers\Collector\CollectorDashboardController::class)->name('dashboard');

    Route::get('/routes', [\App\Http\Controllers\Collector\CollectorRouteController::class, 'index'])->name('routes.index');
    Route::get('/routes/{route}', [\App\Http\Controllers\Collector\RouteTrackingController::class, 'show'])->name('routes.show');
    Route::post('/routes/{route}/start', [\App\Http\Controllers\Collector\RouteTrackingController::class, 'start'])->name('routes.start');
    Route::post('/routes/{route}/ping', [\App\Http\Controllers\Collector\RouteTrackingController::class, 'ping'])->name('routes.ping');
    Route::post('/routes/{route}/finish', [\App\Http\Controllers\Collector\RouteTrackingController::class, 'finish'])->name('routes.finish');

    Route::post('/routes/{route}/stops/{stop}/collect', [\App\Http\Controllers\Collector\CollectorRouteController::class, 'collect'])->name('routes.stops.collect');
    Route::post('/routes/{route}/stops/{stop}/missed', [\App\Http\Controllers\Collector\CollectorRouteController::class, 'reportMissed'])->name('routes.stops.missed');

    Route::get('/reports', [\App\Http\Controllers\Collector\CollectorReportController::class, 'index'])->name('reports.index');
    Route::get('/reports/create', [\App\Http\Controllers\Collector\CollectorReportController::class, 'create'])->name('reports.create');
    Route::post('/reports', [\App\Http\Controllers\Collector\CollectorReportController::class, 'store'])->name('reports.store');
    Route::get('/reports/{report}', [\App\Http\Controllers\Collector\CollectorReportController::class, 'show'])->name('reports.show');
});

// Admin polls live location (auth-protected)
Route::middleware(['auth'])->get('/admin/routes/{route}/location', [\App\Http\Controllers\Collector\RouteTrackingController::class, 'location'])->name('admin.routes.location');

Route::middleware(['auth', 'role:resident'])->prefix('resident')->name('resident.')->group(function () {
    Route::get('/dashboard', \App\Http\Controllers\Resident\ResidentDashboardController::class)->name('dashboard');
    Route::get('/location/setup', [\App\Http\Controllers\Resident\LocationController::class, 'create'])->name('location.create');
    Route::post('/location/setup', [\App\Http\Controllers\Resident\LocationController::class, 'store'])->name('location.store');

    Route::get('/missed-pickup', [\App\Http\Controllers\Resident\MissedPickupController::class, 'index'])->name('missed-pickup.index');
    Route::post('/missed-pickup', [\App\Http\Controllers\Resident\MissedPickupController::class, 'store'])->name('missed-pickup.store');

    Route::get('/nearby-truck', [\App\Http\Controllers\Resident\ResidentDashboardController::class, 'nearbyTruck'])->name('nearby-truck');
});
require __DIR__.'/settings.php';
