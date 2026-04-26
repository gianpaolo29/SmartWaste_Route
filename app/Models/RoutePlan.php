<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class RoutePlan extends Model
{
    protected $fillable = [
        'route_date',
        'zone_id',
        'truck_id',
        'collector_user_id',
        'status',
        'created_by',
        'current_lat',
        'current_lng',
        'location_updated_at',
        'started_at',
        'finished_at',
    ];

    protected $casts = [
        'route_date' => 'date',
        'current_lat' => 'float',
        'current_lng' => 'float',
        'location_updated_at' => 'datetime',
        'started_at' => 'datetime',
        'finished_at' => 'datetime',
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

    public function collectionReport(): HasOne
    {
        return $this->hasOne(CollectionReport::class);
    }
}
