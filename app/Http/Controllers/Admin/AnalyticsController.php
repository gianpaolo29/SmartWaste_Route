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
        $zones = Zone::where('active', true)->with('barangays')->get();

        $zoneWaste = CollectionReport::query()
            ->join('route_plans', 'collection_reports.route_plan_id', '=', 'route_plans.id')
            ->selectRaw('route_plans.zone_id, SUM(mixed_waste + biodegradable + recyclable + residual + solid_waste) as total_waste, COUNT(*) as report_count')
            ->groupBy('route_plans.zone_id')
            ->pluck('total_waste', 'zone_id');

        $reportCounts = CollectionReport::query()
            ->join('route_plans', 'collection_reports.route_plan_id', '=', 'route_plans.id')
            ->selectRaw('route_plans.zone_id, COUNT(*) as report_count')
            ->groupBy('route_plans.zone_id')
            ->pluck('report_count', 'zone_id');

        $missedByZone = MissedPickupReport::selectRaw('zone_id, COUNT(*) as count')
            ->groupBy('zone_id')
            ->pluck('count', 'zone_id');

        $missedMarkers = MissedPickupReport::whereNotNull('lat')
            ->whereNotNull('lng')
            ->where('status', '!=', 'resolved')
            ->select('id', 'lat', 'lng', 'description', 'status', 'report_datetime')
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

        $maxWaste = $zoneWaste->max() ?: 1;

        $zoneData = $zones->map(fn ($z) => [
            'id' => $z->id,
            'name' => $z->name,
            'barangays' => $z->barangays->pluck('name')->join(', '),
            'total_waste' => round($zoneWaste[$z->id] ?? 0, 1),
            'report_count' => $reportCounts[$z->id] ?? 0,
            'missed_count' => $missedByZone[$z->id] ?? 0,
            'intensity' => round(($zoneWaste[$z->id] ?? 0) / $maxWaste, 2),
        ]);

        // Waste breakdown per zone for detail panel
        $zoneBreakdowns = CollectionReport::query()
            ->join('route_plans', 'collection_reports.route_plan_id', '=', 'route_plans.id')
            ->selectRaw('route_plans.zone_id, SUM(mixed_waste) as mixed, SUM(biodegradable) as bio, SUM(recyclable) as recyclable, SUM(residual) as residual, SUM(solid_waste) as solid')
            ->groupBy('route_plans.zone_id')
            ->get()
            ->keyBy('zone_id');

        $zoneData = $zoneData->map(function ($z) use ($zoneBreakdowns) {
            $bd = $zoneBreakdowns[$z['id']] ?? null;
            $z['breakdown'] = $bd ? [
                ['name' => 'Mixed', 'value' => round($bd->mixed, 1), 'color' => '#f59e0b'],
                ['name' => 'Biodegradable', 'value' => round($bd->bio, 1), 'color' => '#10b981'],
                ['name' => 'Recyclable', 'value' => round($bd->recyclable, 1), 'color' => '#3b82f6'],
                ['name' => 'Residual', 'value' => round($bd->residual, 1), 'color' => '#6b7280'],
                ['name' => 'Solid', 'value' => round($bd->solid, 1), 'color' => '#ef4444'],
            ] : [];
            return $z;
        });

        // Collection point heatmap data — household locations with their waste history
        $heatmapPoints = \App\Models\RouteStop::query()
            ->join('collections', 'route_stops.id', '=', 'collections.route_stop_id')
            ->where('collections.status', 'collected')
            ->whereNotNull('route_stops.lat')
            ->selectRaw('route_stops.lat, route_stops.lng, COUNT(*) as collections_count')
            ->groupBy('route_stops.lat', 'route_stops.lng')
            ->get()
            ->map(fn ($p) => [
                'lat' => (float) $p->lat,
                'lng' => (float) $p->lng,
                'weight' => $p->collections_count,
            ]);

        return Inertia::render('admin/analytics/zone-heatmap', [
            'zones' => $zoneData,
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
