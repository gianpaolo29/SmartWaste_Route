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
    planned: { label: 'Planned', bg: 'bg-neutral-100 dark:bg-neutral-800', text: 'text-neutral-600 dark:text-neutral-400', dot: 'bg-neutral-400' },
    in_progress: { label: 'In Progress', bg: 'bg-blue-50 dark:bg-blue-950/40', text: 'text-blue-600 dark:text-blue-400', dot: 'bg-blue-500 animate-pulse' },
    completed: { label: 'Completed', bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500' },
};

const fade = (delay = 0) => ({
    initial: { opacity: 0, y: 16 } as const,
    animate: { opacity: 1, y: 0 } as const,
    transition: { duration: 0.35, delay },
});

export default function AdminDashboard({ stats, recentRoutes }: { stats: Stats; recentRoutes: RecentRoute[] }) {
    const statCards = [
        { label: 'Total Residents', value: stats.residents, icon: Users, trend: 'up' as const, trendValue: '12.5%', sub: 'Registered households', iconBg: 'bg-blue-50 dark:bg-blue-950/40', iconColor: 'text-blue-600 dark:text-blue-400' },
        { label: 'Collectors', value: stats.collectors, icon: Truck, trend: 'up' as const, trendValue: '8.2%', sub: 'Active personnel', iconBg: 'bg-emerald-50 dark:bg-emerald-950/40', iconColor: 'text-emerald-600 dark:text-emerald-400' },
        { label: 'Active Zones', value: stats.active_zones, icon: MapPin, trend: 'up' as const, trendValue: '4.1%', sub: `${stats.total_barangays} barangays`, iconBg: 'bg-amber-50 dark:bg-amber-950/40', iconColor: 'text-amber-600 dark:text-amber-400' },
        { label: 'Missed Reports', value: stats.reports, icon: AlertTriangle, trend: 'down' as const, trendValue: '3.8%', sub: 'Filed reports', iconBg: 'bg-red-50 dark:bg-red-950/40', iconColor: 'text-red-500 dark:text-red-400' },
    ];

    const summaryCards = [
        { label: 'Total Routes', value: stats.total_routes, icon: Route, color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-950/40' },
        { label: 'Active Now', value: stats.active_routes, icon: Activity, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/40' },
        { label: 'Completed', value: stats.completed_routes, icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/40' },
    ];

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Admin Dashboard" />
            <div className="space-y-5 p-4 sm:p-5">
                <motion.div {...fade()}>
                    <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">Dashboard</h1>
                    <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">Overview of your waste management system</p>
                </motion.div>

                {/* Stat Cards */}
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {statCards.map((card, i) => {
                        const Icon = card.icon;
                        const isUp = card.trend === 'up';
                        return (
                            <motion.div key={card.label} {...fade(0.04 + i * 0.04)}
                                className="group rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900">
                                <div className="flex items-center justify-between">
                                    <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">{card.label}</p>
                                    <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${card.iconBg} transition-transform group-hover:scale-110`}>
                                        <Icon size={17} className={card.iconColor} />
                                    </div>
                                </div>
                                <div className="mt-2 flex items-baseline gap-2">
                                    <span className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">{card.value.toLocaleString()}</span>
                                    <span className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${isUp ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-red-50 text-red-500 dark:bg-red-950/40 dark:text-red-400'}`}>
                                        {isUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                                        {card.trendValue}
                                    </span>
                                </div>
                                <p className="mt-1.5 text-[11px] text-neutral-400 dark:text-neutral-500">{card.sub}</p>
                            </motion.div>
                        );
                    })}
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                    {/* Recent Routes */}
                    <motion.div {...fade(0.22)} className="overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm lg:col-span-2 dark:border-neutral-800 dark:bg-neutral-900">
                        <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3.5 dark:border-neutral-800">
                            <div>
                                <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">Recent Routes</h2>
                                <p className="text-[11px] text-neutral-400">Latest collection activity</p>
                            </div>
                            <Link href="/admin/routes" className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400">
                                View all <ChevronRight size={13} />
                            </Link>
                        </div>
                        {recentRoutes.length === 0 ? (
                            <div className="px-4 py-12 text-center">
                                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
                                    <Route size={20} className="text-neutral-400" />
                                </div>
                                <p className="mt-3 text-sm text-neutral-400">No routes yet</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-neutral-50 dark:divide-neutral-800">
                                {recentRoutes.map((r) => {
                                    const st = statusConfig[r.status] ?? statusConfig.planned;
                                    return (
                                        <Link key={r.id} href={`/admin/routes/${r.id}`} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800">
                                                <Clock size={15} className="text-neutral-500 dark:text-neutral-400" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <p className="truncate text-sm font-medium text-neutral-900 dark:text-white">{r.route_date ?? '—'}</p>
                                                    {r.barangay && <span className="truncate text-xs text-neutral-400">({r.barangay})</span>}
                                                </div>
                                                <p className="truncate text-xs text-neutral-400">{r.zone ?? '—'} · {r.collector ?? 'Unassigned'}</p>
                                            </div>
                                            <span className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${st.bg} ${st.text}`}>
                                                <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                                                {st.label}
                                            </span>
                                            <ArrowUpRight size={14} className="shrink-0 text-neutral-300 dark:text-neutral-600" />
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </motion.div>

                    {/* Route Overview */}
                    <motion.div {...fade(0.26)} className="overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                        <div className="border-b border-neutral-100 px-4 py-3.5 dark:border-neutral-800">
                            <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">Route Overview</h2>
                            <p className="text-[11px] text-neutral-400">Collection route statistics</p>
                        </div>
                        <div className="p-4">
                            <div className="mb-4 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 p-5 text-center text-white shadow-md shadow-emerald-600/15">
                                <p className="text-4xl font-bold">{stats.total_routes}</p>
                                <p className="mt-1 text-sm text-white/70">Total Routes Created</p>
                            </div>

                            <div className="space-y-2">
                                {summaryCards.map((item) => {
                                    const Icon = item.icon;
                                    return (
                                        <div key={item.label} className="flex items-center gap-3 rounded-xl bg-neutral-50 p-3 dark:bg-neutral-800/40">
                                            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${item.bg}`}>
                                                <Icon size={16} className={item.color} />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-xs text-neutral-500 dark:text-neutral-400">{item.label}</p>
                                                <p className="text-lg font-bold text-neutral-900 dark:text-white">{item.value}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <Link href="/admin/routes/create"
                                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 active:scale-[0.98]">
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
