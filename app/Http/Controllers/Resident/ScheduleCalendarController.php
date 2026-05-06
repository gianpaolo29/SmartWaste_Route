<?php

namespace App\Http\Controllers\Resident;

use App\Http\Controllers\Controller;
use App\Models\Household;
use App\Models\RoutePlan;
use App\Models\Schedule;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ScheduleCalendarController extends Controller
{
    public function __invoke(Request $request)
    {
        $household = Household::where('resident_user_id', $request->user()->id)->first();

        if (!$household) {
            return redirect()->route('resident.location.create');
        }

        $month = (int) $request->query('month', now()->month);
        $year = (int) $request->query('year', now()->year);

        // Weekly schedule pattern
        $schedules = Schedule::where('zone_id', $household->zone_id)->get()
            ->map(fn ($s) => [
                'day_of_week' => $s->day_of_week,
                'start_time' => $s->start_time,
                'end_time' => $s->end_time,
            ]);

        // Actual route plans for this month
        $routes = RoutePlan::with('collector')
            ->where('zone_id', $household->zone_id)
            ->whereMonth('route_date', $month)
            ->whereYear('route_date', $year)
            ->orderBy('route_date')
            ->get()
            ->map(fn ($p) => [
                'id' => $p->id,
                'route_date' => $p->route_date->toDateString(),
                'status' => $p->status,
                'collector' => $p->collector?->name,
            ]);

        return Inertia::render('resident/schedule', [
            'schedules' => $schedules,
            'routes' => $routes,
            'month' => $month,
            'year' => $year,
            'zoneName' => $household->zone?->name,
        ]);
    }
}
