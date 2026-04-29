<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Household;
use App\Models\RoutePlan;
use App\Models\RouteStop;
use App\Models\User;
use App\Models\Zone;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class RoutePlanController extends Controller
{
    public function index()
    {
        $plans = RoutePlan::with(['zone.barangays', 'collector', 'stops'])
            ->orderByDesc('route_date')
            ->orderByDesc('id')
            ->get()
            ->map(fn ($p) => [
                'id' => $p->id,
                'route_date' => $p->route_date?->toDateString(),
                'status' => $p->status,
                'zone' => $p->zone ? [
                    'id' => $p->zone->id,
                    'name' => $p->zone->name,
                    'barangay' => $p->zone->barangayNames(),
                ] : null,
                'collector' => $p->collector ? [
                    'id' => $p->collector->id,
                    'name' => $p->collector->name,
                ] : null,
                'stops_count' => $p->stops->count(),
            ]);

        return Inertia::render('admin/routes/index', ['plans' => $plans]);
    }

    public function create()
    {
        $zones = Zone::with('barangays')
            ->where('active', true)
            ->get()
            ->map(fn ($z) => [
                'id' => $z->id,
                'name' => $z->name,
                'barangay' => $z->barangayNames(),
            ]);

        $collectors = User::where('role', 'collector')
            ->where('status', 'active')
            ->get(['id', 'name']);

        return Inertia::render('admin/routes/create', [
            'zones' => $zones,
            'collectors' => $collectors,
            'mapsApiKey' => config('services.google.maps_api_key'),
        ]);
    }

    public function households(Zone $zone)
    {
        $households = Household::where('zone_id', $zone->id)
            ->whereNotNull('lat')
            ->whereNotNull('lng')
            ->get(['id', 'address_line', 'lat', 'lng']);

        return response()->json(['households' => $households]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'route_date' => ['required', 'date'],
            'zone_id' => ['required', 'exists:zones,id'],
            'collector_user_id' => ['nullable', 'exists:users,id'],
            'stops' => ['required', 'array', 'min:1'],
            'stops.*.household_id' => ['nullable', 'exists:households,id'],
            'stops.*.stop_address' => ['nullable', 'string', 'max:255'],
            'stops.*.lat' => ['required', 'numeric'],
            'stops.*.lng' => ['required', 'numeric'],
        ]);

        $truck = \App\Models\Truck::where('status', 'available')->first()
            ?? \App\Models\Truck::first();

        if (! $truck) {
            return back()->withErrors(['truck' => 'No trucks available. Run the TruckSeeder first.']);
        }

        $plan = DB::transaction(function () use ($data, $request, $truck) {
            $plan = RoutePlan::create([
                'route_date' => $data['route_date'],
                'zone_id' => $data['zone_id'],
                'truck_id' => $truck->id,
                'collector_user_id' => $data['collector_user_id'] ?? null,
                'status' => 'planned',
                'created_by' => $request->user()->id,
            ]);

            foreach ($data['stops'] as $i => $s) {
                RouteStop::create([
                    'route_plan_id' => $plan->id,
                    'stop_no' => $i + 1,
                    'household_id' => $s['household_id'] ?? null,
                    'stop_address' => $s['stop_address'] ?? null,
                    'lat' => $s['lat'],
                    'lng' => $s['lng'],
                ]);
            }

            return $plan;
        });

        return redirect()->route('admin.routes.show', $plan->id);
    }

    public function show(RoutePlan $route)
    {
        $route->load(['zone.barangays', 'collector', 'stops' => fn ($q) => $q->orderBy('stop_no')]);

        return Inertia::render('admin/routes/show', [
            'plan' => [
                'id' => $route->id,
                'route_date' => $route->route_date?->toDateString(),
                'status' => $route->status,
                'zone' => $route->zone ? [
                    'id' => $route->zone->id,
                    'name' => $route->zone->name,
                    'barangay' => $route->zone->barangayNames(),
                ] : null,
                'collector' => $route->collector ? [
                    'id' => $route->collector->id,
                    'name' => $route->collector->name,
                ] : null,
                'stops' => $route->stops->map(fn ($s) => [
                    'id' => $s->id,
                    'stop_no' => $s->stop_no,
                    'stop_address' => $s->stop_address,
                    'lat' => (float) $s->lat,
                    'lng' => (float) $s->lng,
                ]),
            ],
            'mapsApiKey' => config('services.google.maps_api_key'),
        ]);
    }
}
