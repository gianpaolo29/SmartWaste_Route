<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Ticket extends Model
{
    protected $fillable = [
        'report_id',
        'current_status',
        'assigned_route_plan_id',
        'verified_by',
        'resolved_by',
        'closed_at',
    ];

    protected $casts = [
        'closed_at' => 'datetime',
    ];

    public function report(): BelongsTo
    {
        return $this->belongsTo(MissedPickupReport::class, 'report_id');
    }

    public function assignedRoutePlan(): BelongsTo
    {
        return $this->belongsTo(RoutePlan::class, 'assigned_route_plan_id');
    }

    public function verifier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by');
    }

    public function resolver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'resolved_by');
    }
}
