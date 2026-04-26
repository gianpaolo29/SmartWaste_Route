import { Head, Link } from '@inertiajs/react';
import { AlertTriangle, CalendarClock, Home, MapPin, Clock, FileText, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import ResidentLayout from '@/layouts/resident-layout';
import { ResidentMap } from '@/components/resident-map';
import type { BreadcrumbItem } from '@/types';

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

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/resident/dashboard' },
];

export default function ResidentDashboard({ mapsApiKey, household, upcoming, reports }: Props) {
    return (
        <ResidentLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="space-y-5 p-5">
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                >
                    <h1 className="text-2xl font-bold tracking-tight">My Household</h1>
                    <p className="mt-1 text-sm text-gray-400">Track your waste collection and area details</p>
                </motion.div>

                <div className="grid gap-4 lg:grid-cols-3">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.08 }}
                        className="premium-card border border-gray-100 bg-white p-5 lg:col-span-2 dark:border-white/5 dark:bg-white/[0.02]"
                    >
                        <div className="flex items-start gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-900/20">
                                <Home size={22} className="text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div className="flex-1">
                                <p className="text-lg font-semibold tracking-tight">{household.address ?? 'No address'}</p>
                                <div className="mt-1 flex items-center gap-2 text-sm text-gray-400">
                                    <MapPin size={13} />
                                    {household.zone
                                        ? `${household.zone.name} (${household.zone.barangay ?? '—'})`
                                        : 'No zone assigned'}
                                </div>
                                <p className="mt-1.5 text-xs text-gray-300 dark:text-gray-600">
                                    {household.lat.toFixed(5)}, {household.lng.toFixed(5)}
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.16 }}
                    >
                        <Link
                            href="/resident/missed-pickup"
                            className="premium-card group flex h-full items-center gap-4 border border-amber-100 bg-gradient-to-br from-amber-50 to-orange-50 p-5 transition-all hover:border-amber-200 hover:shadow-lg hover:shadow-amber-500/5 dark:border-amber-900/30 dark:from-amber-900/10 dark:to-orange-900/10"
                        >
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/20">
                                <AlertTriangle size={22} />
                            </div>
                            <div className="flex-1">
                                <p className="font-semibold text-amber-900 dark:text-amber-200">Report Missed Pickup</p>
                                <p className="mt-0.5 text-xs text-amber-600 dark:text-amber-400">Tap to file a report</p>
                            </div>
                            <ChevronRight size={16} className="text-amber-400 transition-transform group-hover:translate-x-1" />
                        </Link>
                    </motion.div>
                </div>

                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.24 }}
                    className="premium-card border border-gray-100 bg-white p-6 dark:border-white/5 dark:bg-white/[0.02]"
                >
                    <div className="mb-4 flex items-center gap-2">
                        <MapPin size={16} className="text-emerald-600" />
                        <h2 className="text-lg font-semibold tracking-tight">My Area</h2>
                    </div>
                    <div className="overflow-hidden rounded-2xl">
                        <ResidentMap
                            apiKey={mapsApiKey}
                            home={{
                                lat: household.lat,
                                lng: household.lng,
                                address: household.address,
                            }}
                        />
                    </div>
                </motion.section>

                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.32 }}
                    className="premium-card border border-gray-100 bg-white p-6 dark:border-white/5 dark:bg-white/[0.02]"
                >
                    <div className="mb-4 flex items-center gap-2">
                        <CalendarClock size={16} className="text-emerald-600 dark:text-emerald-400" />
                        <h2 className="text-lg font-semibold tracking-tight">Upcoming Collections</h2>
                    </div>
                    {upcoming.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/50 px-6 py-10 text-center dark:border-white/5 dark:bg-white/[0.01]">
                            <Clock size={32} className="mx-auto text-gray-300 dark:text-gray-600" />
                            <p className="mt-3 text-sm text-gray-400">No upcoming collections scheduled.</p>
                        </div>
                    ) : (
                        <ul className="divide-y divide-gray-50 text-sm dark:divide-white/5">
                            {upcoming.map((u) => (
                                <li key={u.id} className="flex items-center justify-between py-3">
                                    <span>
                                        <span className="font-semibold">{u.route_date}</span>
                                        <span className="text-gray-400"> — {u.collector ?? 'Unassigned'}</span>
                                    </span>
                                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400">
                                        {u.status}
                                    </span>
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
                        <FileText size={16} className="text-amber-600 dark:text-amber-400" />
                        <h2 className="text-lg font-semibold tracking-tight">My Recent Reports</h2>
                    </div>
                    {reports.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/50 px-6 py-10 text-center dark:border-white/5 dark:bg-white/[0.01]">
                            <FileText size={32} className="mx-auto text-gray-300 dark:text-gray-600" />
                            <p className="mt-3 text-sm text-gray-400">No reports filed.</p>
                        </div>
                    ) : (
                        <ul className="divide-y divide-gray-50 text-sm dark:divide-white/5">
                            {reports.map((r) => (
                                <li key={r.id} className="py-3">
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium">{r.report_datetime}</span>
                                        <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
                                            {r.status}
                                        </span>
                                    </div>
                                    <p className="mt-1 text-xs text-gray-400">{r.description}</p>
                                </li>
                            ))}
                        </ul>
                    )}
                </motion.section>
            </div>
        </ResidentLayout>
    );
}
