<?php

namespace App\Http\Controllers\Resident;

use App\Http\Controllers\Controller;
use App\Models\Collection;
use App\Models\Household;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class PickupHistoryController extends Controller
{
    public function index(Request $request)
    {
        $household = Household::where('resident_user_id', $request->user()->id)->first();

        if (!$household) {
            return Inertia::render('resident/pickup-history', [
                'pickups' => [],
                'stats' => ['total' => 0, 'collected' => 0, 'skipped' => 0, 'failed' => 0],
            ]);
        }

        $collections = Collection::whereHas('routeStop', function ($q) use ($household) {
            $q->where('household_id', $household->id);
        })
            ->with(['routeStop.routePlan.collector', 'routeStop.routePlan.zone.barangays'])
            ->orderByDesc('collected_at')
            ->limit(50)
            ->get();

        $pickups = $collections->map(fn ($c) => [
            'id' => $c->id,
            'status' => $c->status,
            'collected_at' => $c->collected_at?->toDateTimeString(),
            'date' => $c->collected_at?->toDateString(),
            'time' => $c->collected_at?->format('g:i A'),
            'remarks' => $c->remarks,
            'collector' => $c->routeStop?->routePlan?->collector?->name,
            'zone' => $c->routeStop?->routePlan?->zone?->name,
            'route_date' => $c->routeStop?->routePlan?->route_date?->toDateString(),
            'proof_photo' => $c->proof_photo_url
                ? ($c->proof_photo_url && !str_starts_with($c->proof_photo_url, 'http')
                    ? Storage::disk('public')->url($c->proof_photo_url)
                    : $c->proof_photo_url)
                : null,
        ]);

        $stats = [
            'total' => $collections->count(),
            'collected' => $collections->where('status', 'collected')->count(),
            'skipped' => $collections->where('status', 'skipped')->count(),
            'failed' => $collections->where('status', 'failed')->count(),
        ];

        return Inertia::render('resident/pickup-history', [
            'pickups' => $pickups,
            'stats' => $stats,
        ]);
    }
}
