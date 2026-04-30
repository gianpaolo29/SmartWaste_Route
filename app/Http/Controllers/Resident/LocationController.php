<?php

namespace App\Http\Controllers\Resident;

use App\Http\Controllers\Controller;
use App\Models\Zone;
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
}
