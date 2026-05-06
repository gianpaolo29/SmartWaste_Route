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
        $plans = RoutePlan::with(['zone.barangays', 'collector', 'truck', 'stops'])
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
                'truck' => $p->truck ? [
                    'plate_no' => $p->truck->plate_no,
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

        // Only show collectors that have an available truck assigned
        $collectors = \App\Models\Truck::where('status', 'available')
            ->whereNotNull('collector_user_id')
            ->with('collector')
            ->orderBy('plate_no')
            ->get()
            ->filter(fn ($t) => $t->collector && $t->collector->status === 'active')
            ->map(fn ($t) => [
                'id' => $t->collector->id,
                'name' => $t->collector->name,
                'truck_id' => $t->id,
                'truck_plate' => $t->plate_no,
                'truck_capacity' => $t->capacity_kg,
            ])
            ->values();

        return Inertia::render('admin/routes/create', [
            'zones' => $zones,
            'collectors' => $collectors,
            'mapsApiKey' => config('services.google.maps_api_key'),
        ]);
    }

    public function households(Zone $zone)
    {
        $barangayIds = $zone->barangays()->pluck('barangays.id');

        $households = Household::where(function ($q) use ($zone, $barangayIds) {
                $q->where('zone_id', $zone->id)
                  ->orWhereIn('barangay_id', $barangayIds);
            })
            ->whereNotNull('lat')
            ->whereNotNull('lng')
            ->get(['id', 'address_line', 'lat', 'lng']);

        return response()->json(['households' => $households]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'route_date' => ['required', 'date', 'after_or_equal:today'],
            'zone_id' => ['required', 'exists:zones,id'],
            'collector_user_id' => ['required', 'exists:users,id'],
            'truck_id' => ['required', 'exists:trucks,id'],
            'stops' => ['required', 'array', 'min:1'],
            'stops.*.household_id' => ['nullable', 'exists:households,id'],
            'stops.*.stop_address' => ['nullable', 'string', 'max:255'],
            'stops.*.lat' => ['required', 'numeric'],
            'stops.*.lng' => ['required', 'numeric'],
        ]);

        $truck = \App\Models\Truck::find($data['truck_id']);

        if (! $truck || $truck->status !== 'available') {
            return back()->withErrors(['truck_id' => 'Selected truck is not available.']);
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
        $route->load(['zone.barangays', 'collector', 'stops' => fn ($q) => $q->orderBy('stop_no'), 'stops.collection']);

        $collectors = User::where('role', 'collector')
            ->where('status', 'active')
            ->get(['id', 'name']);

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
                    'collection_status' => $s->collection?->status,
                ]),
            ],
            'collectors' => $collectors,
            'mapsApiKey' => config('services.google.maps_api_key'),
        ]);
    }

    public function update(Request $request, RoutePlan $route)
    {
        $data = $request->validate([
            'route_date' => ['sometimes', 'date'],
            'collector_user_id' => ['nullable', 'exists:users,id'],
            'status' => ['sometimes', 'in:planned,cancelled'],
        ]);

        // Only allow editing planned routes
        if ($route->status !== 'planned' && !isset($data['status'])) {
            return back()->withErrors(['status' => 'Only planned routes can be edited.']);
        }

        $route->update($data);

        return back();
    }

    public function destroy(RoutePlan $route)
    {
        // Prevent deleting routes that are in progress
        if ($route->status === 'in_progress') {
            return back()->withErrors(['status' => 'Cannot delete a route that is in progress.']);
        }

        DB::transaction(function () use ($route) {
            $route->stops()->delete();
            $route->delete();
        });

        return redirect()->route('admin.routes.index');
    }
}
