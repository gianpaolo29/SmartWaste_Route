import { Head, router } from '@inertiajs/react';
import { useState, useEffect, useMemo } from 'react';
import { AlertTriangle, Clock, CheckCircle2, Search, ChevronLeft, ChevronRight, MapPin, User, FileText, Filter } from 'lucide-react';
import { motion } from 'framer-motion';
import AdminLayout from '@/layouts/admin-layout';
import { toast } from '@/lib/notify';
import type { BreadcrumbItem } from '@/types';

type Item = {
    id: number;
    description: string;
    status: string;
    report_datetime: string | null;
    location_text: string | null;
    resident: string | null;
    zone: { name: string; barangay: string | null } | null;
};

type Stats = {
    total: number;
    open: number;
    in_progress: number;
    resolved: number;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/admin/dashboard' },
    { title: 'Reports', href: '/admin/reports' },
];

const fade = (delay = 0) => ({
    initial: { opacity: 0, y: 12 } as const,
    animate: { opacity: 1, y: 0 } as const,
    transition: { duration: 0.3, delay },
});

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string; icon: typeof AlertTriangle }> = {
    open: { label: 'Open', bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-400', dot: 'bg-amber-500', icon: AlertTriangle },
    in_progress: { label: 'In Progress', bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-400', dot: 'bg-blue-500 animate-pulse', icon: Clock },
    resolved: { label: 'Resolved', bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500', icon: CheckCircle2 },
};

const STATUS_OPTIONS = ['open', 'in_progress', 'resolved'];

export default function ReportsIndex({ items, stats, filter }: { items: Item[]; stats: Stats; filter: string }) {
    const [updatingId, setUpdatingId] = useState<number | null>(null);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const perPage = 10;

    const filtered = useMemo(() => {
        if (!search) return items;
        const q = search.toLowerCase();
        return items.filter((r) =>
            (r.resident?.toLowerCase().includes(q)) ||
            (r.zone?.name.toLowerCase().includes(q)) ||
            (r.zone?.barangay?.toLowerCase().includes(q)) ||
            (r.description.toLowerCase().includes(q)) ||
            (r.location_text?.toLowerCase().includes(q))
        );
    }, [items, search]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
    const currentPage = Math.min(page, totalPages);
    const paginated = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

    useEffect(() => { setPage(1); }, [search]);

    const updateStatus = (id: number, status: string) => {
        setUpdatingId(id);
        router.put(`/admin/reports/${id}`, { status }, {
            preserveScroll: true,
            onFinish: () => setUpdatingId(null),
            onSuccess: () => toast('success', `Report marked as ${status.replace('_', ' ')}`),
        });
    };

    const statCards = [
        { label: 'Total Reports', value: stats.total, icon: FileText, bg: 'bg-neutral-50 dark:bg-neutral-950/40', text: 'text-neutral-600 dark:text-neutral-400', ring: 'ring-neutral-500/20' },
        { label: 'Open', value: stats.open, icon: AlertTriangle, bg: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-600 dark:text-amber-400', ring: 'ring-amber-500/20' },
        { label: 'In Progress', value: stats.in_progress, icon: Clock, bg: 'bg-blue-50 dark:bg-blue-950/40', text: 'text-blue-600 dark:text-blue-400', ring: 'ring-blue-500/20' },
        { label: 'Resolved', value: stats.resolved, icon: CheckCircle2, bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-600 dark:text-emerald-400', ring: 'ring-emerald-500/20' },
    ];

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Missed Pickup Reports" />
            <div className="space-y-4 p-4 sm:p-5">
                {/* Header */}
                <motion.div {...fade()} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">Missed Pickup Reports</h1>
                        <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">Monitor and resolve resident complaints</p>
                    </div>
                    {/* Status filter pills */}
                    <div className="flex items-center gap-0.5 rounded-xl border border-neutral-200 bg-neutral-50/50 p-0.5 dark:border-neutral-700 dark:bg-neutral-800/50">
                        {([
                            { label: 'All', value: '' },
                            { label: 'Open', value: 'open' },
                            { label: 'In Progress', value: 'in_progress' },
                            { label: 'Resolved', value: 'resolved' },
                        ] as const).map((f) => (
                            <button key={f.value || 'all'}
                                onClick={() => router.get('/admin/reports', f.value ? { status: f.value } : {}, { preserveState: false })}
                                className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all ${(filter ?? '') === f.value
                                    ? 'bg-white text-amber-700 shadow-sm dark:bg-neutral-700 dark:text-amber-400'
                                    : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300'}`}>
                                {f.label}
                            </button>
                        ))}
                    </div>
                </motion.div>

                {/* Stat Cards */}
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    {statCards.map(({ label, value, icon: Icon, bg, text, ring }, i) => (
                        <motion.div key={label} {...fade(0.04 + i * 0.03)}
                            className="group rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900">
                            <div className="flex items-center justify-between">
                                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${bg} ring-4 ${ring} transition-transform group-hover:scale-110`}>
                                    <Icon size={18} className={text} />
                                </div>
                                <p className="text-2xl font-bold text-neutral-900 dark:text-white">{value}</p>
                            </div>
                            <p className="mt-3 text-[11px] font-medium text-neutral-500 dark:text-neutral-400">{label}</p>
                        </motion.div>
                    ))}
                </div>

                {/* Table */}
                <motion.div {...fade(0.2)}>
                    <div className="overflow-hidden rounded-2xl border border-neutral-200/60 bg-white shadow-lg shadow-black/[0.03] dark:border-neutral-700/60 dark:bg-neutral-900">
                        {/* Table header */}
                        <div className="flex flex-col gap-3 border-b border-neutral-100 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between dark:border-neutral-800">
                            <div className="flex items-center gap-2.5">
                                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-sm shadow-amber-500/20">
                                    <AlertTriangle size={14} className="text-white" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-bold text-neutral-900 dark:text-white">All Reports</h2>
                                    <p className="text-[11px] text-neutral-400">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</p>
                                </div>
                            </div>
                            <div className="relative">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                                <input type="text" placeholder="Search reports..." value={search} onChange={(e) => setSearch(e.target.value)}
                                    className="w-full rounded-xl border border-neutral-200 bg-neutral-50/50 py-2 pl-8 pr-3 text-xs outline-none transition-all placeholder:text-neutral-400 focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-500/10 sm:w-56 dark:border-neutral-700 dark:bg-neutral-800/50 dark:text-neutral-300 dark:focus:border-amber-600" />
                            </div>
                        </div>

                        {/* Table body */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-neutral-50 text-left dark:border-neutral-800">
                                        <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">Date</th>
                                        <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">Resident</th>
                                        <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">Zone</th>
                                        <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">Description</th>
                                        <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginated.length === 0 ? (
                                        <tr><td colSpan={5} className="px-5 py-16 text-center">
                                            <AlertTriangle size={28} className="mx-auto text-neutral-200 dark:text-neutral-700" />
                                            <p className="mt-2 text-sm text-neutral-400">No reports found.</p>
                                        </td></tr>
                                    ) : paginated.map((r) => {
                                        const cfg = STATUS_CONFIG[r.status] ?? STATUS_CONFIG.open;
                                        return (
                                            <tr key={r.id} className="border-t border-neutral-50 transition-colors hover:bg-neutral-50/50 dark:border-neutral-800/50 dark:hover:bg-neutral-800/30">
                                                <td className="px-5 py-3.5">
                                                    <p className="text-xs font-semibold text-neutral-900 dark:text-white">{r.report_datetime?.split(' ')[0] ?? '—'}</p>
                                                    {r.report_datetime && <p className="text-[11px] text-neutral-400">{r.report_datetime.split(' ')[1] ?? ''}</p>}
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-100 to-orange-100 text-[10px] font-bold text-amber-600 dark:from-amber-900/40 dark:to-orange-900/40 dark:text-amber-400">
                                                            {r.resident?.charAt(0) ?? '?'}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="truncate text-xs font-medium text-neutral-700 dark:text-neutral-300">{r.resident ?? '—'}</p>
                                                            {r.location_text && <p className="truncate text-[11px] text-neutral-400">{r.location_text}</p>}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    {r.zone ? (
                                                        <div>
                                                            <p className="text-xs font-medium text-neutral-700 dark:text-neutral-300">{r.zone.name}</p>
                                                            {r.zone.barangay && <p className="text-[11px] text-neutral-400">{r.zone.barangay}</p>}
                                                        </div>
                                                    ) : <span className="text-xs text-neutral-300 dark:text-neutral-600">—</span>}
                                                </td>
                                                <td className="max-w-[220px] px-5 py-3.5">
                                                    <p className="line-clamp-2 text-xs text-neutral-600 dark:text-neutral-400">{r.description}</p>
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <select
                                                        value={r.status}
                                                        disabled={updatingId === r.id}
                                                        onChange={(e) => updateStatus(r.id, e.target.value)}
                                                        className={`cursor-pointer rounded-lg border-0 px-2.5 py-1.5 text-[11px] font-semibold outline-none transition-all ${cfg.bg} ${cfg.text} ${updatingId === r.id ? 'opacity-50' : 'hover:ring-2 hover:ring-neutral-200 dark:hover:ring-neutral-700'}`}
                                                    >
                                                        {STATUS_OPTIONS.map((s) => (
                                                            <option key={s} value={s}>{s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</option>
                                                        ))}
                                                    </select>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (() => {
                            const pages: (number | '...')[] = [];
                            if (totalPages <= 7) {
                                for (let i = 1; i <= totalPages; i++) pages.push(i);
                            } else {
                                pages.push(1);
                                if (currentPage > 3) pages.push('...');
                                for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i);
                                if (currentPage < totalPages - 2) pages.push('...');
                                pages.push(totalPages);
                            }
                            return (
                                <div className="flex items-center justify-between border-t border-neutral-100 px-5 py-3.5 dark:border-neutral-800">
                                    <p className="text-xs text-neutral-400">
                                        <span className="font-medium text-neutral-600 dark:text-neutral-300">{(currentPage - 1) * perPage + 1}–{Math.min(currentPage * perPage, filtered.length)}</span>
                                        {' '}of{' '}
                                        <span className="font-medium text-neutral-600 dark:text-neutral-300">{filtered.length}</span>
                                    </p>
                                    <div className="flex items-center gap-1">
                                        <button onClick={() => setPage(currentPage - 1)} disabled={currentPage <= 1}
                                            className="flex h-8 items-center gap-1 rounded-lg border border-neutral-200 px-2.5 text-xs font-medium text-neutral-500 transition-all hover:border-neutral-300 hover:bg-neutral-50 hover:text-neutral-700 disabled:cursor-not-allowed disabled:opacity-30 dark:border-neutral-700 dark:text-neutral-400 dark:hover:border-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-300">
                                            <ChevronLeft size={14} />
                                            <span className="hidden sm:inline">Prev</span>
                                        </button>
                                        <div className="flex items-center gap-0.5 rounded-lg border border-neutral-200 bg-neutral-50/50 p-0.5 dark:border-neutral-700 dark:bg-neutral-800/50">
                                            {pages.map((p, i) =>
                                                p === '...' ? (
                                                    <span key={`dots-${i}`} className="flex h-7 w-7 items-center justify-center text-[11px] text-neutral-300 dark:text-neutral-600">...</span>
                                                ) : (
                                                    <button key={p} onClick={() => setPage(p)}
                                                        className={`flex h-7 w-7 items-center justify-center rounded-md text-[11px] font-semibold transition-all ${p === currentPage
                                                            ? 'bg-amber-600 text-white shadow-sm shadow-amber-600/25'
                                                            : 'text-neutral-500 hover:bg-white hover:text-neutral-700 hover:shadow-sm dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-neutral-200'}`}>
                                                        {p}
                                                    </button>
                                                ),
                                            )}
                                        </div>
                                        <button onClick={() => setPage(currentPage + 1)} disabled={currentPage >= totalPages}
                                            className="flex h-8 items-center gap-1 rounded-lg border border-neutral-200 px-2.5 text-xs font-medium text-neutral-500 transition-all hover:border-neutral-300 hover:bg-neutral-50 hover:text-neutral-700 disabled:cursor-not-allowed disabled:opacity-30 dark:border-neutral-700 dark:text-neutral-400 dark:hover:border-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-300">
                                            <span className="hidden sm:inline">Next</span>
                                            <ChevronRight size={14} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                </motion.div>
            </div>
        </AdminLayout>
    );
}
