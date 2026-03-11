<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Truck extends Model
{
    protected $fillable = ['plate_no', 'capacity_kg', 'status'];

    protected $casts = [
        'capacity_kg' => 'integer',
    ];

    public function routePlans(): HasMany
    {
        return $this->hasMany(RoutePlan::class);
    }
}
