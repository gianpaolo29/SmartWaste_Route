<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Barangay;
use App\Models\Household;
use App\Models\CollectionReport;
use App\Models\MissedPickupReport;
use App\Models\User;
use App\Models\Truck;
use App\Models\Zone;
use App\Support\TuyBarangayBoundaries;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class AdminListController extends Controller
{
    public function dashboard(Request $request)
    {
        $period = $request->get('period', 'all');
        $periodStart = match ($period) {
            'today' => now()->startOfDay(),
            'week' => now()->subDays(7),
            'month' => now()->subDays(30),
            default => null,
        };
        $routeQuery = fn () => \App\Models\RoutePlan::when($periodStart, fn ($q) => $q->where('created_at', '>=', $periodStart));
        $reportQuery = fn () => MissedPickupReport::when($periodStart, fn ($q) => $q->where('created_at', '>=', $periodStart));
        $wasteQuery = fn () => CollectionReport::when($periodStart, fn ($q) => $q->where('report_date', '>=', $periodStart));

        $stats = [
            'residents' => User::where('role', 'resident')->when($periodStart, fn ($q) => $q->where('created_at', '>=', $periodStart))->count(),
            'collectors' => User::where('role', 'collector')->count(),
            'trucks' => Truck::count(),
            'trucks_available' => Truck::where('status', 'available')->count(),
            'active_zones' => Zone::where('active', true)->count(),
            'total_routes' => $routeQuery()->count(),
            'active_routes' => $routeQuery()->where('status', 'in_progress')->count(),
            'completed_routes' => $routeQuery()->where('status', 'completed')->count(),
            'total_barangays' => Barangay::count(),
            'open_reports' => $reportQuery()->where('status', 'open')->count(),
            'total_reports' => $reportQuery()->count(),
            'today_routes' => \App\Models\RoutePlan::whereDate('route_date', today())->count(),
            'total_waste' => round($wasteQuery()->selectRaw('COALESCE(SUM(mixed_waste + biodegradable + recyclable + residual + solid_waste), 0) as t')->value('t'), 1),
            'total_stops_served' => \App\Models\Collection::where('status', 'collected')->when($periodStart, fn ($q) => $q->where('created_at', '>=', $periodStart))->count(),
        ];

        $recentRoutes = \App\Models\RoutePlan::with(['zone.barangays', 'collector'])
            ->when($periodStart, fn ($q) => $q->where('created_at', '>=', $periodStart))
            ->orderByDesc('id')
            ->limit(5)
            ->get()
            ->map(fn ($p) => [
                'id' => $p->id,
                'route_date' => $p->route_date?->toDateString(),
                'status' => $p->status,
                'zone' => $p->zone?->name,
                'barangay' => $p->zone?->barangayNames(),
                'collector' => $p->collector?->name,
            ]);

        // Recent missed pickup reports
        $recentReports = MissedPickupReport::with(['resident', 'zone.barangays'])
            ->when($periodStart, fn ($q) => $q->where('created_at', '>=', $periodStart))
            ->orderByDesc('report_datetime')
            ->limit(5)
            ->get()
            ->map(fn ($r) => [
                'id' => $r->id,
                'description' => $r->description,
                'status' => $r->status,
                'report_datetime' => $r->report_datetime?->toDateTimeString(),
                'resident' => $r->resident?->name,
                'zone' => $r->zone?->name,
            ]);

        // Collector performance
        $collectorPerformance = User::where('role', 'collector')
            ->where('status', 'active')
            ->withCount([
                'assignedRoutePlans as completed_count' => fn ($q) => $q->where('status', 'completed')->when($periodStart, fn ($q2) => $q2->where('created_at', '>=', $periodStart)),
                'assignedRoutePlans as total_count' => fn ($q) => $q->when($periodStart, fn ($q2) => $q2->where('created_at', '>=', $periodStart)),
            ])
            ->get()
            ->map(fn ($u) => [
                'name' => $u->name,
                'completed' => $u->completed_count,
                'total' => $u->total_count,
                'rate' => $u->total_count > 0 ? round(($u->completed_count / $u->total_count) * 100) : 0,
            ])
            ->sortByDesc('completed')
            ->values()
            ->take(5);

        // Weekly waste trend (respects period filter)
        $trendStart = $periodStart ?? now()->subDays(6);
        $wasteTrend = CollectionReport::where('report_date', '>=', $trendStart->toDateString())
            ->get()
            ->groupBy(fn ($r) => $r->report_date->format('D'))
            ->map(fn ($group, $day) => [
                'day' => $day,
                'total' => round($group->sum(fn ($r) => $r->mixed_waste + $r->biodegradable + $r->recyclable + $r->residual + $r->solid_waste), 1),
            ])
            ->values();

        // Monthly waste trend (respects period filter)
        $monthlyStart = $periodStart ?? now()->subDays(29);
        $monthlyWaste = CollectionReport::where('report_date', '>=', $monthlyStart->toDateString())
            ->orderBy('report_date')
            ->get()
            ->groupBy(fn ($r) => $r->report_date->toDateString())
            ->map(fn ($group, $date) => [
                'date' => $date,
                'mixed' => round($group->sum('mixed_waste'), 1),
                'bio' => round($group->sum('biodegradable'), 1),
                'recyclable' => round($group->sum('recyclable'), 1),
                'residual' => round($group->sum('residual'), 1),
                'solid' => round($group->sum('solid_waste'), 1),
                'total' => round($group->sum(fn ($r) => $r->mixed_waste + $r->biodegradable + $r->recyclable + $r->residual + $r->solid_waste), 1),
            ])
            ->values();

        // Waste breakdown by type (respects period filter)
        $wasteBreakdown = [
            ['name' => 'Mixed', 'value' => round($wasteQuery()->sum('mixed_waste'), 1)],
            ['name' => 'Biodegradable', 'value' => round($wasteQuery()->sum('biodegradable'), 1)],
            ['name' => 'Recyclable', 'value' => round($wasteQuery()->sum('recyclable'), 1)],
            ['name' => 'Residual', 'value' => round($wasteQuery()->sum('residual'), 1)],
            ['name' => 'Solid', 'value' => round($wasteQuery()->sum('solid_waste'), 1)],
        ];

        // Route status breakdown (respects period filter)
        $routeBreakdown = [
            ['name' => 'Completed', 'value' => $routeQuery()->where('status', 'completed')->count()],
            ['name' => 'In Progress', 'value' => $routeQuery()->where('status', 'in_progress')->count()],
            ['name' => 'Planned', 'value' => $routeQuery()->where('status', 'planned')->count()],
            ['name' => 'Cancelled', 'value' => $routeQuery()->where('status', 'cancelled')->count()],
        ];

        return Inertia::render('admin/dashboard', [
            'stats' => $stats,
            'recentRoutes' => $recentRoutes,
            'recentReports' => $recentReports,
            'collectorPerformance' => $collectorPerformance,
            'wasteTrend' => $wasteTrend,
            'monthlyWaste' => $monthlyWaste,
            'wasteBreakdown' => $wasteBreakdown,
            'routeBreakdown' => $routeBreakdown,
            'period' => $period,
        ]);
    }

    public function barangays()
    {
        // Auto-sync: ensure all 23 Tuy barangays exist in the database
        $centroids = \App\Support\TuyBarangayBoundaries::CENTROIDS;
        $existing = Barangay::pluck('name')->map(fn ($n) => strtolower($n))->toArray();

        foreach ($centroids as $name => $coords) {
            if (!in_array(strtolower($name), $existing, true)) {
                $brg = Barangay::create(['name' => $name]);

                // Also create a default zone and link it
                $zone = Zone::firstOrCreate(
                    ['name' => 'Zone ' . $name],
                    ['description' => "Default collection zone for Barangay {$name}, Tuy, Batangas.", 'active' => true],
                );
                $brg->zones()->syncWithoutDetaching([$zone->id]);
            }
        }

        $items = Barangay::withCount(['zones', 'households'])
            ->orderBy('name')
            ->get()
            ->map(fn ($b) => [
                'id' => $b->id,
                'name' => $b->name,
                'zones_count' => $b->zones_count,
                'residents_count' => $b->households_count,
            ]);

        $stats = [
            'total_barangays' => Barangay::count(),
            'total_zones' => Zone::count(),
            'total_residents' => Household::count(),
            'active_zones' => Zone::where('active', true)->count(),
        ];

        // Pre-load all boundaries so the frontend doesn't need N individual fetches
        $boundaries = [];
        foreach (Barangay::orderBy('name')->get() as $b) {
            $boundary = \App\Support\TuyBarangayBoundaries::forName($b->name);

            // If no match found, try to generate a hexagon from the barangay's households
            if (!$boundary) {
                $hh = \App\Models\Household::where('barangay_id', $b->id)
                    ->whereNotNull('lat')->whereNotNull('lng')
                    ->selectRaw('AVG(lat) as avg_lat, AVG(lng) as avg_lng')
                    ->first();

                if ($hh && $hh->avg_lat && $hh->avg_lng) {
                    $boundary = [
                        'paths' => [\App\Support\TuyBarangayBoundaries::hexagon((float) $hh->avg_lat, (float) $hh->avg_lng)],
                        'center' => ['lat' => (float) $hh->avg_lat, 'lng' => (float) $hh->avg_lng],
                        'radius_m' => 500,
                    ];
                }
            }

            $boundaries[$b->id] = $boundary ?? ['paths' => [], 'center' => null];
        }

        return Inertia::render('admin/barangays/index', [
            'items' => $items,
            'stats' => $stats,
            'mapsApiKey' => config('services.google.maps_api_key'),
            'boundaries' => $boundaries,
        ]);
    }

    public function barangayBoundary(Barangay $barangay)
    {
        // Hardcoded local map — no network call
        $data = TuyBarangayBoundaries::forName($barangay->name)
            ?? ['paths' => [], 'center' => null];

        return response()->json($data);
    }

    public function zones()
    {
        $items = Zone::with('barangays.households')
            ->withCount('households')
            ->orderBy('name')
            ->get()
            ->map(fn ($z) => [
                'id' => $z->id,
                'name' => $z->name,
                'barangays' => $z->barangays->map(fn ($b) => ['id' => $b->id, 'name' => $b->name]),
                'active' => (bool) $z->active,
                'households_count' => $z->households_count ?: $z->barangays->sum(fn ($b) => $b->households->count()),
                'description' => $z->description,
            ]);

        $barangays = Barangay::orderBy('name')->get(['id', 'name']);

        // Pre-load all boundaries
        $boundaries = [];
        foreach ($barangays as $b) {
            $boundary = \App\Support\TuyBarangayBoundaries::forName($b->name);
            $boundaries[$b->id] = $boundary ?? ['paths' => [], 'center' => null];
        }

        return Inertia::render('admin/zones/index', [
            'items' => $items,
            'barangays' => $barangays,
            'mapsApiKey' => config('services.google.maps_api_key'),
            'boundaries' => $boundaries,
        ]);
    }

    public function storeZone(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:500'],
            'barangay_ids' => ['required', 'array', 'min:1'],
            'barangay_ids.*' => ['exists:barangays,id'],
        ]);

        $zone = Zone::create([
            'name' => $data['name'],
            'description' => $data['description'] ?? '',
            'active' => true,
        ]);

        $zone->barangays()->sync($data['barangay_ids']);

        // Assign households in these barangays to this zone
        Household::whereIn('barangay_id', $data['barangay_ids'])
            ->update(['zone_id' => $zone->id]);

        return back();
    }

    public function updateZone(Request $request, Zone $zone)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:500'],
            'active' => ['required', 'boolean'],
            'barangay_ids' => ['required', 'array', 'min:1'],
            'barangay_ids.*' => ['exists:barangays,id'],
        ]);

        $zone->update([
            'name' => $data['name'],
            'description' => $data['description'] ?? '',
            'active' => $data['active'],
        ]);

        $zone->barangays()->sync($data['barangay_ids']);

        // Reassign households in these barangays to this zone
        Household::whereIn('barangay_id', $data['barangay_ids'])
            ->update(['zone_id' => $zone->id]);

        return back();
    }

    public function destroyZone(Zone $zone)
    {
        // Prevent deleting zones with active routes
        $activeRoutes = \App\Models\RoutePlan::where('zone_id', $zone->id)
            ->whereIn('status', ['planned', 'in_progress'])
            ->count();

        if ($activeRoutes > 0) {
            return back()->withErrors(['zone' => "Cannot delete zone with {$activeRoutes} active route(s). Cancel or complete them first."]);
        }

        $zone->delete();
        return back();
    }

    public function residents()
    {
        $items = User::where('role', 'resident')
            ->with(['households.zone.barangays'])
            ->orderBy('name')
            ->get()
            ->map(function ($u) {
                $hh = $u->households->first();
                return [
                    'id' => $u->id,
                    'name' => $u->name,
                    'email' => $u->email,
                    'status' => $u->status,
                    'zone' => $hh?->zone ? [
                        'name' => $hh->zone->name,
                        'barangay' => $hh->zone->barangayNames(),
                    ] : null,
                    'address' => $hh?->address_line,
                    'created_at' => $u->created_at->toISOString(),
                ];
            });

        $now = now();
        $stats = [
            'total' => User::where('role', 'resident')->count(),
            'active' => User::where('role', 'resident')->where('status', 'active')->count(),
            'inactive' => User::where('role', 'resident')->where('status', '!=', 'active')->count(),
            'today' => User::where('role', 'resident')->whereDate('created_at', $now->toDateString())->count(),
            'this_week' => User::where('role', 'resident')->where('created_at', '>=', $now->copy()->subDays(7))->count(),
            'this_month' => User::where('role', 'resident')->where('created_at', '>=', $now->copy()->subDays(30))->count(),
        ];

        return Inertia::render('admin/residents/index', ['items' => $items, 'stats' => $stats]);
    }

    public function collectors()
    {
        $items = User::where('role', 'collector')
            ->withCount('assignedRoutePlans')
            ->orderBy('name')
            ->get()
            ->map(fn ($u) => [
                'id' => $u->id,
                'name' => $u->name,
                'email' => $u->email,
                'status' => $u->status,
                'routes_count' => $u->assigned_route_plans_count,
            ]);

        $stats = [
            'total' => User::where('role', 'collector')->count(),
            'active' => User::where('role', 'collector')->where('status', 'active')->count(),
            'inactive' => User::where('role', 'collector')->where('status', '!=', 'active')->count(),
        ];

        return Inertia::render('admin/collectors/index', ['items' => $items, 'stats' => $stats]);
    }

    public function storeResident(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
        ]);

        User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'role' => 'resident',
            'status' => 'active',
        ]);

        return back();
    }

    public function updateResident(Request $request, User $user)
    {
        abort_unless($user->role === 'resident', 404);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', Rule::unique('users')->ignore($user->id)],
            'status' => ['required', 'in:active,inactive'],
            'password' => ['nullable', 'string', 'min:8'],
        ]);

        $user->update([
            'name' => $data['name'],
            'email' => $data['email'],
            'status' => $data['status'],
            ...($data['password'] ? ['password' => Hash::make($data['password'])] : []),
        ]);

        return back();
    }

    public function destroyResident(User $user)
    {
        abort_unless($user->role === 'resident', 404);
        $user->delete();
        return back();
    }

    public function storeCollector(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
        ]);

        User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'role' => 'collector',
            'status' => 'active',
        ]);

        return back();
    }

    public function updateCollector(Request $request, User $user)
    {
        abort_unless($user->role === 'collector', 404);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', Rule::unique('users')->ignore($user->id)],
            'status' => ['required', 'in:active,inactive'],
            'password' => ['nullable', 'string', 'min:8'],
        ]);

        $user->update([
            'name' => $data['name'],
            'email' => $data['email'],
            'status' => $data['status'],
            ...($data['password'] ? ['password' => Hash::make($data['password'])] : []),
        ]);

        return back();
    }

    public function destroyCollector(User $user)
    {
        abort_unless($user->role === 'collector', 404);
        $user->delete();
        return back();
    }

    public function collectionReports(Request $request)
    {
        $period = $request->query('period', 'all');
        $search = $request->query('search');

        $query = CollectionReport::with(['routePlan.zone.barangays', 'collector'])
            ->orderByDesc('report_date');

        // Date filtering
        $now = now();
        match ($period) {
            'today' => $query->whereDate('report_date', $now->toDateString()),
            'weekly' => $query->whereBetween('report_date', [$now->startOfWeek()->toDateString(), $now->copy()->endOfWeek()->toDateString()]),
            'monthly' => $query->whereMonth('report_date', $now->month)->whereYear('report_date', $now->year),
            default => null,
        };

        // Search by collector name, zone name, or barangay name
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->whereHas('collector', fn ($cq) => $cq->where('name', 'like', "%{$search}%"))
                  ->orWhereHas('routePlan.zone', fn ($zq) => $zq->where('name', 'like', "%{$search}%"))
                  ->orWhereHas('routePlan.zone.barangays', fn ($bq) => $bq->where('name', 'like', "%{$search}%"));
            });
        }

        $items = $query->get();

        // Previous period for comparison
        $prevQuery = CollectionReport::query();
        if ($search) {
            $prevQuery->where(function ($q) use ($search) {
                $q->whereHas('collector', fn ($cq) => $cq->where('name', 'like', "%{$search}%"))
                  ->orWhereHas('routePlan.zone', fn ($zq) => $zq->where('name', 'like', "%{$search}%"))
                  ->orWhereHas('routePlan.zone.barangays', fn ($bq) => $bq->where('name', 'like', "%{$search}%"));
            });
        }
        match ($period) {
            'today' => $prevQuery->whereDate('report_date', $now->copy()->subDay()->toDateString()),
            'weekly' => $prevQuery->whereBetween('report_date', [$now->copy()->subWeek()->startOfWeek()->toDateString(), $now->copy()->subWeek()->endOfWeek()->toDateString()]),
            'monthly' => $prevQuery->whereMonth('report_date', $now->copy()->subMonth()->month)->whereYear('report_date', $now->copy()->subMonth()->year),
            default => null,
        };
        $prevItems = $prevQuery->get();

        $calcTotals = function ($collection) {
            return [
                'mixed_waste' => round($collection->sum('mixed_waste'), 2),
                'biodegradable' => round($collection->sum('biodegradable'), 2),
                'recyclable' => round($collection->sum('recyclable'), 2),
                'residual' => round($collection->sum('residual'), 2),
                'solid_waste' => round($collection->sum('solid_waste'), 2),
                'total' => round($collection->sum(fn ($r) => $r->mixed_waste + $r->biodegradable + $r->recyclable + $r->residual + $r->solid_waste), 2),
                'reports_count' => $collection->count(),
            ];
        };

        $totals = $calcTotals($items);
        $prevTotals = $calcTotals($prevItems);

        // Chart data — group by date
        $chartData = $items->groupBy(fn ($r) => $r->report_date->toDateString())
            ->map(fn ($group, $date) => [
                'date' => $date,
                'mixed_waste' => round($group->sum('mixed_waste'), 2),
                'biodegradable' => round($group->sum('biodegradable'), 2),
                'recyclable' => round($group->sum('recyclable'), 2),
                'residual' => round($group->sum('residual'), 2),
                'solid_waste' => round($group->sum('solid_waste'), 2),
            ])
            ->sortKeys()
            ->values();

        // Breakdown for donut chart
        $breakdown = [
            ['name' => 'Mixed Waste', 'value' => $totals['mixed_waste']],
            ['name' => 'Biodegradable', 'value' => $totals['biodegradable']],
            ['name' => 'Recyclable', 'value' => $totals['recyclable']],
            ['name' => 'Residual', 'value' => $totals['residual']],
            ['name' => 'Solid Waste', 'value' => $totals['solid_waste']],
        ];

        // Table rows
        $rows = $items->map(fn ($r) => [
            'id' => $r->id,
            'report_date' => $r->report_date->toDateString(),
            'collector' => $r->collector?->name,
            'zone' => $r->routePlan?->zone ? [
                'name' => $r->routePlan->zone->name,
                'barangay' => $r->routePlan->zone->barangayNames(),
            ] : null,
            'mixed_waste' => $r->mixed_waste,
            'biodegradable' => $r->biodegradable,
            'recyclable' => $r->recyclable,
            'residual' => $r->residual,
            'solid_waste' => $r->solid_waste,
            'total' => round($r->mixed_waste + $r->biodegradable + $r->recyclable + $r->residual + $r->solid_waste, 2),
            'notes' => $r->notes,
        ]);

        // Full suggestion list from all reports (unfiltered) for autocomplete
        $allReports = CollectionReport::with(['collector', 'routePlan.zone.barangays'])->get();
        $suggestions = collect()
            ->merge($allReports->pluck('collector.name')->filter()->unique()->map(fn ($n) => ['type' => 'Collector', 'text' => $n]))
            ->merge($allReports->map(fn ($r) => $r->routePlan?->zone?->name)->filter()->unique()->map(fn ($n) => ['type' => 'Zone', 'text' => $n]))
            ->merge($allReports->flatMap(fn ($r) => $r->routePlan?->zone?->barangays?->pluck('name') ?? collect())->filter()->unique()->map(fn ($n) => ['type' => 'Barangay', 'text' => $n]))
            ->values();

        return Inertia::render('admin/collection-reports/index', [
            'items' => $rows,
            'totals' => $totals,
            'prevTotals' => $prevTotals,
            'chartData' => $chartData,
            'breakdown' => $breakdown,
            'suggestions' => $suggestions,
            'search' => $search ?? '',
            'selectedPeriod' => $period,
        ]);
    }

    public function reports(Request $request)
    {
        $filter = $request->query('status');

        $query = MissedPickupReport::with(['resident', 'zone.barangays'])
            ->orderByDesc('report_datetime');

        if ($filter) {
            $query->where('status', $filter);
        }

        $items = $query->get()->map(fn ($r) => [
            'id' => $r->id,
            'description' => $r->description,
            'status' => $r->status,
            'report_datetime' => $r->report_datetime?->toDateTimeString(),
            'location_text' => $r->location_text,
            'resident' => $r->resident?->name,
            'zone' => $r->zone ? [
                'name' => $r->zone->name,
                'barangay' => $r->zone->barangayNames(),
            ] : null,
        ]);

        $stats = [
            'total' => MissedPickupReport::count(),
            'open' => MissedPickupReport::where('status', 'open')->count(),
            'in_progress' => MissedPickupReport::where('status', 'in_progress')->count(),
            'resolved' => MissedPickupReport::where('status', 'resolved')->count(),
        ];

        return Inertia::render('admin/reports/index', [
            'items' => $items,
            'stats' => $stats,
            'filter' => $filter ?? '',
        ]);
    }

    public function updateReportStatus(Request $request, MissedPickupReport $report)
    {
        $data = $request->validate([
            'status' => ['required', 'in:open,in_progress,resolved'],
        ]);

        $report->update(['status' => $data['status']]);

        return back();
    }

    // ─── Trucks ──────────────────────────────────────────────────────────────

    public function trucks()
    {
        $items = Truck::with('collector')
            ->withCount('routePlans')
            ->orderBy('plate_no')
            ->get()
            ->map(fn ($t) => [
                'id' => $t->id,
                'plate_no' => $t->plate_no,
                'capacity_kg' => $t->capacity_kg,
                'status' => $t->status,
                'collector' => $t->collector ? ['id' => $t->collector->id, 'name' => $t->collector->name] : null,
                'routes_count' => $t->route_plans_count,
            ]);

        $collectors = User::where('role', 'collector')->where('status', 'active')->orderBy('name')->get(['id', 'name']);

        $stats = [
            'total' => Truck::count(),
            'available' => Truck::where('status', 'available')->count(),
            'maintenance' => Truck::where('status', 'maintenance')->count(),
            'inactive' => Truck::where('status', 'inactive')->count(),
        ];

        return Inertia::render('admin/trucks/index', [
            'items' => $items,
            'collectors' => $collectors,
            'stats' => $stats,
        ]);
    }

    public function storeTruck(Request $request)
    {
        $data = $request->validate([
            'plate_no' => ['required', 'string', 'max:20', 'unique:trucks,plate_no'],
            'capacity_kg' => ['required', 'integer', 'min:0'],
            'status' => ['required', 'in:available,maintenance,inactive'],
            'collector_user_id' => ['nullable', 'exists:users,id'],
        ]);

        Truck::create($data);

        return back();
    }

    public function updateTruck(Request $request, Truck $truck)
    {
        $data = $request->validate([
            'plate_no' => ['required', 'string', 'max:20', Rule::unique('trucks', 'plate_no')->ignore($truck->id)],
            'capacity_kg' => ['required', 'integer', 'min:0'],
            'status' => ['required', 'in:available,maintenance,inactive'],
            'collector_user_id' => ['nullable', 'exists:users,id'],
        ]);

        $truck->update($data);

        return back();
    }

    public function destroyTruck(Truck $truck)
    {
        if ($truck->routePlans()->where('status', 'in_progress')->exists()) {
            return back()->withErrors(['truck' => 'Cannot delete a truck with active routes.']);
        }

        $truck->delete();

        return back();
    }
}
