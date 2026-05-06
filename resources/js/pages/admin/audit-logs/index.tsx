import { Head, router } from '@inertiajs/react';
import { ScrollText, ChevronDown, ChevronRight, Filter } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminLayout from '@/layouts/admin-layout';
import type { BreadcrumbItem } from '@/types';

type Log = {
    id: number;
    user: string;
    action: string;
    model: string;
    model_type: string;
    old_values: Record<string, unknown> | null;
    new_values: Record<string, unknown> | null;
    ip: string | null;
    created_at: string;
    created_at_diff: string;
};

type Props = {
    logs: { data: Log[]; current_page: number; last_page: number; next_page_url: string | null; prev_page_url: string | null };
    modelTypes: string[];
    filters: Record<string, string>;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/admin/dashboard' },
    { title: 'Audit Log', href: '/admin/audit-logs' },
];

const actionColors: Record<string, string> = {
    created: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
    updated: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
    deleted: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
};

const inputCls = 'rounded-xl border border-neutral-200 bg-neutral-50/50 px-3 py-2 text-sm outline-none transition-all focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/10 dark:border-neutral-700 dark:bg-neutral-800/50 dark:text-white';

export default function AuditLogs({ logs, modelTypes, filters }: Props) {
    const [expanded, setExpanded] = useState<number | null>(null);
    const [showFilters, setShowFilters] = useState(false);
    const [localFilters, setLocalFilters] = useState(filters);

    const applyFilters = () => {
        const clean = Object.fromEntries(Object.entries(localFilters).filter(([, v]) => v));
        router.get('/admin/audit-logs', clean, { preserveState: true });
    };

    const clearFilters = () => {
        setLocalFilters({});
        router.get('/admin/audit-logs', {}, { preserveState: true });
    };

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Audit Log" />
            <div className="space-y-4 p-4 sm:p-5">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">Audit Log</h1>
                        <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">Track all system changes</p>
                    </div>
                    <button onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-xs font-semibold text-neutral-600 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                        <Filter size={14} /> Filters
                    </button>
                </div>

                {/* Filters */}
                <AnimatePresence>
                    {showFilters && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                            <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-neutral-200/60 bg-white p-4 shadow-sm dark:border-neutral-700/60 dark:bg-neutral-900">
                                <div>
                                    <label className="mb-1 block text-[11px] font-semibold text-neutral-400">Model</label>
                                    <select value={localFilters.model_type ?? ''} onChange={(e) => setLocalFilters({ ...localFilters, model_type: e.target.value })} className={inputCls}>
                                        <option value="">All</option>
                                        {modelTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="mb-1 block text-[11px] font-semibold text-neutral-400">Action</label>
                                    <select value={localFilters.action ?? ''} onChange={(e) => setLocalFilters({ ...localFilters, action: e.target.value })} className={inputCls}>
                                        <option value="">All</option>
                                        <option value="created">Created</option>
                                        <option value="updated">Updated</option>
                                        <option value="deleted">Deleted</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="mb-1 block text-[11px] font-semibold text-neutral-400">From</label>
                                    <input type="date" value={localFilters.date_from ?? ''} onChange={(e) => setLocalFilters({ ...localFilters, date_from: e.target.value })} className={inputCls} />
                                </div>
                                <div>
                                    <label className="mb-1 block text-[11px] font-semibold text-neutral-400">To</label>
                                    <input type="date" value={localFilters.date_to ?? ''} onChange={(e) => setLocalFilters({ ...localFilters, date_to: e.target.value })} className={inputCls} />
                                </div>
                                <button onClick={applyFilters} className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700">Apply</button>
                                <button onClick={clearFilters} className="rounded-xl border border-neutral-200 px-4 py-2 text-xs font-medium text-neutral-500 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-400">Clear</button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Table */}
                <div className="overflow-hidden rounded-2xl border border-neutral-200/60 bg-white shadow-sm dark:border-neutral-700/60 dark:bg-neutral-900">
                    {logs.data.length === 0 ? (
                        <div className="px-5 py-12 text-center">
                            <ScrollText size={32} className="mx-auto text-neutral-300 dark:text-neutral-600" />
                            <p className="mt-3 text-sm text-neutral-400">No audit logs found</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                            {logs.data.map((log) => (
                                <div key={log.id}>
                                    <button onClick={() => setExpanded(expanded === log.id ? null : log.id)}
                                        className="flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                                        <ChevronRight size={14} className={`shrink-0 text-neutral-400 transition-transform ${expanded === log.id ? 'rotate-90' : ''}`} />
                                        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${actionColors[log.action] ?? 'bg-neutral-100 text-neutral-500'}`}>{log.action}</span>
                                        <span className="shrink-0 rounded-lg bg-neutral-100 px-2 py-0.5 text-[11px] font-semibold text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">{log.model_type}</span>
                                        <span className="min-w-0 flex-1 truncate text-sm text-neutral-700 dark:text-neutral-300">{log.model}</span>
                                        <span className="shrink-0 text-xs text-neutral-400">{log.user}</span>
                                        <span className="hidden shrink-0 text-[11px] text-neutral-400 sm:block">{log.created_at_diff}</span>
                                    </button>

                                    <AnimatePresence>
                                        {expanded === log.id && (
                                            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                                                <div className="border-t border-neutral-100 bg-neutral-50/50 px-5 py-4 dark:border-neutral-800 dark:bg-neutral-800/30">
                                                    <div className="grid gap-4 sm:grid-cols-2">
                                                        {log.old_values && (
                                                            <div>
                                                                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-red-500">Old Values</p>
                                                                <pre className="max-h-48 overflow-auto rounded-xl bg-white p-3 text-xs text-neutral-600 dark:bg-neutral-900 dark:text-neutral-400">{JSON.stringify(log.old_values, null, 2)}</pre>
                                                            </div>
                                                        )}
                                                        {log.new_values && (
                                                            <div>
                                                                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-600">New Values</p>
                                                                <pre className="max-h-48 overflow-auto rounded-xl bg-white p-3 text-xs text-neutral-600 dark:bg-neutral-900 dark:text-neutral-400">{JSON.stringify(log.new_values, null, 2)}</pre>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="mt-3 flex items-center gap-4 text-[11px] text-neutral-400">
                                                        <span>{log.created_at}</span>
                                                        {log.ip && <span>IP: {log.ip}</span>}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {logs.last_page > 1 && (
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-neutral-400">Page {logs.current_page} of {logs.last_page}</span>
                        <div className="flex gap-2">
                            {logs.prev_page_url && <button onClick={() => router.get(logs.prev_page_url!)} className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-400">Previous</button>}
                            {logs.next_page_url && <button onClick={() => router.get(logs.next_page_url!)} className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-400">Next</button>}
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
