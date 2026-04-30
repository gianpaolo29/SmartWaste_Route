<?php

namespace App\Http\Controllers\Collector;

use App\Http\Controllers\Controller;
use App\Models\CollectionReport;
use App\Models\RoutePlan;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CollectorReportController extends Controller
{
    public function index(Request $request)
    {
        $userId = $request->user()->id;
        $period = $request->query('period', 'all');
        $now = now();

        $query = CollectionReport::with('routePlan.zone.barangays')
            ->where('collector_user_id', $userId)
            ->orderByDesc('report_date');

        match ($period) {
            'today' => $query->whereDate('report_date', $now->toDateString()),
            'week' => $query->whereBetween('report_date', [$now->startOfWeek()->toDateString(), $now->copy()->endOfWeek()->toDateString()]),
            'month' => $query->whereMonth('report_date', $now->month)->whereYear('report_date', $now->year),
            default => null,
        };

        // Clone query for summary (before pagination)
        $summaryQuery = clone $query;

        $total = fn ($r) => $r->mixed_waste + $r->biodegradable + $r->recyclable + $r->residual + $r->solid_waste;

        // Summary from all matching records
        $allItems = $summaryQuery->get();
        $summary = [
            'count' => $allItems->count(),
            'total_waste' => round($allItems->sum($total), 1),
            'mixed' => round($allItems->sum('mixed_waste'), 1),
            'biodegradable' => round($allItems->sum('biodegradable'), 1),
            'recyclable' => round($allItems->sum('recyclable'), 1),
            'residual' => round($allItems->sum('residual'), 1),
            'solid' => round($allItems->sum('solid_waste'), 1),
        ];

        // Paginate
        $paginated = $query->paginate(20)->withQueryString();

        $reports = collect($paginated->items())->map(fn ($r) => [
            'id' => $r->id,
            'report_date' => $r->report_date->toDateString(),
            'mixed_waste' => $r->mixed_waste,
            'biodegradable' => $r->biodegradable,
            'recyclable' => $r->recyclable,
            'residual' => $r->residual,
            'solid_waste' => $r->solid_waste,
            'total' => round($total($r), 2),
            'notes' => $r->notes,
            'zone' => $r->routePlan?->zone ? [
                'name' => $r->routePlan->zone->name,
                'barangay' => $r->routePlan->zone->barangayNames(),
            ] : null,
        ]);

        // Available routes for new report modal
        $availableRoutes = RoutePlan::with('zone.barangays')
            ->where('collector_user_id', $userId)
            ->where('status', 'completed')
            ->whereDoesntHave('collectionReport')
            ->orderByDesc('route_date')
            ->get()
            ->map(fn ($p) => [
                'id' => $p->id,
                'route_date' => $p->route_date?->toDateString(),
                'zone' => $p->zone ? $p->zone->name . ' (' . ($p->zone->barangayNames() ?: '—') . ')' : '—',
            ]);

        return Inertia::render('collector/reports/index', [
            'reports' => $reports,
            'summary' => $summary,
            'period' => $period,
            'pagination' => [
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),
                'total' => $paginated->total(),
            ],
            'availableRoutes' => $availableRoutes,
            'preselectedRouteId' => $request->query('route_id'),
        ]);
    }

    public function create(Request $request)
    {
        $userId = $request->user()->id;

        // Get completed routes that don't have a report yet
        $routes = RoutePlan::with('zone.barangays')
            ->where('collector_user_id', $userId)
            ->where('status', 'completed')
            ->whereDoesntHave('collectionReport')
            ->orderByDesc('route_date')
            ->get()
            ->map(fn ($p) => [
                'id' => $p->id,
                'route_date' => $p->route_date?->toDateString(),
                'zone' => $p->zone ? $p->zone->name . ' (' . ($p->zone->barangayNames() ?: '—') . ')' : '—',
            ]);

        return Inertia::render('collector/reports/create', [
            'routes' => $routes,
            'route_id' => $request->query('route_id'),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'route_plan_id' => ['required', 'exists:route_plans,id'],
            'mixed_waste' => ['required', 'numeric', 'min:0'],
            'biodegradable' => ['required', 'numeric', 'min:0'],
            'recyclable' => ['required', 'numeric', 'min:0'],
            'residual' => ['required', 'numeric', 'min:0'],
            'solid_waste' => ['required', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $route = RoutePlan::findOrFail($data['route_plan_id']);
        abort_unless($route->collector_user_id === $request->user()->id, 403);
        abort_unless($route->status === 'completed', 422, 'Route must be completed before submitting a report.');

        // Prevent duplicate reports
        abort_if(
            CollectionReport::where('route_plan_id', $route->id)->exists(),
            422,
            'A report already exists for this route.'
        );

        CollectionReport::create([
            ...$data,
            'collector_user_id' => $request->user()->id,
            'report_date' => $route->route_date ?? now()->toDateString(),
        ]);

        return redirect()->route('collector.reports.index')
            ->with('success', 'Report submitted successfully.');
    }

    public function show(Request $request, CollectionReport $report)
    {
        abort_unless($report->collector_user_id === $request->user()->id, 403);

        $report->load('routePlan.zone.barangays');

        return Inertia::render('collector/reports/show', [
            'report' => [
                'id' => $report->id,
                'report_date' => $report->report_date->toDateString(),
                'mixed_waste' => $report->mixed_waste,
                'biodegradable' => $report->biodegradable,
                'recyclable' => $report->recyclable,
                'residual' => $report->residual,
                'solid_waste' => $report->solid_waste,
                'total' => $report->mixed_waste + $report->biodegradable + $report->recyclable + $report->residual + $report->solid_waste,
                'notes' => $report->notes,
                'zone' => $report->routePlan?->zone ? [
                    'name' => $report->routePlan->zone->name,
                    'barangay' => $report->routePlan->zone->barangayNames(),
                ] : null,
                'route_date' => $report->routePlan?->route_date?->toDateString(),
                'created_at' => $report->created_at->toDateTimeString(),
            ],
        ]);
    }
}
