import { Head, Link } from '@inertiajs/react';
import { Users, Truck, MapPin, Route, TrendingUp, TrendingDown, ArrowUpRight, ChevronRight, Activity, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import AdminLayout from '@/layouts/admin-layout';
import type { BreadcrumbItem } from '@/types';

type Stats = {
    residents: number;
    collectors: number;
    active_zones: number;
    total_routes: number;
    active_routes: number;
    completed_routes: number;
    total_barangays: number;
    reports: number;
};

type RecentRoute = {
    id: number;
    route_date: string | null;
    status: string;
    zone: string | null;
    barangay: string | null;
    collector: string | null;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/admin/dashboard' },
];

const statusConfig: Record<string, { label: string; bg: string; text: string; dot: string }> = {
    planned: { label: 'Planned', bg: 'bg-gray-50', text: 'text-gray-600', dot: 'bg-gray-400' },
    in_progress: { label: 'In Progress', bg: 'bg-blue-50', text: 'text-blue-600', dot: 'bg-blue-500 animate-pulse' },
    completed: { label: 'Completed', bg: 'bg-emerald-50', text: 'text-emerald-600', dot: 'bg-emerald-500' },
};

export default function AdminDashboard({ stats, recentRoutes }: { stats: Stats; recentRoutes: RecentRoute[] }) {
    const statCards = [
        {
            label: 'Total Residents',
            value: stats.residents.toLocaleString(),
            icon: Users,
            trend: 'up' as const,
            trendValue: '12.5%',
            subtitle: 'Registered households',
            iconBg: 'bg-blue-50 dark:bg-blue-900/20',
            iconColor: 'text-blue-600 dark:text-blue-400',
        },
        {
            label: 'Total Collectors',
            value: stats.collectors.toLocaleString(),
            icon: Truck,
            trend: 'up' as const,
            trendValue: '8.2%',
            subtitle: 'Active personnel',
            iconBg: 'bg-emerald-50 dark:bg-emerald-900/20',
            iconColor: 'text-emerald-600 dark:text-emerald-400',
        },
        {
            label: 'Active Zones',
            value: stats.active_zones.toLocaleString(),
            icon: MapPin,
            trend: 'up' as const,
            trendValue: '4.1%',
            subtitle: `${stats.total_barangays} barangays covered`,
            iconBg: 'bg-amber-50 dark:bg-amber-900/20',
            iconColor: 'text-amber-600 dark:text-amber-400',
        },
        {
            label: 'Missed Reports',
            value: stats.reports.toLocaleString(),
            icon: AlertTriangle,
            trend: 'down' as const,
            trendValue: '3.8%',
            subtitle: 'Total filed reports',
            iconBg: 'bg-red-50 dark:bg-red-900/20',
            iconColor: 'text-red-500 dark:text-red-400',
        },
    ];

    const summaryCards = [
        { label: 'Total Routes', value: stats.total_routes, icon: Route, color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-900/20' },
        { label: 'Active Now', value: stats.active_routes, icon: Activity, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
        { label: 'Completed', value: stats.completed_routes, icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
    ];

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Admin Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                {/* Page title */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
                </motion.div>

                {/* Stat cards — Mantis style */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {statCards.map((card, i) => {
                        const Icon = card.icon;
                        const isUp = card.trend === 'up';
                        return (
                            <motion.div
                                key={card.label}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: i * 0.06 }}
                                className="rounded-xl border border-gray-100 bg-white p-5 transition-shadow hover:shadow-md dark:border-white/5 dark:bg-white/[0.02]"
                            >
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{card.label}</p>
                                    <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${card.iconBg}`}>
                                        <Icon size={18} className={card.iconColor} />
                                    </div>
                                </div>
                                <div className="mt-3 flex items-baseline gap-2.5">
                                    <span className="text-3xl font-bold tracking-tight">{card.value}</span>
                                    <span className={`inline-flex items-center gap-0.5 rounded-md border px-1.5 py-0.5 text-xs font-semibold ${
                                        isUp
                                            ? 'border-emerald-200 text-emerald-600 dark:border-emerald-800 dark:text-emerald-400'
                                            : 'border-red-200 text-red-500 dark:border-red-800 dark:text-red-400'
                                    }`}>
                                        {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                        {card.trendValue}
                                    </span>
                                </div>
                                <p className="mt-2 text-xs text-gray-400">{card.subtitle}</p>
                            </motion.div>
                        );
                    })}
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Recent Routes */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.3 }}
                        className="rounded-xl border border-gray-100 bg-white lg:col-span-2 dark:border-white/5 dark:bg-white/[0.02]"
                    >
                        <div className="flex items-center justify-between border-b border-gray-50 px-5 py-4 dark:border-white/5">
                            <div>
                                <h2 className="font-semibold tracking-tight">Recent Routes</h2>
                                <p className="mt-0.5 text-xs text-gray-400">Latest collection route activity</p>
                            </div>
                            <Link
                                href="/admin/routes"
                                className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 transition-colors hover:text-emerald-700 dark:text-emerald-400"
                            >
                                View all
                                <ChevronRight size={13} />
                            </Link>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-50 text-left dark:border-white/5">
                                        <th className="px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-gray-400">Route</th>
                                        <th className="px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-gray-400">Zone</th>
                                        <th className="px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-gray-400">Collector</th>
                                        <th className="px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-gray-400">Status</th>
                                        <th className="px-5 py-2.5"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentRoutes.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-5 py-10 text-center text-sm text-gray-400">
                                                No routes yet.
                                            </td>
                                        </tr>
                                    ) : (
                                        recentRoutes.map((r) => {
                                            const st = statusConfig[r.status] ?? statusConfig.planned;
                                            return (
                                                <tr key={r.id} className="border-t border-gray-50 transition-colors hover:bg-gray-50/50 dark:border-white/[0.03] dark:hover:bg-white/[0.02]">
                                                    <td className="px-5 py-3">
                                                        <div className="flex items-center gap-2">
                                                            <Clock size={13} className="text-gray-300" />
                                                            <span className="font-medium">{r.route_date ?? '—'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-3 text-gray-600 dark:text-gray-400">
                                                        {r.zone ?? '—'}
                                                        {r.barangay && <span className="ml-1 text-xs text-gray-400">({r.barangay})</span>}
                                                    </td>
                                                    <td className="px-5 py-3 text-gray-600 dark:text-gray-400">{r.collector ?? <span className="text-gray-300">Unassigned</span>}</td>
                                                    <td className="px-5 py-3">
                                                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${st.bg} ${st.text}`}>
                                                            <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                                                            {st.label}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-3 text-right">
                                                        <Link href={`/admin/routes/${r.id}`} className="inline-flex items-center gap-0.5 text-xs font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400">
                                                            View <ArrowUpRight size={12} />
                                                        </Link>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>

                    {/* Route Summary */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.35 }}
                        className="rounded-xl border border-gray-100 bg-white dark:border-white/5 dark:bg-white/[0.02]"
                    >
                        <div className="border-b border-gray-50 px-5 py-4 dark:border-white/5">
                            <h2 className="font-semibold tracking-tight">Route Overview</h2>
                            <p className="mt-0.5 text-xs text-gray-400">Collection route statistics</p>
                        </div>
                        <div className="p-5">
                            {/* Big number */}
                            <div className="mb-5 text-center">
                                <p className="text-4xl font-bold tracking-tight">{stats.total_routes}</p>
                                <p className="mt-1 text-sm text-gray-400">Total Routes</p>
                            </div>

                            {/* Summary items */}
                            <div className="space-y-3">
                                {summaryCards.map((item) => {
                                    const Icon = item.icon;
                                    return (
                                        <div key={item.label} className="flex items-center gap-3 rounded-lg bg-gray-50/80 px-4 py-3 dark:bg-white/[0.03]">
                                            <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${item.bg}`}>
                                                <Icon size={16} className={item.color} />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-xs text-gray-500">{item.label}</p>
                                                <p className="text-lg font-bold">{item.value}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Quick action */}
                            <Link
                                href="/admin/routes/create"
                                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#1b4332] to-[#2d6a4f] px-4 py-3 text-sm font-semibold text-white shadow-md shadow-emerald-600/10 transition-all hover:-translate-y-0.5 hover:shadow-lg"
                            >
                                <Route size={16} />
                                Create New Route
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </div>
        </AdminLayout>
    );
}
