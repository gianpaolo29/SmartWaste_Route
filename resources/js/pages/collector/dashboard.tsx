import { Head, Link, usePage } from '@inertiajs/react';
import {
    CalendarClock, CheckCircle2, ChevronRight, ClipboardList,
    MapPin, Navigation, Recycle, Scale, Truck, TrendingUp, Sparkles, ArrowRight,
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
    initial: { opacity: 0, y: 20 } as const,
    animate: { opacity: 1, y: 0 } as const,
    transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
});

export default function CollectorDashboard({ stats, recentReports, nextRoute }: Props) {
    const { auth } = usePage().props as { auth: { user: User } };
    const firstName = auth.user.name.split(' ')[0];
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
    const completionRate = stats.completed_count + stats.today_count > 0
        ? Math.round((stats.completed_count / (stats.completed_count + stats.today_count + stats.upcoming_count)) * 100)
        : 0;

    return (
        <CollectorLayout>
            <Head title="Home" />
            <div className="space-y-5 px-4 py-5 pb-36">

                {/* ===== Hero Section ===== */}
                <motion.div {...fadeUp(0)}>
                    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0d2818] via-[#1b4332] to-[#2d6a4f] p-6 shadow-2xl shadow-emerald-900/20">
                        {/* Decorative elements */}
                        <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-emerald-400/10 blur-2xl" />
                        <div className="absolute -bottom-6 -left-6 h-32 w-32 rounded-full bg-teal-300/10 blur-2xl" />
                        <div className="absolute right-6 top-6 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm">
                            <Sparkles size={14} className="text-emerald-300" />
                        </div>

                        {/* Greeting */}
                        <div className="relative">
                            <p className="text-sm font-medium text-emerald-300/80">{greeting},</p>
                            <h1 className="mt-0.5 text-2xl font-bold tracking-tight text-white">{firstName}</h1>

                            {/* Stats row */}
                            <div className="mt-5 grid grid-cols-3 gap-2">
                                {[
                                    { label: 'Routes', value: stats.completed_count, sub: 'completed' },
                                    { label: 'Stops', value: stats.total_stops, sub: 'served' },
                                    { label: 'Waste', value: `${stats.total_waste}`, sub: 'kg collected' },
                                ].map((item) => (
                                    <div key={item.label} className="rounded-2xl bg-white/[0.08] px-3 py-3 text-center backdrop-blur-sm ring-1 ring-white/[0.06]">
                                        <p className="text-lg font-bold text-white">{item.value}</p>
                                        <p className="mt-0.5 text-[10px] font-medium text-white/50">{item.sub}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Completion rate bar */}
                            <div className="mt-4">
                                <div className="flex items-center justify-between text-[11px]">
                                    <span className="font-medium text-white/50">Completion Rate</span>
                                    <span className="font-bold text-emerald-300">{completionRate}%</span>
                                </div>
                                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
                                    <motion.div
                                        className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-300"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${completionRate}%` }}
                                        transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* ===== Today / Upcoming / Reports ===== */}
                <div className="grid grid-cols-3 gap-2.5">
                    {[
                        { label: 'Today', value: stats.today_count, icon: Truck, gradient: 'from-emerald-500 to-teal-500', shadow: 'shadow-emerald-500/20' },
                        { label: 'Upcoming', value: stats.upcoming_count, icon: CalendarClock, gradient: 'from-blue-500 to-cyan-500', shadow: 'shadow-blue-500/20' },
                        { label: 'Reports', value: stats.reports_count, icon: ClipboardList, gradient: 'from-violet-500 to-purple-500', shadow: 'shadow-violet-500/20' },
                    ].map((card, i) => {
                        const Icon = card.icon;
                        return (
                            <motion.div key={card.label} {...fadeUp(0.08 + i * 0.05)}
                                className="group relative overflow-hidden rounded-2xl border border-neutral-100 bg-white p-3.5 shadow-sm transition-all hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900"
                            >
                                <div className={`absolute -right-3 -top-3 h-14 w-14 rounded-full bg-gradient-to-br ${card.gradient} opacity-[0.07] transition-opacity group-hover:opacity-[0.12]`} />
                                <div className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${card.gradient} shadow-md ${card.shadow}`}>
                                    <Icon size={15} className="text-white" />
                                </div>
                                <p className="mt-2.5 text-xl font-bold tracking-tight text-neutral-900 dark:text-white">{card.value}</p>
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">{card.label}</p>
                            </motion.div>
                        );
                    })}
                </div>

                {/* ===== Next Route ===== */}
                {nextRoute && (
                    <motion.div {...fadeUp(0.2)}>
                        <Link
                            href={`/collector/routes/${nextRoute.id}`}
                            className="group relative block overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm transition-all active:scale-[0.98] hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900"
                        >
                            {/* Accent bar */}
                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                                nextRoute.status === 'in_progress'
                                    ? 'bg-gradient-to-b from-blue-500 to-blue-600'
                                    : 'bg-gradient-to-b from-emerald-500 to-teal-500'
                            }`} />

                            <div className="flex items-center gap-4 p-4 pl-5">
                                <div className={`relative flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl shadow-lg ${
                                    nextRoute.status === 'in_progress'
                                        ? 'bg-gradient-to-br from-blue-500 to-blue-700 shadow-blue-500/25'
                                        : 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/25'
                                }`}>
                                    <Navigation size={22} className="text-white" />
                                    {nextRoute.status === 'in_progress' && (
                                        <span className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5">
                                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
                                            <span className="relative inline-flex h-3.5 w-3.5 rounded-full border-2 border-white bg-blue-500 dark:border-neutral-900" />
                                        </span>
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className={`text-[11px] font-bold uppercase tracking-wider ${
                                        nextRoute.status === 'in_progress' ? 'text-blue-600 dark:text-blue-400' : 'text-emerald-600 dark:text-emerald-400'
                                    }`}>
                                        {nextRoute.status === 'in_progress' ? 'Continue Route' : 'Next Route'}
                                    </p>
                                    <p className="mt-0.5 text-[15px] font-bold text-neutral-900 dark:text-white">
                                        {nextRoute.zone?.name}
                                    </p>
                                    <div className="mt-1 flex items-center gap-3 text-xs text-neutral-400">
                                        <span className="flex items-center gap-1"><CalendarClock size={11} /> {nextRoute.route_date}</span>
                                        <span className="h-0.5 w-0.5 rounded-full bg-neutral-300 dark:bg-neutral-600" />
                                        <span className="flex items-center gap-1"><MapPin size={11} /> {nextRoute.stops_count} stops</span>
                                        <span className="h-0.5 w-0.5 rounded-full bg-neutral-300 dark:bg-neutral-600" />
                                        <span>{nextRoute.zone?.barangay ?? '—'}</span>
                                    </div>
                                </div>
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-100 transition-colors group-hover:bg-emerald-50 dark:bg-neutral-800 dark:group-hover:bg-emerald-950/50">
                                    <ArrowRight size={16} className="text-neutral-400 transition-transform group-hover:translate-x-0.5 group-hover:text-emerald-600 dark:group-hover:text-emerald-400" />
                                </div>
                            </div>
                        </Link>
                    </motion.div>
                )}

                {/* ===== Quick Actions ===== */}
                <motion.div {...fadeUp(0.25)} className="grid grid-cols-2 gap-3">
                    <Link href="/collector/routes"
                        className="group relative overflow-hidden rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm transition-all active:scale-[0.97] hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900">
                        <div className="absolute -right-4 -bottom-4 h-20 w-20 rounded-full bg-emerald-500/[0.04] transition-transform group-hover:scale-150" />
                        <div className="relative">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-md shadow-emerald-500/20">
                                <MapPin size={18} className="text-white" />
                            </div>
                            <p className="mt-3 text-sm font-bold text-neutral-900 dark:text-white">My Routes</p>
                            <p className="mt-0.5 text-[11px] text-neutral-400">View all routes</p>
                        </div>
                    </Link>
                    <Link href="/collector/reports/create"
                        className="group relative overflow-hidden rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm transition-all active:scale-[0.97] hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900">
                        <div className="absolute -right-4 -bottom-4 h-20 w-20 rounded-full bg-blue-500/[0.04] transition-transform group-hover:scale-150" />
                        <div className="relative">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 shadow-md shadow-blue-500/20">
                                <ClipboardList size={18} className="text-white" />
                            </div>
                            <p className="mt-3 text-sm font-bold text-neutral-900 dark:text-white">New Report</p>
                            <p className="mt-0.5 text-[11px] text-neutral-400">Submit collection</p>
                        </div>
                    </Link>
                </motion.div>

                {/* ===== Recent Reports ===== */}
                <motion.section {...fadeUp(0.3)} className="overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <div className="flex items-center justify-between px-5 pt-5 pb-3">
                        <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-sm shadow-amber-500/20">
                                <TrendingUp size={14} className="text-white" />
                            </div>
                            <div>
                                <h2 className="text-sm font-bold text-neutral-900 dark:text-white">Recent Reports</h2>
                                <p className="text-[10px] text-neutral-400">Your latest submissions</p>
                            </div>
                        </div>
                        {recentReports.length > 0 && (
                            <Link href="/collector/reports" className="flex items-center gap-1 rounded-full bg-neutral-100 px-3 py-1 text-[11px] font-semibold text-neutral-500 transition-colors hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400">
                                View all <ChevronRight size={11} />
                            </Link>
                        )}
                    </div>
                    <div className="px-4 pb-4">
                        {recentReports.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50/50 px-4 py-10 text-center dark:border-neutral-800 dark:bg-neutral-800/20">
                                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100 dark:bg-neutral-800">
                                    <Scale size={24} className="text-neutral-300 dark:text-neutral-600" />
                                </div>
                                <p className="mt-4 text-sm font-semibold text-neutral-400 dark:text-neutral-500">No reports yet</p>
                                <p className="mt-1 text-xs text-neutral-300 dark:text-neutral-600">Submit your first collection report</p>
                                <Link href="/collector/reports/create" className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 active:scale-[0.96]">
                                    <ClipboardList size={13} /> Create Report
                                </Link>
                            </div>
                        ) : (
                            <ul className="space-y-2">
                                {recentReports.map((r, i) => (
                                    <motion.li key={r.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 + i * 0.05 }}>
                                        <Link href={`/collector/reports/${r.id}`} className="group flex items-center gap-3 rounded-xl bg-neutral-50 p-3 transition-all active:scale-[0.98] hover:bg-neutral-100 dark:bg-neutral-800/40 dark:hover:bg-neutral-800/60">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-neutral-100 dark:bg-neutral-800 dark:ring-neutral-700">
                                                <Recycle size={16} className="text-emerald-600 dark:text-emerald-400" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-semibold text-neutral-900 dark:text-white">{r.zone ?? 'Unknown zone'}</p>
                                                <p className="text-[11px] text-neutral-400">{r.report_date}</p>
                                            </div>
                                            <div className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 ring-1 ring-emerald-100 dark:bg-emerald-950/40 dark:ring-emerald-900/30">
                                                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{r.total} kg</span>
                                            </div>
                                        </Link>
                                    </motion.li>
                                ))}
                            </ul>
                        )}
                    </div>
                </motion.section>

                {/* ===== Performance ===== */}
                <motion.section {...fadeUp(0.35)} className="overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <div className="flex items-center gap-2.5 px-5 pt-5 pb-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-sm shadow-emerald-500/20">
                            <CheckCircle2 size={14} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-neutral-900 dark:text-white">Performance</h2>
                            <p className="text-[10px] text-neutral-400">Your collection overview</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-px bg-neutral-100 dark:bg-neutral-800">
                        {[
                            { label: 'Routes Completed', value: stats.completed_count, icon: Truck, gradient: 'from-emerald-500 to-teal-500' },
                            { label: 'Reports Filed', value: stats.reports_count, icon: ClipboardList, gradient: 'from-blue-500 to-cyan-500' },
                            { label: 'Stops Covered', value: stats.total_stops, icon: MapPin, gradient: 'from-violet-500 to-purple-500' },
                            { label: 'Waste Collected', value: `${stats.total_waste} kg`, icon: Scale, gradient: 'from-amber-500 to-orange-500' },
                        ].map(({ label, value, icon: Icon, gradient }) => (
                            <div key={label} className="flex items-center gap-3 bg-white p-4 dark:bg-neutral-900">
                                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${gradient} shadow-sm`}>
                                    <Icon size={14} className="text-white" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[15px] font-bold text-neutral-900 dark:text-white">{value}</p>
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
