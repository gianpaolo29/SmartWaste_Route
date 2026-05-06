<?php

namespace App\Http\Controllers\Collector;

use App\Http\Controllers\Controller;
use App\Models\CollectionReport;
use App\Models\Truck;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CollectorAccountController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        $reportsCount = CollectionReport::where('collector_user_id', $user->id)->count();
        $completedRoutes = $user->assignedRoutePlans()->where('status', 'completed')->count();

        $truck = Truck::where('collector_user_id', $user->id)->first();

        return Inertia::render('collector/account', [
            'stats' => [
                'reports' => $reportsCount,
                'completed_routes' => $completedRoutes,
            ],
            'truck' => $truck ? [
                'id' => $truck->id,
                'plate_no' => $truck->plate_no,
                'capacity_kg' => $truck->capacity_kg,
                'status' => $truck->status,
            ] : null,
        ]);
    }
}
