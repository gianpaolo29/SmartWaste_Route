<?php

namespace App\Traits;

use App\Models\AuditLog;

trait Auditable
{
    public static function bootAuditable(): void
    {
        static::created(function ($model) {
            static::logAudit($model, 'created', null, $model->getAttributes());
        });

        static::updated(function ($model) {
            $dirty = $model->getDirty();
            if (empty($dirty)) return;

            $old = collect($model->getOriginal())->only(array_keys($dirty))->toArray();
            static::logAudit($model, 'updated', $old, $dirty);
        });

        static::deleted(function ($model) {
            static::logAudit($model, 'deleted', $model->getAttributes(), null);
        });
    }

    protected static function logAudit($model, string $action, ?array $old, ?array $new): void
    {
        // Skip logging password hashes and remember tokens
        $hidden = ['password', 'remember_token', 'two_factor_secret', 'two_factor_recovery_codes'];
        $filter = fn (?array $values) => $values ? collect($values)->except($hidden)->toArray() : null;

        try {
            AuditLog::create([
                'user_id' => auth()->id(),
                'action' => $action,
                'model_type' => get_class($model),
                'model_id' => $model->getKey(),
                'old_values' => $filter($old),
                'new_values' => $filter($new),
                'ip' => request()?->ip(),
                'created_at' => now(),
            ]);
        } catch (\Throwable) {
            // Don't break the app if audit logging fails
        }
    }
}
