<?php

namespace App\Http\Controllers\Collector;

use App\Http\Controllers\Controller;
use App\Models\RoutePlan;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RouteTrackingController extends Controller
{
    public function show(Request $request, RoutePlan $route)
    {
        abort_unless($route->collector_user_id === $request->user()->id, 403);

        $route->load([
            'zone.barangays',
            'stops' => fn ($q) => $q->orderBy('stop_no'),
            'stops.collection',
        ]);

        return Inertia::render('collector/route', [
            'plan' => [
                'id' => $route->id,
                'route_date' => $route->route_date?->toDateString(),
                'status' => $route->status,
                'zone' => $route->zone ? [
                    'name' => $route->zone->name,
                    'barangay' => $route->zone->barangayNames(),
                ] : null,
                'stops' => $route->stops->map(fn ($s) => [
                    'id' => $s->id,
                    'stop_no' => $s->stop_no,
                    'stop_address' => $s->stop_address,
                    'lat' => (float) $s->lat,
                    'lng' => (float) $s->lng,
                    'collection_status' => $s->collection?->status,
                ]),
            ],
            'mapsApiKey' => env('VITE_GOOGLE_MAPS_API_KEY'),
        ]);
    }

    public function start(Request $request, RoutePlan $route)
    {
        abort_unless($route->collector_user_id === $request->user()->id, 403);

        $route->update([
            'status' => 'in_progress',
            'started_at' => now(),
        ]);

        return response()->json(['ok' => true]);
    }

    public function ping(Request $request, RoutePlan $route)
    {
        abort_unless($route->collector_user_id === $request->user()->id, 403);

        $data = $request->validate([
            'lat' => ['required', 'numeric', 'between:-90,90'],
            'lng' => ['required', 'numeric', 'between:-180,180'],
        ]);

        $route->update([
            'current_lat' => $data['lat'],
            'current_lng' => $data['lng'],
            'location_updated_at' => now(),
        ]);

        return response()->json(['ok' => true]);
    }

    public function finish(Request $request, RoutePlan $route)
    {
        abort_unless($route->collector_user_id === $request->user()->id, 403);

        $route->update([
            'status' => 'completed',
            'finished_at' => now(),
        ]);

        return response()->json(['ok' => true]);
    }

    // Public-ish endpoint admin polls for live location
    public function location(RoutePlan $route)
    {
        return response()->json([
            'lat' => $route->current_lat ? (float) $route->current_lat : null,
            'lng' => $route->current_lng ? (float) $route->current_lng : null,
            'updated_at' => $route->location_updated_at?->toIso8601String(),
            'status' => $route->status,
            'started_at' => $route->started_at?->toIso8601String(),
            'finished_at' => $route->finished_at?->toIso8601String(),
        ]);
    }
}
