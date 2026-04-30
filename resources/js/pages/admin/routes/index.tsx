import { Head, Link, router } from '@inertiajs/react';
import { useEffect } from 'react';
import { Plus, Route, MapPin, User, ChevronRight, Clock, Trash2, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import AdminLayout from '@/layouts/admin-layout';
import { confirm } from '@/lib/notify';
import type { BreadcrumbItem } from '@/types';

type Plan = {
    id: number;
    route_date: string | null;
    status: string;
    zone: { id: number; name: string; barangay: string | null } | null;
    collector: { id: number; name: string } | null;
    stops_count: number;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/admin/dashboard' },
    { title: 'Routes', href: '/admin/routes' },
];

const statusConfig: Record<string, { label: string; bg: string; text: string; dot: string }> = {
    planned: { label: 'Planned', bg: 'bg-gray-50 dark:bg-gray-800/30', text: 'text-gray-600 dark:text-gray-400', dot: 'bg-gray-400' },
    in_progress: { label: 'In Progress', bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400', dot: 'bg-blue-500 animate-pulse' },
    completed: { label: 'Completed', bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500' },
    cancelled: { label: 'Cancelled', bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-500 dark:text-red-400', dot: 'bg-red-400' },
};

export default function RoutesIndex({ plans }: { plans: Plan[] }) {
    // Auto-refresh every 8 seconds to pick up status changes (e.g. collector starts a route)
    useEffect(() => {
        const id = setInterval(() => {
            router.reload({ only: ['plans'] });
        }, 8000);
        return () => clearInterval(id);
    }, []);
    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Route Plans" />
            <div className="space-y-5 p-5">
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                >
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Route Plans</h1>
                        <p className="mt-0.5 text-sm text-gray-400">Create and manage collection routes</p>
                    </div>
                    <Link
                        href="/admin/routes/create"
                        className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#1b4332] to-[#2d6a4f] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/15 transition-all hover:-translate-y-0.5 hover:shadow-xl"
                    >
                        <Plus size={16} />
                        New Route
                    </Link>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    className="premium-card overflow-hidden border border-gray-100 bg-white dark:border-white/5 dark:bg-white/[0.02]"
                >
                    <div className="flex items-center gap-2 border-b border-gray-50 px-5 py-3.5 dark:border-white/5">
                        <Route size={16} className="text-emerald-600 dark:text-emerald-400" />
                        <h2 className="text-sm font-semibold tracking-tight">All Routes</h2>
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-500 dark:bg-white/5 dark:text-gray-400">
                            {plans.length}
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-50 text-left dark:border-white/5">
                                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Date</th>
                                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Zone</th>
                                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Collector</th>
                                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Stops</th>
                                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Status</th>
                                    <th className="px-5 py-3"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {plans.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-5 py-16 text-center">
                                            <Route size={36} className="mx-auto text-gray-200 dark:text-gray-700" />
                                            <p className="mt-3 text-sm text-gray-400">No route plans yet.</p>
                                            <Link
                                                href="/admin/routes/create"
                                                className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                                            >
                                                Create your first route
                                                <ChevronRight size={14} />
                                            </Link>
                                        </td>
                                    </tr>
                                )}
                                {plans.map((p) => {
                                    const st = statusConfig[p.status] ?? statusConfig.planned;
                                    return (
                                        <tr key={p.id} className="border-t border-gray-50 transition-colors hover:bg-gray-50/50 dark:border-white/[0.03] dark:hover:bg-white/[0.02]">
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-2">
                                                    <Clock size={13} className="text-gray-300" />
                                                    <span className="font-medium">{p.route_date ?? '—'}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-2">
                                                    <MapPin size={13} className="text-gray-300" />
                                                    <span>{p.zone ? `${p.zone.name}` : '—'}</span>
                                                    {p.zone?.barangay && (
                                                        <span className="text-xs text-gray-400">({p.zone.barangay})</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-2">
                                                    <User size={13} className="text-gray-300" />
                                                    <span>{p.collector?.name ?? <span className="text-gray-400">Unassigned</span>}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <span className="inline-flex items-center rounded-full bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-white/5 dark:text-gray-400">
                                                    {p.stops_count}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${st.bg} ${st.text}`}>
                                                    <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                                                    {st.label}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {p.status === 'planned' && (
                                                        <button
                                                            onClick={async (e) => {
                                                                e.preventDefault();
                                                                if (await confirm('Cancel route?', 'This will mark the route as cancelled.', 'Cancel it')) {
                                                                    router.put(`/admin/routes/${p.id}`, { status: 'cancelled' }, { preserveScroll: true });
                                                                }
                                                            }}
                                                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-amber-600 transition-colors hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/30"
                                                        >
                                                            <XCircle size={13} />
                                                            Cancel
                                                        </button>
                                                    )}
                                                    {p.status !== 'in_progress' && (
                                                        <button
                                                            onClick={async (e) => {
                                                                e.preventDefault();
                                                                if (await confirm('Delete route?', 'This will permanently remove the route and its stops.', 'Delete')) {
                                                                    router.delete(`/admin/routes/${p.id}`, { preserveScroll: true });
                                                                }
                                                            }}
                                                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-red-500 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                                                        >
                                                            <Trash2 size={13} />
                                                        </button>
                                                    )}
                                                    <Link
                                                        href={`/admin/routes/${p.id}`}
                                                        className="group inline-flex items-center gap-1 text-sm font-medium text-emerald-600 transition-colors hover:text-emerald-700 dark:text-emerald-400"
                                                    >
                                                        View
                                                        <ChevronRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            </div>
        </AdminLayout>
    );
}
