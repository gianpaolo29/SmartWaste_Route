<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CollectionReport extends Model
{
    protected $fillable = [
        'route_plan_id',
        'collector_user_id',
        'report_date',
        'mixed_waste',
        'biodegradable',
        'recyclable',
        'residual',
        'solid_waste',
        'notes',
    ];

    protected $casts = [
        'report_date' => 'date',
        'mixed_waste' => 'float',
        'biodegradable' => 'float',
        'recyclable' => 'float',
        'residual' => 'float',
        'solid_waste' => 'float',
    ];

    public function routePlan(): BelongsTo
    {
        return $this->belongsTo(RoutePlan::class);
    }

    public function collector(): BelongsTo
    {
        return $this->belongsTo(User::class, 'collector_user_id');
    }
}
