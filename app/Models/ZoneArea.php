<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ZoneArea extends Model
{
    protected $fillable = ['zone_id', 'area_name', 'notes'];

    public function zone(): BelongsTo
    {
        return $this->belongsTo(Zone::class);
    }
}
