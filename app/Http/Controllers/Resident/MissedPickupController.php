<?php

namespace App\Http\Controllers\Resident;

use App\Http\Controllers\Controller;
use App\Models\Household;
use App\Models\MissedPickupReport;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MissedPickupController extends Controller
{
    public function index(Request $request)
    {
        $reports = MissedPickupReport::where('resident_user_id', $request->user()->id)
            ->latest('report_datetime')
            ->get()
            ->map(fn ($r) => [
                'id' => $r->id,
                'description' => $r->description,
                'location_text' => $r->location_text,
                'status' => $r->status,
                'report_datetime' => $r->report_datetime?->toDateTimeString(),
            ]);

        return Inertia::render('resident/missed-pickup', ['reports' => $reports]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'description' => ['required', 'string', 'min:10', 'max:1000'],
        ]);

        $household = Household::where('resident_user_id', $request->user()->id)->firstOrFail();

        MissedPickupReport::create([
            'resident_user_id' => $request->user()->id,
            'zone_id' => $household->zone_id,
            'report_datetime' => now(),
            'location_text' => $household->address_line,
            'lat' => $household->lat,
            'lng' => $household->lng,
            'description' => $data['description'],
            'status' => 'open',
        ]);

        return redirect()->route('resident.missed-pickup.index');
    }
}
