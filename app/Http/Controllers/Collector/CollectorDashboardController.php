<?php

namespace App\Http\Controllers\Collector;

use App\Http\Controllers\Controller;
use App\Models\RoutePlan;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CollectorDashboardController extends Controller
{
    public function __invoke(Request $request)
    {
        $userId = $request->user()->id;

        // If a route is currently in progress, jump straight to it
        $active = RoutePlan::where('collector_user_id', $userId)
            ->where('status', 'in_progress')
            ->latest('id')
            ->first();

        if ($active) {
            return redirect()->route('collector.routes.show', $active->id);
        }

        $today = RoutePlan::with(['zone.barangays', 'stops'])
            ->where('collector_user_id', $userId)
            ->whereDate('route_date', today())
            ->orderBy('id')
            ->get();

        $upcoming = RoutePlan::with(['zone.barangays'])
            ->where('collector_user_id', $userId)
            ->whereDate('route_date', '>', today())
            ->orderBy('route_date')
            ->limit(5)
            ->get();

        $stats = [
            'today_count' => $today->count(),
            'upcoming_count' => RoutePlan::where('collector_user_id', $userId)
                ->whereDate('route_date', '>', today())->count(),
            'completed_count' => RoutePlan::where('collector_user_id', $userId)
                ->where('status', 'completed')->count(),
        ];

        $mapRoute = fn ($p) => [
            'id' => $p->id,
            'route_date' => $p->route_date?->toDateString(),
            'status' => $p->status,
            'zone' => $p->zone ? [
                'name' => $p->zone->name,
                'barangay' => $p->zone->barangayNames(),
            ] : null,
            'stops_count' => $p->stops?->count() ?? 0,
        ];

        return Inertia::render('collector/dashboard', [
            'today' => $today->map($mapRoute),
            'upcoming' => $upcoming->map($mapRoute),
            'stats' => $stats,
        ]);
    }
}
