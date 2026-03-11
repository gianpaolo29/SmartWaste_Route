<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Collection extends Model
{
    protected $table = 'collections';

    protected $fillable = [
        'route_stop_id',
        'collected_at',
        'status',
        'proof_photo_url',
        'gps_lat',
        'gps_lng',
        'remarks',
    ];

    protected $casts = [
        'collected_at' => 'datetime',
        'gps_lat' => 'float',
        'gps_lng' => 'float',
    ];

    public function routeStop(): BelongsTo
    {
        return $this->belongsTo(RouteStop::class);
    }
}
