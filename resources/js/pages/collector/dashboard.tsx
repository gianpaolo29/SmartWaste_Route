import { Head, Link } from '@inertiajs/react';
import { CalendarClock, CheckCircle2, Truck, ChevronRight, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import CollectorLayout from '@/layouts/collector-layout';
import type { BreadcrumbItem } from '@/types';

type Route = {
    id: number;
    route_date: string | null;
    status: string;
    zone: { name: string; barangay: string | null } | null;
    stops_count?: number;
};

type Props = {
    today: Route[];
    upcoming: Route[];
    stats: { today_count: number; upcoming_count: number; completed_count: number };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/collector/dashboard' },
];

export default function CollectorDashboard({ today, upcoming, stats }: Props) {
    const cards = [
        { label: 'Today', value: stats.today_count, icon: Truck, gradient: 'from-emerald-500 to-teal-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600 dark:text-emerald-400' },
        { label: 'Upcoming', value: stats.upcoming_count, icon: CalendarClock, gradient: 'from-blue-500 to-cyan-600', bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400' },
        { label: 'Completed', value: stats.completed_count, icon: CheckCircle2, gradient: 'from-violet-500 to-purple-600', bg: 'bg-violet-50 dark:bg-violet-900/20', text: 'text-violet-600 dark:text-violet-400' },
    ];

    return (
        <CollectorLayout breadcrumbs={breadcrumbs}>
            <Head title="Collector Dashboard" />
            <div className="space-y-5 p-5">
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                >
                    <h1 className="text-2xl font-bold tracking-tight">My Collection Day</h1>
                    <p className="mt-1 text-sm text-gray-400">Manage your routes and track progress</p>
                </motion.div>

                <div className="grid gap-4 sm:grid-cols-3">
                    {cards.map(({ label, value, icon: Icon, bg, text }, i) => (
                        <motion.div
                            key={label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: i * 0.08 }}
                            className="premium-card group flex items-center gap-4 border border-gray-100 bg-white p-5 dark:border-white/5 dark:bg-white/[0.02]"
                        >
                            <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${bg}`}>
                                <Icon size={22} className={text} />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-400">{label}</p>
                                <p className="text-2xl font-bold tracking-tight">{value}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.3 }}
                    className="premium-card border border-gray-100 bg-white p-6 dark:border-white/5 dark:bg-white/[0.02]"
                >
                    <div className="mb-4 flex items-center gap-2">
                        <Clock size={16} className="text-emerald-600" />
                        <h2 className="text-lg font-semibold tracking-tight">Today's Routes</h2>
                    </div>
                    {today.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/50 px-6 py-10 text-center dark:border-white/5 dark:bg-white/[0.01]">
                            <Truck size={32} className="mx-auto text-gray-300 dark:text-gray-600" />
                            <p className="mt-3 text-sm text-gray-400">No routes scheduled for today.</p>
                        </div>
                    ) : (
                        <ul className="divide-y divide-gray-50 dark:divide-white/5">
                            {today.map((r) => (
                                <li key={r.id} className="flex items-center justify-between py-4">
                                    <div>
                                        <div className="font-semibold tracking-tight">
                                            {r.zone?.name} <span className="font-normal text-gray-400">({r.zone?.barangay ?? '—'})</span>
                                        </div>
                                        <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-400">
                                            <span>{r.stops_count} stops</span>
                                            <span className="h-1 w-1 rounded-full bg-gray-300" />
                                            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400">{r.status}</span>
                                        </div>
                                    </div>
                                    <Link
                                        href={`/collector/routes/${r.id}`}
                                        className="group/btn inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#1b4332] to-[#2d6a4f] px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-600/10 transition-all hover:-translate-y-0.5 hover:shadow-lg"
                                    >
                                        Open
                                        <ChevronRight size={14} className="transition-transform group-hover/btn:translate-x-0.5" />
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </motion.section>

                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.4 }}
                    className="premium-card border border-gray-100 bg-white p-6 dark:border-white/5 dark:bg-white/[0.02]"
                >
                    <div className="mb-4 flex items-center gap-2">
                        <CalendarClock size={16} className="text-blue-600" />
                        <h2 className="text-lg font-semibold tracking-tight">Upcoming</h2>
                    </div>
                    {upcoming.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/50 px-6 py-10 text-center dark:border-white/5 dark:bg-white/[0.01]">
                            <CalendarClock size={32} className="mx-auto text-gray-300 dark:text-gray-600" />
                            <p className="mt-3 text-sm text-gray-400">Nothing scheduled.</p>
                        </div>
                    ) : (
                        <ul className="divide-y divide-gray-50 dark:divide-white/5">
                            {upcoming.map((r) => (
                                <li key={r.id} className="flex items-center justify-between py-3 text-sm">
                                    <span>
                                        <span className="font-medium">{r.route_date}</span>
                                        <span className="text-gray-400"> — {r.zone?.name} ({r.zone?.barangay ?? '—'})</span>
                                    </span>
                                    <Link
                                        href={`/collector/routes/${r.id}`}
                                        className="font-medium text-emerald-600 transition-colors hover:text-emerald-700 dark:text-emerald-400"
                                    >
                                        View
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </motion.section>
            </div>
        </CollectorLayout>
    );
}
