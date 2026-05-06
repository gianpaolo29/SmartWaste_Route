<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AuditLogController extends Controller
{
    public function index(Request $request)
    {
        $query = AuditLog::with('user')->orderByDesc('created_at');

        if ($request->filled('model_type')) {
            $query->where('model_type', 'like', '%' . class_basename($request->model_type) . '%');
        }
        if ($request->filled('action')) {
            $query->where('action', $request->action);
        }
        if ($request->filled('user_id')) {
            $query->where('user_id', $request->user_id);
        }
        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $logs = $query->paginate(50)->through(fn ($log) => [
            'id' => $log->id,
            'user' => $log->user?->name ?? 'System',
            'action' => $log->action,
            'model' => $log->model_label,
            'model_type' => class_basename($log->model_type),
            'old_values' => $log->old_values,
            'new_values' => $log->new_values,
            'ip' => $log->ip,
            'created_at' => $log->created_at->format('M d, Y g:i A'),
            'created_at_diff' => $log->created_at->diffForHumans(),
        ]);

        $modelTypes = AuditLog::distinct()->pluck('model_type')
            ->map(fn ($t) => class_basename($t))->unique()->sort()->values();

        return Inertia::render('admin/audit-logs/index', [
            'logs' => $logs,
            'modelTypes' => $modelTypes,
            'filters' => $request->only(['model_type', 'action', 'user_id', 'date_from', 'date_to']),
        ]);
    }
}
