import { Head, Link, router } from '@inertiajs/react';
import { useEffect, useState, useMemo } from 'react';
import { Plus, Route, MapPin, User, ChevronRight, ChevronLeft, Clock, Trash2, XCircle, Search, Filter } from 'lucide-react';
import { motion } from 'framer-motion';
import AdminLayout from '@/layouts/admin-layout';
import { confirm, toast } from '@/lib/notify';
import type { BreadcrumbItem } from '@/types';

type Plan = {
    id: number;
    route_date: string | null;
    status: string;
    zone: { id: number; name: string; barangay: string | null } | null;
    collector: { id: number; name: string } | null;
    truck: { plate_no: string } | null;
    stops_count: number;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/admin/dashboard' },
    { title: 'Routes', href: '/admin/routes' },
];

const fade = (delay = 0) => ({
    initial: { opacity: 0, y: 12 } as const,
    animate: { opacity: 1, y: 0 } as const,
    transition: { duration: 0.3, delay },
});

const statusConfig: Record<string, { label: string; bg: string; text: string; dot: string }> = {
    planned: { label: 'Planned', bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400', dot: 'bg-blue-500' },
    in_progress: { label: 'In Progress', bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-600 dark:text-amber-400', dot: 'bg-amber-500 animate-pulse' },
    completed: { label: 'Completed', bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500' },
    cancelled: { label: 'Cancelled', bg: 'bg-neutral-100 dark:bg-neutral-800/30', text: 'text-neutral-500 dark:text-neutral-400', dot: 'bg-neutral-400' },
};

export default function RoutesIndex({ plans }: { plans: Plan[] }) {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [page, setPage] = useState(1);
    const perPage = 10;

    useEffect(() => {
        const id = setInterval(() => { router.reload({ only: ['plans'] }); }, 8000);
        return () => clearInterval(id);
    }, []);

    const filtered = useMemo(() => {
        return plans.filter((p) => {
            const matchesSearch = !search ||
                (p.zone?.name?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
                (p.zone?.barangay?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
                (p.collector?.name?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
                (p.route_date?.includes(search) ?? false);
            const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [plans, search, statusFilter]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
    const currentPage = Math.min(page, totalPages);
    const paginated = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

    useEffect(() => { setPage(1); }, [search, statusFilter]);

    const statCounts = useMemo(() => ({
        total: plans.length,
        planned: plans.filter((p) => p.status === 'planned').length,
        in_progress: plans.filter((p) => p.status === 'in_progress').length,
        completed: plans.filter((p) => p.status === 'completed').length,
    }), [plans]);

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Route Plans" />
            <div className="space-y-4 p-4 sm:p-5">
                {/* Header */}
                <motion.div {...fade()} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">Route Plans</h1>
                        <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">Create and manage collection routes</p>
                    </div>
                    <Link href="/admin/routes/create"
                        className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm shadow-emerald-600/20 transition-all hover:shadow-md hover:shadow-emerald-600/25">
                        <Plus size={14} />
                        New Route
                    </Link>
                </motion.div>

                {/* Stat Cards */}
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    {([
                        { label: 'Total Routes', value: statCounts.total, icon: Route, bg: 'bg-neutral-50 dark:bg-neutral-950/40', text: 'text-neutral-600 dark:text-neutral-400', ring: 'ring-neutral-500/20' },
                        { label: 'Planned', value: statCounts.planned, icon: Clock, bg: 'bg-blue-50 dark:bg-blue-950/40', text: 'text-blue-600 dark:text-blue-400', ring: 'ring-blue-500/20' },
                        { label: 'In Progress', value: statCounts.in_progress, icon: MapPin, bg: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-600 dark:text-amber-400', ring: 'ring-amber-500/20' },
                        { label: 'Completed', value: statCounts.completed, icon: Route, bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-600 dark:text-emerald-400', ring: 'ring-emerald-500/20' },
                    ] as const).map(({ label, value, icon: Icon, bg, text, ring }, i) => (
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
                                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-sm shadow-emerald-500/20">
                                    <Route size={14} className="text-white" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-bold text-neutral-900 dark:text-white">All Routes</h2>
                                    <p className="text-[11px] text-neutral-400">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <Filter size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                                        className="appearance-none rounded-xl border border-neutral-200 bg-neutral-50/50 py-2 pl-8 pr-8 text-xs outline-none transition-all focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 dark:border-neutral-700 dark:bg-neutral-800/50 dark:text-neutral-300 dark:focus:border-emerald-600">
                                        <option value="all">All Status</option>
                                        <option value="planned">Planned</option>
                                        <option value="in_progress">In Progress</option>
                                        <option value="completed">Completed</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                </div>
                                <div className="relative">
                                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                                    <input type="text" placeholder="Search routes..." value={search} onChange={(e) => setSearch(e.target.value)}
                                        className="w-full rounded-xl border border-neutral-200 bg-neutral-50/50 py-2 pl-8 pr-3 text-xs outline-none transition-all placeholder:text-neutral-400 focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 sm:w-52 dark:border-neutral-700 dark:bg-neutral-800/50 dark:text-neutral-300 dark:focus:border-emerald-600" />
                                </div>
                            </div>
                        </div>

                        {/* Table body */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-neutral-50 text-left dark:border-neutral-800">
                                        <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">Date</th>
                                        <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">Zone</th>
                                        <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">Collector</th>
                                        <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">Stops</th>
                                        <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">Status</th>
                                        <th className="px-5 py-3"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginated.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="px-5 py-16 text-center">
                                                <Route size={28} className="mx-auto text-neutral-200 dark:text-neutral-700" />
                                                <p className="mt-2 text-sm text-neutral-400">No routes found.</p>
                                                <Link href="/admin/routes/create"
                                                    className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400">
                                                    Create your first route
                                                    <ChevronRight size={13} />
                                                </Link>
                                            </td>
                                        </tr>
                                    )}
                                    {paginated.map((p) => {
                                        const st = statusConfig[p.status] ?? statusConfig.planned;
                                        return (
                                            <tr key={p.id} className="border-t border-neutral-50 transition-colors hover:bg-neutral-50/50 dark:border-neutral-800/50 dark:hover:bg-neutral-800/30">
                                                <td className="px-5 py-3.5">
                                                    <div className="flex items-center gap-2">
                                                        <Clock size={13} className="text-neutral-300 dark:text-neutral-600" />
                                                        <span className="text-sm font-semibold text-neutral-900 dark:text-white">{p.route_date ?? '—'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    {p.zone ? (
                                                        <div>
                                                            <p className="text-xs font-medium text-neutral-700 dark:text-neutral-300">{p.zone.name}</p>
                                                            {p.zone.barangay && <p className="text-[11px] text-neutral-400">{p.zone.barangay}</p>}
                                                        </div>
                                                    ) : <span className="text-xs text-neutral-300 dark:text-neutral-600">—</span>}
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    {p.collector ? (
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-100 to-teal-100 text-[10px] font-bold text-emerald-600 dark:from-emerald-900/40 dark:to-teal-900/40 dark:text-emerald-400">
                                                                {p.collector.name.charAt(0)}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="text-xs font-medium text-neutral-700 dark:text-neutral-300">{p.collector.name}</p>
                                                                {p.truck && <p className="text-[11px] text-neutral-400">{p.truck.plate_no}</p>}
                                                            </div>
                                                        </div>
                                                    ) : <span className="text-xs italic text-neutral-400">Unassigned</span>}
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-semibold text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                                                        <MapPin size={10} />
                                                        {p.stops_count}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${st.bg} ${st.text}`}>
                                                        <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                                                        {st.label}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3.5 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        {p.status === 'planned' && (
                                                            <button
                                                                onClick={async (e) => {
                                                                    e.preventDefault();
                                                                    if (await confirm('Cancel route?', 'This will mark the route as cancelled.', 'Cancel it')) {
                                                                        router.put(`/admin/routes/${p.id}`, { status: 'cancelled' }, {
                                                                            preserveScroll: true,
                                                                            onSuccess: () => toast('success', 'Route cancelled'),
                                                                        });
                                                                    }
                                                                }}
                                                                className="rounded-lg p-1.5 text-neutral-400 transition-all hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-900/20"
                                                                title="Cancel route"
                                                            >
                                                                <XCircle size={14} />
                                                            </button>
                                                        )}
                                                        {p.status !== 'in_progress' && (
                                                            <button
                                                                onClick={async (e) => {
                                                                    e.preventDefault();
                                                                    if (await confirm('Delete route?', 'This will permanently remove the route and its stops.', 'Delete')) {
                                                                        router.delete(`/admin/routes/${p.id}`, {
                                                                            preserveScroll: true,
                                                                            onSuccess: () => toast('success', 'Route deleted'),
                                                                        });
                                                                    }
                                                                }}
                                                                className="rounded-lg p-1.5 text-neutral-400 transition-all hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                                                                title="Delete route"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        )}
                                                        <Link href={`/admin/routes/${p.id}`}
                                                            className="group flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-emerald-600 transition-all hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/20">
                                                            View
                                                            <ChevronRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                                                        </Link>
                                                    </div>
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
                                                            ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/25'
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
