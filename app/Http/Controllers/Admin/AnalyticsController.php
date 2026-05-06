<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CollectionReport;
use App\Models\MissedPickupReport;
use App\Models\RoutePlan;
use App\Models\Zone;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class AnalyticsController extends Controller
{
    /* ── Feature 1: Waste Trends ── */
    public function wasteTrends(Request $request)
    {
        $range = $request->get('range', '30d');
        $startDate = match ($range) {
            '7d' => now()->subDays(7),
            '30d' => now()->subDays(30),
            '90d' => now()->subDays(90),
            '1y' => now()->subYear(),
            default => now()->subDays(30),
        };

        // Daily trend data
        $trendData = CollectionReport::where('report_date', '>=', $startDate)
            ->selectRaw("DATE(report_date) as date, SUM(mixed_waste) as mixed, SUM(biodegradable) as bio, SUM(recyclable) as recyclable, SUM(residual) as residual, SUM(solid_waste) as solid, SUM(mixed_waste + biodegradable + recyclable + residual + solid_waste) as total")
            ->groupBy(DB::raw('DATE(report_date)'))
            ->orderBy('date')
            ->get();

        // Zone comparison
        $zoneComparison = CollectionReport::query()
            ->join('route_plans', 'collection_reports.route_plan_id', '=', 'route_plans.id')
            ->join('zones', 'route_plans.zone_id', '=', 'zones.id')
            ->where('report_date', '>=', $startDate)
            ->selectRaw('zones.name as zone, SUM(mixed_waste + biodegradable + recyclable + residual + solid_waste) as total')
            ->groupBy('zones.name')
            ->orderByDesc('total')
            ->get();

        // Waste breakdown for period
        $breakdown = CollectionReport::where('report_date', '>=', $startDate)
            ->selectRaw("SUM(mixed_waste) as mixed, SUM(biodegradable) as bio, SUM(recyclable) as recyclable, SUM(residual) as residual, SUM(solid_waste) as solid")
            ->first();

        $wasteBreakdown = [
            ['name' => 'Mixed', 'value' => round($breakdown->mixed ?? 0, 1), 'color' => '#f59e0b'],
            ['name' => 'Biodegradable', 'value' => round($breakdown->bio ?? 0, 1), 'color' => '#10b981'],
            ['name' => 'Recyclable', 'value' => round($breakdown->recyclable ?? 0, 1), 'color' => '#3b82f6'],
            ['name' => 'Residual', 'value' => round($breakdown->residual ?? 0, 1), 'color' => '#6b7280'],
            ['name' => 'Solid', 'value' => round($breakdown->solid ?? 0, 1), 'color' => '#ef4444'],
        ];

        return Inertia::render('admin/analytics/waste-trends', [
            'trendData' => $trendData,
            'zoneComparison' => $zoneComparison,
            'wasteBreakdown' => $wasteBreakdown,
            'range' => $range,
        ]);
    }

    /* ── Feature 3: Zone Heatmap ── */
    public function zoneHeatmap(Request $request)
    {
        $centroids = \App\Support\TuyBarangayBoundaries::CENTROIDS;
        $barangays = \App\Models\Barangay::orderBy('name')->get();

        // Waste per barangay via households → route_stops → collections → route_plans → collection_reports
        $brgWaste = CollectionReport::query()
            ->join('route_plans', 'collection_reports.route_plan_id', '=', 'route_plans.id')
            ->join('route_stops', 'route_stops.route_plan_id', '=', 'route_plans.id')
            ->join('households', 'route_stops.household_id', '=', 'households.id')
            ->selectRaw('households.barangay_id, SUM(mixed_waste + biodegradable + recyclable + residual + solid_waste) as total_waste, COUNT(DISTINCT collection_reports.id) as report_count')
            ->groupBy('households.barangay_id')
            ->get()
            ->keyBy('barangay_id');

        // Waste breakdown per barangay
        $brgBreakdowns = CollectionReport::query()
            ->join('route_plans', 'collection_reports.route_plan_id', '=', 'route_plans.id')
            ->join('route_stops', 'route_stops.route_plan_id', '=', 'route_plans.id')
            ->join('households', 'route_stops.household_id', '=', 'households.id')
            ->selectRaw('households.barangay_id, SUM(mixed_waste) as mixed, SUM(biodegradable) as bio, SUM(recyclable) as recyclable, SUM(residual) as residual, SUM(solid_waste) as solid')
            ->groupBy('households.barangay_id')
            ->get()
            ->keyBy('barangay_id');

        // Missed pickups per barangay (via household)
        $missedByBrg = MissedPickupReport::query()
            ->join('households', function ($j) {
                $j->on('missed_pickup_reports.resident_user_id', '=', 'households.resident_user_id');
            })
            ->selectRaw('households.barangay_id, COUNT(*) as count')
            ->groupBy('households.barangay_id')
            ->pluck('count', 'barangay_id');

        $maxWaste = $brgWaste->max('total_waste') ?: 1;

        $barangayData = $barangays->map(function ($b) use ($brgWaste, $brgBreakdowns, $missedByBrg, $maxWaste, $centroids) {
            $waste = $brgWaste[$b->id] ?? null;
            $bd = $brgBreakdowns[$b->id] ?? null;
            $totalWaste = round($waste->total_waste ?? 0, 1);

            return [
                'id' => $b->id,
                'name' => $b->name,
                'total_waste' => $totalWaste,
                'report_count' => $waste->report_count ?? 0,
                'missed_count' => $missedByBrg[$b->id] ?? 0,
                'intensity' => round($totalWaste / $maxWaste, 2),
                'breakdown' => $bd ? [
                    ['name' => 'Mixed', 'value' => round($bd->mixed, 1), 'color' => '#f59e0b'],
                    ['name' => 'Biodegradable', 'value' => round($bd->bio, 1), 'color' => '#10b981'],
                    ['name' => 'Recyclable', 'value' => round($bd->recyclable, 1), 'color' => '#3b82f6'],
                    ['name' => 'Residual', 'value' => round($bd->residual, 1), 'color' => '#6b7280'],
                    ['name' => 'Solid', 'value' => round($bd->solid, 1), 'color' => '#ef4444'],
                ] : [],
            ];
        });

        // Missed pickup markers
        $missedMarkers = MissedPickupReport::whereNotNull('lat')
            ->whereNotNull('lng')
            ->where('status', '!=', 'resolved')
            ->select('id', 'lat', 'lng', 'description', 'status')
            ->orderByDesc('report_datetime')
            ->limit(100)
            ->get()
            ->map(fn ($r) => [
                'id' => $r->id,
                'lat' => (float) $r->lat,
                'lng' => (float) $r->lng,
                'description' => $r->description,
                'status' => $r->status,
            ]);

        // Heatmap points — one dot per barangay at its centroid, weighted by waste
        $heatmapPoints = $barangays->map(function ($b) use ($brgWaste, $centroids) {
            $coords = $centroids[$b->name] ?? null;
            if (!$coords) {
                // Try fuzzy match
                foreach ($centroids as $key => $c) {
                    if (str_contains(strtolower($b->name), strtolower($key)) || str_contains(strtolower($key), strtolower($b->name))) {
                        $coords = $c;
                        break;
                    }
                }
            }
            if (!$coords) return null;
            $waste = $brgWaste[$b->id] ?? null;
            return [
                'lat' => $coords[0],
                'lng' => $coords[1],
                'weight' => (int) ($waste->total_waste ?? 0),
            ];
        })->filter()->values();

        return Inertia::render('admin/analytics/zone-heatmap', [
            'barangays' => $barangayData,
            'missedMarkers' => $missedMarkers,
            'heatmapPoints' => $heatmapPoints,
            'mapsApiKey' => config('services.google.maps_api_key'),
        ]);
    }

    /* ── Feature 8: Live Fleet ── */
    public function liveFleet(Request $request)
    {
        return Inertia::render('admin/analytics/fleet', [
            'mapsApiKey' => config('services.google.maps_api_key'),
            'initialData' => $this->getFleetData(),
        ]);
    }

    public function liveFleetData()
    {
        return response()->json($this->getFleetData());
    }

    private function getFleetData(): array
    {
        $routes = RoutePlan::where('status', 'in_progress')
            ->with(['collector', 'zone.barangays', 'truck', 'stops.collection'])
            ->get()
            ->map(fn ($r) => [
                'id' => $r->id,
                'collector' => $r->collector?->name ?? 'Unknown',
                'zone' => $r->zone?->name ?? '—',
                'truck_plate' => $r->truck?->plate_no ?? '—',
                'lat' => $r->current_lat,
                'lng' => $r->current_lng,
                'location_updated_at' => $r->location_updated_at?->toIso8601String(),
                'started_at' => $r->started_at?->format('g:i A'),
                'total_stops' => $r->stops->count(),
                'completed_stops' => $r->stops->filter(fn ($s) => $s->collection?->status === 'collected')->count(),
            ]);

        return ['routes' => $routes];
    }
}
