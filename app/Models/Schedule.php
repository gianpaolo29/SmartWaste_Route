<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Schedule extends Model
{
    use \App\Traits\Auditable;

    protected $fillable = [
        'zone_id',
        'day_of_week',
        'start_time',
        'end_time',
        'published_by',
    ];

    protected $casts = [
        'day_of_week' => 'integer',
    ];

    public function zone(): BelongsTo
    {
        return $this->belongsTo(Zone::class);
    }

    public function publisher(): BelongsTo
    {
        return $this->belongsTo(User::class, 'published_by');
    }
}
