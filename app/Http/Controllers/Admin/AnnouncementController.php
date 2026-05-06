<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AppNotification;
use App\Models\Household;
use App\Models\Zone;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AnnouncementController extends Controller
{
    public function index()
    {
        $announcements = AppNotification::where('type', 'announcement')
            ->selectRaw('title, message, created_at, count(*) as recipient_count')
            ->groupBy('title', 'message', 'created_at')
            ->orderByDesc('created_at')
            ->limit(50)
            ->get()
            ->map(fn ($n) => [
                'title' => $n->title,
                'message' => $n->message,
                'recipient_count' => $n->recipient_count,
                'created_at' => $n->created_at->diffForHumans(),
                'date' => $n->created_at->toDateString(),
            ]);

        $zones = Zone::where('active', true)->orderBy('name')->get(['id', 'name']);

        return Inertia::render('admin/announcements/index', [
            'announcements' => $announcements,
            'zones' => $zones,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:200'],
            'message' => ['required', 'string', 'max:2000'],
            'zone_ids' => ['nullable', 'array'],
            'zone_ids.*' => ['exists:zones,id'],
        ]);

        $query = Household::query();
        if (!empty($data['zone_ids'])) {
            $query->whereIn('zone_id', $data['zone_ids']);
        }
        $residentIds = $query->pluck('resident_user_id')->filter()->unique();

        if ($residentIds->isEmpty()) {
            return redirect()->back()->withErrors(['zone_ids' => 'No residents found in selected zones.']);
        }

        $now = now();
        $notifications = $residentIds->map(fn ($userId) => [
            'user_id' => $userId,
            'title' => $data['title'],
            'message' => $data['message'],
            'type' => 'announcement',
            'is_read' => false,
            'created_at' => $now,
            'updated_at' => $now,
        ])->toArray();

        AppNotification::insert($notifications);

        return redirect()->back();
    }
}
