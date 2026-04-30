import { Head, Link, usePage } from '@inertiajs/react';
import {
    CalendarClock, CheckCircle2, ChevronRight, ClipboardList,
    MapPin, Navigation, Recycle, Scale, Truck, TrendingUp,
} from 'lucide-react';
import { motion } from 'framer-motion';
import CollectorLayout from '@/layouts/collector-layout';
import type { User } from '@/types';

type RecentReport = {
    id: number;
    report_date: string;
    total: number;
    zone: string | null;
};

type NextRoute = {
    id: number;
    route_date: string | null;
    status: string;
    zone: { name: string; barangay: string | null } | null;
    stops_count: number;
};

type Props = {
    stats: {
        today_count: number;
        upcoming_count: number;
        completed_count: number;
        reports_count: number;
        total_waste: number;
        total_stops: number;
    };
    recentReports: RecentReport[];
    nextRoute: NextRoute | null;
};

const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 18 } as const,
    animate: { opacity: 1, y: 0 } as const,
    transition: { duration: 0.4, delay, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
});

export default function CollectorDashboard({ stats, recentReports, nextRoute }: Props) {
    const { auth } = usePage().props as { auth: { user: User } };
    const firstName = auth.user.name.split(' ')[0];
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

    return (
        <CollectorLayout>
            <Head title="Home" />
            <div className="space-y-4 px-4 py-5 pb-36">

                {/* ===== Greeting ===== */}
                <motion.div {...fadeUp()}>
                    <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">{greeting},</p>
                    <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">{firstName}</h1>
                </motion.div>

                {/* ===== Hero card ===== */}
                <motion.div {...fadeUp(0.05)} className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-700 p-5 shadow-lg shadow-emerald-600/15 dark:from-emerald-700 dark:via-emerald-800 dark:to-teal-800">
                    <div className="absolute right-[-30px] top-[-20px] h-40 w-40 rounded-full bg-white/10" />
                    <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
                            <Truck size={26} className="text-white" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-white/90">Collection Summary</p>
                            <p className="text-xs text-white/50">Your lifetime stats</p>
                        </div>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-3">
                        <div className="rounded-xl bg-white/10 p-3 text-center backdrop-blur-sm">
                            <p className="text-xl font-bold text-white">{stats.completed_count}</p>
                            <p className="mt-0.5 text-[10px] font-medium text-white/60">Routes Done</p>
                        </div>
                        <div className="rounded-xl bg-white/10 p-3 text-center backdrop-blur-sm">
                            <p className="text-xl font-bold text-white">{stats.total_stops}</p>
                            <p className="mt-0.5 text-[10px] font-medium text-white/60">Stops Served</p>
                        </div>
                        <div className="rounded-xl bg-white/10 p-3 text-center backdrop-blur-sm">
                            <p className="text-xl font-bold text-white">{stats.total_waste}<span className="text-sm font-normal text-white/60"> kg</span></p>
                            <p className="mt-0.5 text-[10px] font-medium text-white/60">Waste Collected</p>
                        </div>
                    </div>
                </motion.div>

                {/* ===== Today / Upcoming / Reports row ===== */}
                <motion.div {...fadeUp(0.1)} className="grid grid-cols-3 gap-3">
                    {[
                        { label: 'Today', value: stats.today_count, icon: Truck, bg: 'bg-emerald-50 dark:bg-emerald-950/40', color: 'text-emerald-600 dark:text-emerald-400', ring: 'ring-emerald-100 dark:ring-emerald-900/30' },
                        { label: 'Upcoming', value: stats.upcoming_count, icon: CalendarClock, bg: 'bg-blue-50 dark:bg-blue-950/40', color: 'text-blue-600 dark:text-blue-400', ring: 'ring-blue-100 dark:ring-blue-900/30' },
                        { label: 'Reports', value: stats.reports_count, icon: ClipboardList, bg: 'bg-violet-50 dark:bg-violet-950/40', color: 'text-violet-600 dark:text-violet-400', ring: 'ring-violet-100 dark:ring-violet-900/30' },
                    ].map(({ label, value, icon: Icon, bg, color, ring }) => (
                        <div key={label} className={`flex flex-col items-center gap-1.5 rounded-2xl border border-neutral-100 bg-white p-3.5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900`}>
                            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${bg} ring-1 ${ring}`}>
                                <Icon size={17} strokeWidth={2} className={color} />
                            </div>
                            <span className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">{value}</span>
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">{label}</span>
                        </div>
                    ))}
                </motion.div>

                {/* ===== Next Route ===== */}
                {nextRoute && (
                    <motion.div {...fadeUp(0.15)}>
                        <Link
                            href={`/collector/routes/${nextRoute.id}`}
                            className="group flex items-center gap-4 rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm transition-all active:scale-[0.98] dark:border-neutral-800 dark:bg-neutral-900"
                        >
                            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-sm ${
                                nextRoute.status === 'in_progress'
                                    ? 'bg-gradient-to-br from-blue-500 to-blue-700 shadow-blue-500/20'
                                    : 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/20'
                            }`}>
                                <Navigation size={20} className="text-white" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                                        {nextRoute.status === 'in_progress' ? 'Continue Route' : 'Next Route'}
                                    </p>
                                    {nextRoute.status === 'in_progress' && (
                                        <span className="relative flex h-2 w-2">
                                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-500 opacity-75" />
                                            <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-600" />
                                        </span>
                                    )}
                                </div>
                                <p className="mt-0.5 text-sm font-semibold text-neutral-900 dark:text-white">
                                    {nextRoute.zone?.name} <span className="font-normal text-neutral-400">({nextRoute.zone?.barangay ?? '—'})</span>
                                </p>
                                <div className="mt-1 flex items-center gap-3 text-xs text-neutral-400">
                                    <span className="flex items-center gap-1"><CalendarClock size={11} /> {nextRoute.route_date}</span>
                                    <span className="flex items-center gap-1"><MapPin size={11} /> {nextRoute.stops_count} stops</span>
                                </div>
                            </div>
                            <ChevronRight size={18} className="shrink-0 text-neutral-300 transition-transform group-hover:translate-x-0.5 dark:text-neutral-600" />
                        </Link>
                    </motion.div>
                )}

                {/* ===== Quick Actions ===== */}
                <motion.div {...fadeUp(0.2)} className="grid grid-cols-2 gap-3">
                    <Link href="/collector/routes"
                        className="group flex items-center gap-3 rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm transition-all active:scale-[0.97] dark:border-neutral-800 dark:bg-neutral-900">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/50 dark:to-teal-950/50">
                            <MapPin size={20} strokeWidth={1.8} className="text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-neutral-900 dark:text-white">My Routes</p>
                            <p className="text-[11px] text-neutral-400">View all routes</p>
                        </div>
                        <ChevronRight size={16} className="ml-auto shrink-0 text-neutral-300 dark:text-neutral-600" />
                    </Link>
                    <Link href="/collector/reports/create"
                        className="group flex items-center gap-3 rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm transition-all active:scale-[0.97] dark:border-neutral-800 dark:bg-neutral-900">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/50 dark:to-cyan-950/50">
                            <ClipboardList size={20} strokeWidth={1.8} className="text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-neutral-900 dark:text-white">New Report</p>
                            <p className="text-[11px] text-neutral-400">Submit collection</p>
                        </div>
                        <ChevronRight size={16} className="ml-auto shrink-0 text-neutral-300 dark:text-neutral-600" />
                    </Link>
                </motion.div>

                {/* ===== Recent Reports ===== */}
                <motion.section {...fadeUp(0.25)} className="overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <div className="flex items-center justify-between px-4 pt-4 pb-3">
                        <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950/40">
                                <TrendingUp size={14} className="text-amber-600 dark:text-amber-400" />
                            </div>
                            <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">Recent Reports</h2>
                        </div>
                        {recentReports.length > 0 && (
                            <Link href="/collector/reports" className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                                View all <ChevronRight size={12} />
                            </Link>
                        )}
                    </div>
                    <div className="px-4 pb-4">
                        {recentReports.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50/50 px-4 py-8 text-center dark:border-neutral-800 dark:bg-neutral-800/20">
                                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
                                    <Scale size={22} className="text-neutral-400 dark:text-neutral-500" />
                                </div>
                                <p className="mt-3 text-sm font-medium text-neutral-400 dark:text-neutral-500">No reports yet</p>
                                <p className="mt-0.5 text-xs text-neutral-300 dark:text-neutral-600">Submit your first collection report</p>
                            </div>
                        ) : (
                            <ul className="space-y-2">
                                {recentReports.map((r) => (
                                    <li key={r.id}>
                                        <Link href={`/collector/reports/${r.id}`} className="flex items-center gap-3 rounded-xl bg-neutral-50 p-3 transition-all active:scale-[0.98] dark:bg-neutral-800/40">
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white dark:bg-neutral-800">
                                                <Recycle size={16} className="text-emerald-600 dark:text-emerald-400" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-medium text-neutral-900 dark:text-white">{r.zone ?? 'Unknown zone'}</p>
                                                <p className="text-xs text-neutral-400">{r.report_date}</p>
                                            </div>
                                            <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                                                {r.total} kg
                                            </span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </motion.section>

                {/* ===== Performance Overview ===== */}
                <motion.section {...fadeUp(0.3)} className="overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <div className="flex items-center gap-2 px-4 pt-4 pb-3">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/50">
                            <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">Performance</h2>
                    </div>
                    <div className="grid grid-cols-2 gap-px bg-neutral-100 dark:bg-neutral-800">
                        {[
                            { label: 'Routes Completed', value: stats.completed_count, icon: Truck, color: 'text-emerald-600 dark:text-emerald-400' },
                            { label: 'Reports Filed', value: stats.reports_count, icon: ClipboardList, color: 'text-blue-600 dark:text-blue-400' },
                            { label: 'Stops Covered', value: stats.total_stops, icon: MapPin, color: 'text-violet-600 dark:text-violet-400' },
                            { label: 'Waste Collected', value: `${stats.total_waste} kg`, icon: Scale, color: 'text-amber-600 dark:text-amber-400' },
                        ].map(({ label, value, icon: Icon, color }) => (
                            <div key={label} className="flex items-center gap-3 bg-white p-4 dark:bg-neutral-900">
                                <Icon size={16} className={`shrink-0 ${color}`} />
                                <div className="min-w-0">
                                    <p className="text-base font-bold text-neutral-900 dark:text-white">{value}</p>
                                    <p className="text-[10px] font-medium text-neutral-400">{label}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.section>

            </div>
        </CollectorLayout>
    );
}
