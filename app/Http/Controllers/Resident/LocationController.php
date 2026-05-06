<?php

namespace App\Http\Controllers\Resident;

use App\Http\Controllers\Controller;
use App\Models\Barangay;
use App\Models\Zone;
use App\Support\TuyBarangayBoundaries;
use Illuminate\Http\Request;
use Inertia\Inertia;

class LocationController extends Controller
{
    public function create(Request $request)
    {
        $zones = Zone::with('barangays')
            ->where('active', true)
            ->get()
            ->map(fn ($z) => [
                'id' => $z->id,
                'name' => $z->name,
                'barangay' => $z->barangayNames(),
            ]);

        return Inertia::render('resident/location/setup', [
            'zones' => $zones,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'zone_id' => ['required', 'exists:zones,id'],
            'address_line' => ['required', 'string', 'max:255'],
            'lat' => ['nullable', 'numeric', 'between:-90,90'],
            'lng' => ['nullable', 'numeric', 'between:-180,180'],
        ]);

        $zone = Zone::with('barangays')->findOrFail($data['zone_id']);

        \App\Models\Household::updateOrCreate(
            ['resident_user_id' => $request->user()->id],
            [
                'zone_id' => $zone->id,
                'barangay_id' => $zone->barangays->first()?->id,
                'address_line' => $data['address_line'],
                'lat' => $data['lat'] ?? null,
                'lng' => $data['lng'] ?? null,
            ]
        );

        return redirect()->route('resident.dashboard');
    }

    /**
     * Auto-detect barangay and zone from lat/lng using nearest centroid.
     */
    public function detectZone(Request $request)
    {
        $data = $request->validate([
            'lat' => ['required', 'numeric', 'between:-90,90'],
            'lng' => ['required', 'numeric', 'between:-180,180'],
        ]);

        $lat = $data['lat'];
        $lng = $data['lng'];

        // Find nearest barangay by centroid distance
        $nearest = null;
        $minDist = PHP_FLOAT_MAX;

        foreach (TuyBarangayBoundaries::CENTROIDS as $name => $coords) {
            $dist = sqrt(pow($lat - $coords[0], 2) + pow($lng - $coords[1], 2));
            if ($dist < $minDist) {
                $minDist = $dist;
                $nearest = $name;
            }
        }

        if (!$nearest) {
            return response()->json(['error' => 'Could not detect barangay'], 404);
        }

        // Find the barangay in DB
        $barangay = Barangay::whereRaw('LOWER(name) = ?', [strtolower($nearest)])->first();

        if (!$barangay) {
            return response()->json([
                'barangay' => $nearest,
                'zone' => null,
                'error' => 'Barangay found but not configured in the system',
            ]);
        }

        // Find zone that includes this barangay
        $zone = $barangay->zones()->where('active', true)->first();

        return response()->json([
            'barangay' => $nearest,
            'barangay_id' => $barangay->id,
            'zone' => $zone ? [
                'id' => $zone->id,
                'name' => $zone->name,
            ] : null,
        ]);
    }
}
