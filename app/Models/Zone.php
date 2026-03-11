<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Zone extends Model
{
    protected $fillable = ['barangay_id', 'name', 'description', 'active'];

    protected $casts = [
        'active' => 'boolean',
    ];

    public function barangay(): BelongsTo
    {
        return $this->belongsTo(Barangay::class);
    }

    public function areas(): HasMany
    {
        return $this->hasMany(ZoneArea::class);
    }

    public function households(): HasMany
    {
        return $this->hasMany(Household::class);
    }

    public function schedules(): HasMany
    {
        return $this->hasMany(Schedule::class);
    }

    public function routePlans(): HasMany
    {
        return $this->hasMany(RoutePlan::class);
    }

    public function missedPickupReports(): HasMany
    {
        return $this->hasMany(MissedPickupReport::class);
    }
}
