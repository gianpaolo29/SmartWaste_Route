<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Truck extends Model
{
    protected $fillable = ['plate_no', 'capacity_kg', 'status', 'collector_user_id'];

    protected $casts = [
        'capacity_kg' => 'integer',
    ];

    public function collector(): BelongsTo
    {
        return $this->belongsTo(User::class, 'collector_user_id');
    }

    public function routePlans(): HasMany
    {
        return $this->hasMany(RoutePlan::class);
    }
}
