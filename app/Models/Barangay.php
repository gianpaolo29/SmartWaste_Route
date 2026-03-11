<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Barangay extends Model
{
    protected $fillable = ['name'];

    public function zones(): HasMany
    {
        return $this->hasMany(Zone::class);
    }

    public function households(): HasMany
    {
        return $this->hasMany(Household::class);
    }
}
