import { Head, Link, router } from '@inertiajs/react';
import { CalendarClock, ChevronRight, Clock, MapPin, Truck } from 'lucide-react';
import { motion } from 'framer-motion';
import CollectorLayout from '@/layouts/collector-layout';

type Route = {
    id: number;
    route_date: string | null;
    status: string;
    zone: { name: string; barangay: string | null } | null;
    stops_count: number;
};

type Props = {
    today: Route[];
    upcoming: Route[];
    routes: Route[];
    filter: string | null;
};

const FILTERS = [
    { label: 'All', value: '' },
    { label: 'Planned', value: 'planned' },
    { label: 'In Progress', value: 'in_progress' },
    { label: 'Completed', value: 'completed' },
];

const statusColor = (status: string) => {
    if (status === 'completed') return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400';
    if (status === 'in_progress') return 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400';
    if (status === 'planned') return 'bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400';
    return 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400';
};

const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 18 } as const,
    animate: { opacity: 1, y: 0 } as const,
    transition: { duration: 0.4, delay, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
});

export default function CollectorRoutesIndex({ today, upcoming, routes, filter }: Props) {
    return (
        <CollectorLayout>
            <Head title="My Routes" />
            <div className="space-y-4 px-4 py-5">

                <motion.div {...fadeUp()}>
                    <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">My Routes</h1>
                    <p className="mt-1 text-sm text-neutral-400">Manage your collection routes</p>
                </motion.div>

                {/* ===== Today's Routes ===== */}
                <motion.section {...fadeUp(0.05)} className="overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <div className="flex items-center justify-between px-4 pt-4 pb-3">
                        <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/50">
                                <Clock size={14} className="text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">Today</h2>
                        </div>
                        {today.length > 0 && (
                            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400">{today.length}</span>
                        )}
                    </div>
                    <div className="px-4 pb-4">
                        {today.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50/50 px-4 py-6 text-center dark:border-neutral-800 dark:bg-neutral-800/20">
                                <Truck size={24} className="mx-auto text-neutral-300 dark:text-neutral-600" />
                                <p className="mt-2 text-sm text-neutral-400">No routes today</p>
                            </div>
                        ) : (
                            <ul className="space-y-2">
                                {today.map((r) => (
                                    <li key={r.id}>
                                        <Link href={`/collector/routes/${r.id}`} className="flex items-center gap-3 rounded-xl bg-neutral-50 p-3 transition-all active:scale-[0.98] dark:bg-neutral-800/40">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white dark:bg-neutral-800">
                                                <Truck size={18} className="text-emerald-600 dark:text-emerald-400" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                                                    {r.zone?.name} <span className="font-normal text-neutral-400">({r.zone?.barangay ?? '—'})</span>
                                                </p>
                                                <p className="mt-0.5 text-xs text-neutral-400">{r.stops_count} stops</p>
                                            </div>
                                            <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${statusColor(r.status)}`}>{r.status}</span>
                                            <ChevronRight size={16} className="shrink-0 text-neutral-300 dark:text-neutral-600" />
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </motion.section>

                {/* ===== Upcoming ===== */}
                <motion.section {...fadeUp(0.1)} className="overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <div className="flex items-center justify-between px-4 pt-4 pb-3">
                        <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/50">
                                <CalendarClock size={14} className="text-blue-600 dark:text-blue-400" />
                            </div>
                            <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">Upcoming</h2>
                        </div>
                        {upcoming.length > 0 && (
                            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-600 dark:bg-blue-900/40 dark:text-blue-400">{upcoming.length}</span>
                        )}
                    </div>
                    <div className="px-4 pb-4">
                        {upcoming.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50/50 px-4 py-6 text-center dark:border-neutral-800 dark:bg-neutral-800/20">
                                <CalendarClock size={24} className="mx-auto text-neutral-300 dark:text-neutral-600" />
                                <p className="mt-2 text-sm text-neutral-400">Nothing scheduled</p>
                            </div>
                        ) : (
                            <ul className="space-y-2">
                                {upcoming.map((r) => (
                                    <li key={r.id}>
                                        <Link href={`/collector/routes/${r.id}`} className="flex items-center gap-3 rounded-xl bg-neutral-50 p-3 transition-all active:scale-[0.98] dark:bg-neutral-800/40">
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white dark:bg-neutral-800">
                                                <CalendarClock size={16} className="text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-medium text-neutral-900 dark:text-white">{r.route_date}</p>
                                                <p className="text-xs text-neutral-400">{r.zone?.name} ({r.zone?.barangay ?? '—'}) · {r.stops_count} stops</p>
                                            </div>
                                            <ChevronRight size={16} className="shrink-0 text-neutral-300 dark:text-neutral-600" />
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </motion.section>

                {/* ===== All Routes ===== */}
                <motion.section {...fadeUp(0.15)} className="overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <div className="flex items-center justify-between px-4 pt-4 pb-3">
                        <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-100 dark:bg-neutral-800">
                                <MapPin size={14} className="text-neutral-600 dark:text-neutral-400" />
                            </div>
                            <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">All Routes</h2>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="flex gap-2 px-4 pb-3 overflow-x-auto">
                        {FILTERS.map((f) => (
                            <button
                                key={f.value || 'all'}
                                onClick={() =>
                                    router.get('/collector/routes', f.value ? { status: f.value } : {}, { preserveState: false })
                                }
                                className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                                    (filter ?? '') === f.value
                                        ? 'bg-emerald-600 text-white shadow-sm'
                                        : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
                                }`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>

                    <div className="px-4 pb-4">
                        {routes.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50/50 px-4 py-6 text-center dark:border-neutral-800 dark:bg-neutral-800/20">
                                <p className="text-sm text-neutral-400">No routes found</p>
                            </div>
                        ) : (
                            <ul className="space-y-2">
                                {routes.map((r) => (
                                    <li key={r.id}>
                                        <Link href={`/collector/routes/${r.id}`} className="flex items-center gap-3 rounded-xl bg-neutral-50 p-3 transition-all active:scale-[0.98] dark:bg-neutral-800/40">
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white dark:bg-neutral-800">
                                                <Truck size={16} className="text-neutral-500 dark:text-neutral-400" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-medium text-neutral-900 dark:text-white">
                                                    {r.zone?.name} <span className="text-neutral-400">({r.zone?.barangay ?? '—'})</span>
                                                </p>
                                                <p className="text-xs text-neutral-400">{r.route_date ?? '—'} · {r.stops_count} stops</p>
                                            </div>
                                            <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${statusColor(r.status)}`}>{r.status}</span>
                                            <ChevronRight size={16} className="shrink-0 text-neutral-300 dark:text-neutral-600" />
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </motion.section>

            </div>
        </CollectorLayout>
    );
}
