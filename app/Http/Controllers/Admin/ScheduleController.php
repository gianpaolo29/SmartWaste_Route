<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\RoutePlan;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ScheduleController extends Controller
{
    public function index(Request $request)
    {
        $month = (int) $request->query('month', now()->month);
        $year = (int) $request->query('year', now()->year);

        $routes = RoutePlan::with(['zone.barangays', 'collector', 'stops'])
            ->whereMonth('route_date', $month)
            ->whereYear('route_date', $year)
            ->orderBy('route_date')
            ->get()
            ->map(fn ($p) => [
                'id' => $p->id,
                'route_date' => $p->route_date->toDateString(),
                'status' => $p->status,
                'zone' => $p->zone ? [
                    'name' => $p->zone->name,
                    'barangays' => $p->zone->barangayNames(),
                ] : null,
                'collector' => $p->collector ? [
                    'id' => $p->collector->id,
                    'name' => $p->collector->name,
                ] : null,
                'stops_count' => $p->stops->count(),
                'started_at' => $p->started_at?->format('g:i A'),
                'finished_at' => $p->finished_at?->format('g:i A'),
            ]);

        $stats = [
            'total' => $routes->count(),
            'planned' => $routes->where('status', 'planned')->count(),
            'in_progress' => $routes->where('status', 'in_progress')->count(),
            'completed' => $routes->where('status', 'completed')->count(),
            'cancelled' => $routes->where('status', 'cancelled')->count(),
        ];

        return Inertia::render('admin/schedules/index', [
            'routes' => $routes,
            'stats' => $stats,
            'month' => $month,
            'year' => $year,
        ]);
    }
}
