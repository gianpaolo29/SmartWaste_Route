<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Zone extends Model
{
    use \App\Traits\Auditable;

    protected $fillable = ['name', 'description', 'active'];

    protected $casts = [
        'active' => 'boolean',
    ];

    public function barangays(): BelongsToMany
    {
        return $this->belongsToMany(Barangay::class)->withTimestamps();
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

    /**
     * Helper: comma-separated barangay names for display.
     */
    public function barangayNames(): string
    {
        return $this->barangays->pluck('name')->join(', ');
    }
}
