import { Head, Link, usePage } from '@inertiajs/react';
import { AlertTriangle, CalendarClock, ChevronRight, Clock, FileText, Home, MapPin, Navigation, Recycle } from 'lucide-react';
import { motion } from 'framer-motion';
import ResidentLayout from '@/layouts/resident-layout';
import { ResidentMap } from '@/components/resident-map';
import type { BreadcrumbItem, User } from '@/types';

type Props = {
    mapsApiKey: string;
    household: {
        address: string | null;
        lat: number;
        lng: number;
        zone: { id: number; name: string; barangay: string | null } | null;
    };
    upcoming: { id: number; route_date: string | null; status: string; collector: string | null }[];
    reports: { id: number; description: string; status: string; report_datetime: string | null }[];
};

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Home', href: '/resident/dashboard' }];

const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 18 } as const,
    animate: { opacity: 1, y: 0 } as const,
    transition: { duration: 0.4, delay, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
});

const statusColor = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'completed' || s === 'collected') return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400';
    if (s === 'in_progress' || s === 'in progress') return 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400';
    if (s === 'resolved') return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400';
    if (s === 'pending') return 'bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400';
    return 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400';
};

export default function ResidentDashboard({ mapsApiKey, household, upcoming, reports }: Props) {
    const { auth } = usePage().props as { auth: { user: User } };
    const firstName = auth.user.name.split(' ')[0];
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

    return (
        <ResidentLayout breadcrumbs={breadcrumbs}>
            <Head title="Home" />
            <div className="space-y-4 px-4 py-5 pb-36">
                {/* ===== Greeting ===== */}
                <motion.div {...fadeUp()}>
                    <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">{greeting},</p>
                    <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">{firstName}</h1>
                </motion.div>

                {/* ===== Household Card ===== */}
                <motion.div {...fadeUp(0.05)} className="overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 p-4 shadow-lg shadow-emerald-600/15 dark:from-emerald-700 dark:to-teal-700">
                    <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
                            <Home size={20} className="text-white" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-base font-semibold text-white">{household.address ?? 'No address set'}</p>
                            <div className="mt-0.5 flex items-center gap-1.5 text-sm text-white/70">
                                <MapPin size={12} />
                                {household.zone
                                    ? `${household.zone.name} · ${household.zone.barangay ?? '—'}`
                                    : 'No zone assigned'}
                            </div>
                        </div>
                        <Link href="/resident/location/setup" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/15 text-white/80 backdrop-blur-sm transition-colors hover:bg-white/25">
                            <Navigation size={14} />
                        </Link>
                    </div>
                    <div className="mt-3 flex items-center gap-4 border-t border-white/15 pt-3 text-xs text-white/50">
                        <span>{household.lat.toFixed(5)}, {household.lng.toFixed(5)}</span>
                    </div>
                </motion.div>

                {/* ===== Quick Actions ===== */}
                <motion.div {...fadeUp(0.1)} className="grid grid-cols-2 gap-3">
                    <Link href="/resident/missed-pickup"
                        className="group flex items-center gap-3 rounded-2xl border border-neutral-100 bg-white p-3.5 shadow-sm transition-all active:scale-[0.97] dark:border-neutral-800 dark:bg-neutral-900">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/40">
                            <AlertTriangle size={18} className="text-amber-600 dark:text-amber-400" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs font-semibold text-neutral-900 dark:text-white">Missed Pickup</p>
                            <p className="text-[11px] text-neutral-400">File a report</p>
                        </div>
                    </Link>
                    <div className="flex items-center gap-3 rounded-2xl border border-neutral-100 bg-white p-3.5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/40">
                            <Recycle size={18} className="text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs font-semibold text-neutral-900 dark:text-white">Collections</p>
                            <p className="text-[11px] text-neutral-400">{upcoming.length} upcoming</p>
                        </div>
                    </div>
                </motion.div>

                {/* ===== Map ===== */}
                <motion.section {...fadeUp(0.15)} className="overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <div className="flex items-center justify-between px-4 pt-4 pb-3">
                        <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/50">
                                <MapPin size={14} className="text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">My Area</h2>
                        </div>
                    </div>
                    <div className="px-4 pb-4">
                        <div className="overflow-hidden rounded-xl">
                            <ResidentMap apiKey={mapsApiKey} home={{ lat: household.lat, lng: household.lng, address: household.address }} />
                        </div>
                    </div>
                </motion.section>

                {/* ===== Upcoming Collections ===== */}
                <motion.section {...fadeUp(0.2)} className="overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <div className="flex items-center justify-between px-4 pt-4 pb-3">
                        <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/50">
                                <CalendarClock size={14} className="text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">Upcoming Collections</h2>
                        </div>
                        {upcoming.length > 0 && (
                            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400">{upcoming.length}</span>
                        )}
                    </div>
                    <div className="px-4 pb-4">
                        {upcoming.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50/50 px-4 py-8 text-center dark:border-neutral-800 dark:bg-neutral-800/20">
                                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
                                    <Clock size={22} className="text-neutral-400 dark:text-neutral-500" />
                                </div>
                                <p className="mt-3 text-sm font-medium text-neutral-400 dark:text-neutral-500">No upcoming collections</p>
                                <p className="mt-0.5 text-xs text-neutral-300 dark:text-neutral-600">Check back later for scheduled pickups</p>
                            </div>
                        ) : (
                            <ul className="space-y-2">
                                {upcoming.map((u) => (
                                    <li key={u.id} className="flex items-center gap-3 rounded-xl bg-neutral-50 p-3 dark:bg-neutral-800/40">
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white dark:bg-neutral-800">
                                            <CalendarClock size={16} className="text-emerald-600 dark:text-emerald-400" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium text-neutral-900 dark:text-white">{u.route_date}</p>
                                            <p className="text-xs text-neutral-400 dark:text-neutral-500">{u.collector ?? 'Unassigned'}</p>
                                        </div>
                                        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${statusColor(u.status)}`}>{u.status}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </motion.section>

                {/* ===== Recent Reports ===== */}
                <motion.section {...fadeUp(0.25)} className="overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <div className="flex items-center justify-between px-4 pt-4 pb-3">
                        <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950/40">
                                <FileText size={14} className="text-amber-600 dark:text-amber-400" />
                            </div>
                            <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">Recent Reports</h2>
                        </div>
                        {reports.length > 0 && (
                            <Link href="/resident/missed-pickup" className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                                View all <ChevronRight size={12} />
                            </Link>
                        )}
                    </div>
                    <div className="px-4 pb-4">
                        {reports.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50/50 px-4 py-8 text-center dark:border-neutral-800 dark:bg-neutral-800/20">
                                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
                                    <FileText size={22} className="text-neutral-400 dark:text-neutral-500" />
                                </div>
                                <p className="mt-3 text-sm font-medium text-neutral-400 dark:text-neutral-500">No reports filed</p>
                                <p className="mt-0.5 text-xs text-neutral-300 dark:text-neutral-600">Missed a pickup? Report it above</p>
                            </div>
                        ) : (
                            <ul className="space-y-2">
                                {reports.map((r) => (
                                    <li key={r.id} className="rounded-xl bg-neutral-50 p-3 dark:bg-neutral-800/40">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-medium text-neutral-900 dark:text-white">{r.report_datetime}</p>
                                            <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${statusColor(r.status)}`}>{r.status}</span>
                                        </div>
                                        <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2">{r.description}</p>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </motion.section>
            </div>
        </ResidentLayout>
    );
}
