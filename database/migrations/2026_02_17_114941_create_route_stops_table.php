<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class RouteStop extends Model
{
    protected $fillable = [
        'route_plan_id',
        'stop_no',
        'household_id',
        'stop_address',
        'lat',
        'lng',
        'planned_eta',
    ];

    protected $casts = [
        'stop_no' => 'integer',
        'lat' => 'float',
        'lng' => 'float',
    ];

    public function routePlan(): BelongsTo
    {
        return $this->belongsTo(RoutePlan::class);
    }

    public function household(): BelongsTo
    {
        return $this->belongsTo(Household::class);
    }

    public function collection(): HasOne
    {
        return $this->hasOne(CollectionLog::class, 'route_stop_id');
    }
}
