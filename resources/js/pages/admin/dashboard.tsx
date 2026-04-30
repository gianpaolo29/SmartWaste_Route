import { Head, Link } from '@inertiajs/react';
import { Users, Truck, MapPin, Route, ArrowUpRight, ChevronRight, Activity, Clock, CheckCircle2, AlertTriangle, Scale, ClipboardList, CalendarClock, BarChart3 } from 'lucide-react';
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
    open_reports: number;
    total_reports: number;
    today_routes: number;
    total_waste: number;
    total_stops_served: number;
};

type RecentRoute = {
    id: number;
    route_date: string | null;
    status: string;
    zone: string | null;
    barangay: string | null;
    collector: string | null;
};

type RecentReport = {
    id: number;
    description: string;
    status: string;
    report_datetime: string | null;
    resident: string | null;
    zone: string | null;
};

type CollectorPerf = {
    name: string;
    completed: number;
    total: number;
    rate: number;
};

type WasteTrend = {
    day: string;
    total: number;
};

type Props = {
    stats: Stats;
    recentRoutes: RecentRoute[];
    recentReports: RecentReport[];
    collectorPerformance: CollectorPerf[];
    wasteTrend: WasteTrend[];
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

export default function AdminDashboard({ stats, recentRoutes, recentReports, collectorPerformance, wasteTrend }: Props) {
    const maxWaste = Math.max(...wasteTrend.map((w) => w.total), 1);

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Admin Dashboard" />
            <div className="space-y-5 p-4 sm:p-5">
                <motion.div {...fade()}>
                    <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">Dashboard</h1>
                    <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">Overview of your waste management system</p>
                </motion.div>

                {/* Top Stats */}
                <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
                    {[
                        { label: 'Total Residents', value: stats.residents, icon: Users, sub: `${stats.total_barangays} barangays`, iconBg: 'bg-blue-50 dark:bg-blue-950/40', iconColor: 'text-blue-600 dark:text-blue-400' },
                        { label: 'Collectors', value: stats.collectors, icon: Truck, sub: 'Active personnel', iconBg: 'bg-emerald-50 dark:bg-emerald-950/40', iconColor: 'text-emerald-600 dark:text-emerald-400' },
                        { label: 'Active Zones', value: stats.active_zones, icon: MapPin, sub: `${stats.total_routes} total routes`, iconBg: 'bg-amber-50 dark:bg-amber-950/40', iconColor: 'text-amber-600 dark:text-amber-400' },
                        { label: 'Open Reports', value: stats.open_reports, icon: AlertTriangle, sub: `${stats.total_reports} total filed`, iconBg: 'bg-red-50 dark:bg-red-950/40', iconColor: 'text-red-500 dark:text-red-400', href: '/admin/reports' },
                    ].map((card, i) => {
                        const Icon = card.icon;
                        const Wrapper = card.href ? Link : 'div';
                        return (
                            <motion.div key={card.label} {...fade(0.04 + i * 0.04)}>
                                <Wrapper {...(card.href ? { href: card.href } : {})}
                                    className="group block rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900">
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">{card.label}</p>
                                        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${card.iconBg} transition-transform group-hover:scale-110`}>
                                            <Icon size={17} className={card.iconColor} />
                                        </div>
                                    </div>
                                    <span className="mt-2 block text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">{card.value.toLocaleString()}</span>
                                    <p className="mt-1 text-[11px] text-neutral-400 dark:text-neutral-500">{card.sub}</p>
                                </Wrapper>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Operational summary */}
                <motion.div {...fade(0.2)} className="grid gap-3 grid-cols-2 sm:grid-cols-4">
                    {[
                        { label: 'Today\'s Routes', value: stats.today_routes, icon: CalendarClock, color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-950/40' },
                        { label: 'Active Now', value: stats.active_routes, icon: Activity, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/40' },
                        { label: 'Stops Served', value: stats.total_stops_served, icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/40' },
                        { label: 'Waste Collected', value: `${stats.total_waste} kg`, icon: Scale, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/40' },
                    ].map((item) => {
                        const Icon = item.icon;
                        return (
                            <div key={item.label} className="flex items-center gap-3 rounded-2xl border border-neutral-100 bg-white p-3.5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${item.bg}`}>
                                    <Icon size={16} className={item.color} />
                                </div>
                                <div>
                                    <p className="text-lg font-bold text-neutral-900 dark:text-white">{item.value}</p>
                                    <p className="text-[10px] text-neutral-400">{item.label}</p>
                                </div>
                            </div>
                        );
                    })}
                </motion.div>

                <div className="grid gap-4 lg:grid-cols-3">
                    {/* Recent Routes */}
                    <motion.div {...fade(0.24)} className="overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm lg:col-span-2 dark:border-neutral-800 dark:bg-neutral-900">
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
                                <Route size={20} className="mx-auto text-neutral-300" />
                                <p className="mt-2 text-sm text-neutral-400">No routes yet</p>
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
                                                <p className="truncate text-sm font-medium text-neutral-900 dark:text-white">{r.route_date ?? '—'} {r.barangay && <span className="text-neutral-400">({r.barangay})</span>}</p>
                                                <p className="truncate text-xs text-neutral-400">{r.zone ?? '—'} · {r.collector ?? 'Unassigned'}</p>
                                            </div>
                                            <span className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${st.bg} ${st.text}`}>
                                                <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                                                {st.label}
                                            </span>
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                        <div className="border-t border-neutral-100 p-3 dark:border-neutral-800">
                            <Link href="/admin/routes/create"
                                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 active:scale-[0.98]">
                                <Route size={15} /> Create New Route
                            </Link>
                        </div>
                    </motion.div>

                    {/* Waste Trend + Quick Stats */}
                    <motion.div {...fade(0.28)} className="space-y-4">
                        {/* Waste trend chart */}
                        <div className="overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                            <div className="border-b border-neutral-100 px-4 py-3.5 dark:border-neutral-800">
                                <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">Waste This Week</h2>
                                <p className="text-[11px] text-neutral-400">Daily collection volume (kg)</p>
                            </div>
                            <div className="p-4">
                                {wasteTrend.length === 0 ? (
                                    <div className="py-6 text-center">
                                        <BarChart3 size={20} className="mx-auto text-neutral-300" />
                                        <p className="mt-2 text-xs text-neutral-400">No data this week</p>
                                    </div>
                                ) : (
                                    <div className="flex items-end gap-1.5 h-28">
                                        {wasteTrend.map((w) => (
                                            <div key={w.day} className="flex flex-1 flex-col items-center gap-1">
                                                <span className="text-[10px] font-bold text-neutral-900 dark:text-white">{w.total}</span>
                                                <div className="w-full rounded-t-md bg-gradient-to-t from-emerald-500 to-teal-400 transition-all"
                                                    style={{ height: `${Math.max((w.total / maxWaste) * 80, 4)}px` }} />
                                                <span className="text-[9px] font-medium text-neutral-400">{w.day}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Collector performance */}
                        <div className="overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                            <div className="border-b border-neutral-100 px-4 py-3.5 dark:border-neutral-800">
                                <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">Top Collectors</h2>
                                <p className="text-[11px] text-neutral-400">By completion rate</p>
                            </div>
                            <div className="p-3">
                                {collectorPerformance.length === 0 ? (
                                    <p className="py-4 text-center text-xs text-neutral-400">No collectors yet</p>
                                ) : (
                                    <div className="space-y-2">
                                        {collectorPerformance.map((c) => (
                                            <div key={c.name} className="flex items-center gap-3 rounded-xl bg-neutral-50 p-2.5 dark:bg-neutral-800/40">
                                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-xs font-bold text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                                                    {c.rate}%
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-sm font-medium text-neutral-900 dark:text-white">{c.name}</p>
                                                    <p className="text-[10px] text-neutral-400">{c.completed}/{c.total} routes</p>
                                                </div>
                                                <div className="h-1.5 w-16 rounded-full bg-neutral-200 dark:bg-neutral-700">
                                                    <div className="h-full rounded-full bg-emerald-500" style={{ width: `${c.rate}%` }} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Open Reports */}
                <motion.div {...fade(0.32)} className="overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3.5 dark:border-neutral-800">
                        <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-50 dark:bg-red-950/40">
                                <AlertTriangle size={14} className="text-red-500 dark:text-red-400" />
                            </div>
                            <div>
                                <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">Open Reports</h2>
                                <p className="text-[11px] text-neutral-400">Missed pickups needing attention</p>
                            </div>
                        </div>
                        <Link href="/admin/reports" className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400">
                            View all <ChevronRight size={13} />
                        </Link>
                    </div>
                    {recentReports.length === 0 ? (
                        <div className="px-4 py-8 text-center">
                            <CheckCircle2 size={20} className="mx-auto text-emerald-400" />
                            <p className="mt-2 text-sm text-neutral-400">No open reports</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-neutral-50 dark:divide-neutral-800">
                            {recentReports.map((r) => (
                                <div key={r.id} className="flex items-start gap-3 px-4 py-3">
                                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950/40">
                                        <AlertTriangle size={14} className="text-amber-600 dark:text-amber-400" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-neutral-900 dark:text-white">{r.resident ?? 'Unknown'}</p>
                                        <p className="mt-0.5 line-clamp-1 text-xs text-neutral-400">{r.description}</p>
                                        <p className="mt-0.5 text-[11px] text-neutral-300 dark:text-neutral-600">{r.zone ?? '—'} · {r.report_datetime}</p>
                                    </div>
                                    <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                                        {r.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </motion.div>
            </div>
        </AdminLayout>
    );
}
