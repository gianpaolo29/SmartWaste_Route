<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;

class User extends Authenticatable
{
    use HasFactory, Notifiable, TwoFactorAuthenticatable;

    // Based on smartwaste_route.sql (lowercase defaults)
    public const ROLE_ADMIN = 'admin';

    public const ROLE_COLLECTOR = 'collector';

    public const ROLE_RESIDENT = 'resident';

    public const STATUS_ACTIVE = 'active';

    public const STATUS_INACTIVE = 'inactive';

    /**
     * Columns in `users` table (smartwaste_route.sql):
     * id, name, email, email_verified_at, password,
     * two_factor_secret, two_factor_recovery_codes, two_factor_confirmed_at,
     * role, status, remember_token, created_at, updated_at
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'status',
    ];

    protected $hidden = [
        'password',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'two_factor_confirmed_at' => 'datetime',
        'password' => 'hashed',
    ];

    /* =========================
     | Relationships (SmartWaste)
     ========================= */

    public function households(): HasMany
    {
        return $this->hasMany(Household::class, 'resident_user_id');
    }

    public function assignedRoutePlans(): HasMany
    {
        return $this->hasMany(RoutePlan::class, 'collector_user_id');
    }

    public function createdRoutePlans(): HasMany
    {
        return $this->hasMany(RoutePlan::class, 'created_by');
    }

    public function publishedSchedules(): HasMany
    {
        return $this->hasMany(Schedule::class, 'published_by');
    }

    public function missedPickupReports(): HasMany
    {
        return $this->hasMany(MissedPickupReport::class, 'resident_user_id');
    }

    public function appNotifications(): HasMany
    {
        return $this->hasMany(AppNotification::class, 'user_id');
    }

    /* =========================
     | Helpers
     ========================= */

    public function isAdmin(): bool
    {
        return $this->role === self::ROLE_ADMIN;
    }

    public function isCollector(): bool
    {
        return $this->role === self::ROLE_COLLECTOR;
    }

    public function isResident(): bool
    {
        return $this->role === self::ROLE_RESIDENT;
    }

    public function isActive(): bool
    {
        return $this->status === self::STATUS_ACTIVE;
    }
}
