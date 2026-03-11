<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class MissedPickupReport extends Model
{
    protected $fillable = [
        'resident_user_id',
        'zone_id',
        'report_datetime',
        'location_text',
        'lat',
        'lng',
        'photo_url',
        'description',
        'status',
    ];

    protected $casts = [
        'report_datetime' => 'datetime',
        'lat' => 'float',
        'lng' => 'float',
    ];

    public function resident(): BelongsTo
    {
        return $this->belongsTo(User::class, 'resident_user_id');
    }

    public function zone(): BelongsTo
    {
        return $this->belongsTo(Zone::class);
    }

    public function ticket(): HasOne
    {
        return $this->hasOne(Ticket::class, 'report_id');
    }
}
