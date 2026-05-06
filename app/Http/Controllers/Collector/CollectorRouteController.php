<?php

namespace App\Http\Controllers\Collector;

use App\Http\Controllers\Controller;
use App\Models\AppNotification;
use App\Models\Collection;
use App\Models\MissedPickupReport;
use App\Models\RoutePlan;
use App\Models\RouteStop;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class CollectorRouteController extends Controller
{
    public function index(Request $request)
    {
        $userId = $request->user()->id;
        $status = $request->query('status');

        $mapRoute = fn ($p) => [
            'id' => $p->id,
            'route_date' => $p->route_date?->toDateString(),
            'status' => $p->status,
            'zone' => $p->zone ? [
                'name' => $p->zone->name,
                'barangay' => $p->zone->barangayNames(),
            ] : null,
            'stops_count' => $p->stops->count(),
        ];

        // Today's routes
        $today = RoutePlan::with(['zone.barangays', 'stops'])
            ->where('collector_user_id', $userId)
            ->whereDate('route_date', today())
            ->orderBy('id')
            ->get()
            ->map($mapRoute);

        // Upcoming routes
        $upcoming = RoutePlan::with(['zone.barangays', 'stops'])
            ->where('collector_user_id', $userId)
            ->whereDate('route_date', '>', today())
            ->orderBy('route_date')
            ->limit(10)
            ->get()
            ->map($mapRoute);

        // All routes (with optional filter)
        $q = RoutePlan::with(['zone.barangays', 'stops'])
            ->where('collector_user_id', $userId)
            ->orderByDesc('route_date')
            ->orderByDesc('id');

        if ($status) {
            $q->where('status', $status);
        }

        $routes = $q->get()->map($mapRoute);

        return Inertia::render('collector/routes/index', [
            'today' => $today,
            'upcoming' => $upcoming,
            'routes' => $routes,
            'filter' => $status,
        ]);
    }

    public function collect(Request $request, RoutePlan $route, RouteStop $stop)
    {
        abort_unless($route->collector_user_id === $request->user()->id, 403);
        abort_unless($stop->route_plan_id === $route->id, 404);

        $data = $request->validate([
            'status' => ['required', 'in:collected,skipped,failed'],
            'remarks' => ['nullable', 'string', 'max:500'],
            'gps_lat' => ['nullable', 'numeric'],
            'gps_lng' => ['nullable', 'numeric'],
            'proof_photo' => ['nullable', 'image', 'max:5120'],
        ]);

        $photoPath = null;
        if ($request->hasFile('proof_photo')) {
            $photoPath = $request->file('proof_photo')->store('collection-proofs', 'public');
        }

        Collection::updateOrCreate(
            ['route_stop_id' => $stop->id],
            [
                'collected_at' => now(),
                'status' => $data['status'],
                'remarks' => $data['remarks'] ?? null,
                'gps_lat' => $data['gps_lat'] ?? null,
                'gps_lng' => $data['gps_lng'] ?? null,
                'proof_photo_url' => $photoPath,
            ],
        );

        // Send collection confirmation notification to resident
        if ($data['status'] === 'collected') {
            $resident = $stop->household?->resident;
            if ($resident) {
                AppNotification::create([
                    'user_id' => $resident->id,
                    'title' => 'Waste Collected',
                    'message' => 'Your waste was collected at ' . now()->format('g:i A') . '. Thank you for keeping your community clean!',
                    'type' => 'collection_confirmation',
                    'is_read' => false,
                ]);
            }
        }

        return response()->json(['ok' => true]);
    }

    public function reportMissed(Request $request, RoutePlan $route, RouteStop $stop)
    {
        abort_unless($route->collector_user_id === $request->user()->id, 403);
        abort_unless($stop->route_plan_id === $route->id, 404);

        $data = $request->validate([
            'description' => ['required', 'string', 'max:1000'],
        ]);

        MissedPickupReport::create([
            'resident_user_id' => $stop->household?->resident_user_id,
            'zone_id' => $route->zone_id,
            'report_datetime' => now(),
            'location_text' => $stop->stop_address,
            'lat' => $stop->lat,
            'lng' => $stop->lng,
            'description' => $data['description'],
            'status' => 'open',
        ]);

        // Also mark the stop as failed
        Collection::updateOrCreate(
            ['route_stop_id' => $stop->id],
            [
                'collected_at' => now(),
                'status' => 'failed',
                'remarks' => $data['description'],
            ],
        );

        return response()->json(['ok' => true]);
    }
}
