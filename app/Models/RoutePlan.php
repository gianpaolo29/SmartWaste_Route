<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RoutePlan extends Model
{
    protected $fillable = [
        'route_date',
        'zone_id',
        'truck_id',
        'collector_user_id',
        'status',
        'created_by',
    ];

    protected $casts = [
        'route_date' => 'date',
    ];

    public function zone(): BelongsTo
    {
        return $this->belongsTo(Zone::class);
    }

    public function truck(): BelongsTo
    {
        return $this->belongsTo(Truck::class);
    }

    public function collector(): BelongsTo
    {
        return $this->belongsTo(User::class, 'collector_user_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function stops(): HasMany
    {
        return $this->hasMany(RouteStop::class);
    }

    public function tickets(): HasMany
    {
        return $this->hasMany(Ticket::class, 'assigned_route_plan_id');
    }
}
