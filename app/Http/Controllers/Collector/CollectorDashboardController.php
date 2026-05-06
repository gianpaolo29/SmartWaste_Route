<?php

namespace App\Http\Controllers\Collector;

use App\Http\Controllers\Controller;
use App\Models\CollectionReport;
use App\Models\RoutePlan;
use App\Models\Truck;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CollectorDashboardController extends Controller
{
    public function __invoke(Request $request)
    {
        $userId = $request->user()->id;

        $completedRoutes = RoutePlan::where('collector_user_id', $userId)
            ->where('status', 'completed');

        $reports = CollectionReport::where('collector_user_id', $userId);

        $totalWaste = (clone $reports)->selectRaw(
            'COALESCE(SUM(mixed_waste + biodegradable + recyclable + residual + solid_waste), 0) as total'
        )->value('total');

        $stats = [
            'today_count'     => RoutePlan::where('collector_user_id', $userId)
                ->whereDate('route_date', today())->count(),
            'upcoming_count'  => RoutePlan::where('collector_user_id', $userId)
                ->whereDate('route_date', '>', today())->count(),
            'completed_count' => (clone $completedRoutes)->count(),
            'reports_count'   => (clone $reports)->count(),
            'total_waste'     => round($totalWaste, 1),
            'total_stops'     => (clone $completedRoutes)->withCount('stops')->get()->sum('stops_count'),
        ];

        // Recent reports (last 5)
        $recentReports = CollectionReport::with('routePlan.zone.barangays')
            ->where('collector_user_id', $userId)
            ->orderByDesc('report_date')
            ->limit(5)
            ->get()
            ->map(fn ($r) => [
                'id'          => $r->id,
                'report_date' => $r->report_date->toDateString(),
                'total'       => round($r->mixed_waste + $r->biodegradable + $r->recyclable + $r->residual + $r->solid_waste, 1),
                'zone'        => $r->routePlan?->zone?->name,
            ]);

        // Next route (closest upcoming or today)
        $nextRoute = RoutePlan::with(['zone.barangays', 'stops'])
            ->where('collector_user_id', $userId)
            ->whereIn('status', ['planned', 'in_progress'])
            ->whereDate('route_date', '>=', today())
            ->orderBy('route_date')
            ->orderBy('id')
            ->first();

        $next = $nextRoute ? [
            'id'         => $nextRoute->id,
            'route_date' => $nextRoute->route_date?->toDateString(),
            'status'     => $nextRoute->status,
            'zone'       => $nextRoute->zone ? [
                'name'     => $nextRoute->zone->name,
                'barangay' => $nextRoute->zone->barangayNames(),
            ] : null,
            'stops_count' => $nextRoute->stops->count(),
        ] : null;

        $truck = Truck::where('collector_user_id', $userId)->first();

        return Inertia::render('collector/dashboard', [
            'stats'         => $stats,
            'recentReports' => $recentReports,
            'nextRoute'     => $next,
            'truck'         => $truck ? [
                'id'          => $truck->id,
                'plate_no'    => $truck->plate_no,
                'capacity_kg' => $truck->capacity_kg,
                'status'      => $truck->status,
            ] : null,
        ]);
    }
}
