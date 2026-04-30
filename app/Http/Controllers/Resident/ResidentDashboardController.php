<?php

namespace App\Http\Controllers\Resident;

use App\Http\Controllers\Controller;
use App\Models\Household;
use App\Models\MissedPickupReport;
use App\Models\RoutePlan;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ResidentDashboardController extends Controller
{
    public function __invoke(Request $request)
    {
        $userId = $request->user()->id;

        $household = Household::with(['zone.barangays'])
            ->where('resident_user_id', $userId)
            ->first();

        if (! $household) {
            return redirect()->route('resident.location.create');
        }

        $upcoming = RoutePlan::with(['collector', 'zone'])
            ->where('zone_id', $household->zone_id)
            ->whereDate('route_date', '>=', today())
            ->orderBy('route_date')
            ->limit(5)
            ->get();

        $myReports = MissedPickupReport::where('resident_user_id', $userId)
            ->latest('report_datetime')
            ->limit(5)
            ->get();

        return Inertia::render('resident/dashboard', [
            'mapsApiKey' => config('services.google.maps_api_key'),
            'household' => [
                'address' => $household->address_line,
                'lat' => (float) $household->lat,
                'lng' => (float) $household->lng,
                'zone' => $household->zone ? [
                    'id' => $household->zone->id,
                    'name' => $household->zone->name,
                    'barangay' => $household->zone->barangayNames(),
                ] : null,
            ],
            'upcoming' => $upcoming->map(fn ($p) => [
                'id' => $p->id,
                'route_date' => $p->route_date?->toDateString(),
                'status' => $p->status,
                'collector' => $p->collector?->name,
            ]),
            'reports' => $myReports->map(fn ($r) => [
                'id' => $r->id,
                'description' => $r->description,
                'status' => $r->status,
                'report_datetime' => $r->report_datetime?->toDateTimeString(),
            ]),
        ]);
    }

    public function nearbyTruck(Request $request)
    {
        $household = Household::where('resident_user_id', $request->user()->id)->first();

        if (! $household || ! $household->lat || ! $household->lng) {
            return response()->json(['truck' => null]);
        }

        // Find any in-progress route in the resident's zone with a current location
        $route = RoutePlan::with('collector')
            ->where('zone_id', $household->zone_id)
            ->where('status', 'in_progress')
            ->whereNotNull('current_lat')
            ->whereNotNull('current_lng')
            ->latest('location_updated_at')
            ->first();

        if (! $route) {
            return response()->json(['truck' => null]);
        }

        $distanceKm = $this->haversine(
            (float) $household->lat,
            (float) $household->lng,
            (float) $route->current_lat,
            (float) $route->current_lng,
        );

        // Check if this resident's household is the next uncollected stop
        $route->load(['stops' => fn ($q) => $q->orderBy('stop_no'), 'stops.collection']);
        $isNextStop = false;
        $stopsAway = 0;

        // Find uncollected stops sorted by distance from truck
        $uncollected = $route->stops
            ->filter(fn ($s) => !$s->collection || $s->collection->status !== 'collected')
            ->sortBy(fn ($s) => $this->haversine(
                (float) $route->current_lat, (float) $route->current_lng,
                (float) $s->lat, (float) $s->lng,
            ))
            ->values();

        foreach ($uncollected as $i => $stop) {
            if ($stop->household_id === $household->id) {
                $isNextStop = ($i === 0);
                $stopsAway = $i;
                break;
            }
        }

        return response()->json([
            'truck' => [
                'route_id' => $route->id,
                'collector' => $route->collector?->name,
                'lat' => (float) $route->current_lat,
                'lng' => (float) $route->current_lng,
                'distance_km' => round($distanceKm, 3),
                'distance_m' => (int) round($distanceKm * 1000),
                'updated_at' => $route->location_updated_at?->toIso8601String(),
                'is_next_stop' => $isNextStop,
                'stops_away' => $stopsAway,
            ],
        ]);
    }

    private function haversine(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $R = 6371; // km
        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);
        $a = sin($dLat / 2) ** 2 + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLng / 2) ** 2;
        return $R * 2 * atan2(sqrt($a), sqrt(1 - $a));
    }
}
