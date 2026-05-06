import { Head, Link } from '@inertiajs/react';
import { CalendarClock, ChevronLeft, FileText, MapPin, Recycle, Scale } from 'lucide-react';
import { motion } from 'framer-motion';
import CollectorLayout from '@/layouts/collector-layout';

type Report = {
    id: number;
    report_date: string;
    mixed_waste: number;
    biodegradable: number;
    recyclable: number;
    residual: number;
    solid_waste: number;
    total: number;
    notes: string | null;
    zone: { name: string; barangay: string | null } | null;
    route_date: string | null;
    created_at: string;
};

const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 16 } as const,
    animate: { opacity: 1, y: 0 } as const,
    transition: { duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
});

const wasteConfig = [
    { key: 'mixed_waste' as const, label: 'Mixed Waste', color: 'bg-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/30', text: 'text-amber-700 dark:text-amber-400' },
    { key: 'biodegradable' as const, label: 'Biodegradable', color: 'bg-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/30', text: 'text-emerald-700 dark:text-emerald-400' },
    { key: 'recyclable' as const, label: 'Recyclable', color: 'bg-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/30', text: 'text-blue-700 dark:text-blue-400' },
    { key: 'residual' as const, label: 'Residual', color: 'bg-neutral-400', bg: 'bg-neutral-100 dark:bg-neutral-800/50', text: 'text-neutral-700 dark:text-neutral-400' },
    { key: 'solid_waste' as const, label: 'Solid Waste', color: 'bg-red-400', bg: 'bg-red-50 dark:bg-red-950/30', text: 'text-red-700 dark:text-red-400' },
];

export default function ReportsShow({ report }: { report: Report }) {
    return (
        <CollectorLayout>
            <Head title="Report Details" />
            <div className="mx-auto space-y-4 px-4 py-5 pb-36 max-w-2xl lg:max-w-none">

                {/* Header */}
                <motion.div {...fadeUp(0)} className="flex items-center gap-3">
                    <Link href="/collector/reports" className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-neutral-600 transition-colors hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400">
                        <ChevronLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">Report Details</h1>
                        <p className="text-xs text-neutral-400">{report.report_date}</p>
                    </div>
                </motion.div>

                {/* Total card */}
                <motion.div {...fadeUp(0.05)} className="overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 p-5 text-white shadow-lg shadow-emerald-600/15">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-white/60">Total Waste Collected</p>
                            <p className="mt-1 text-3xl font-bold">{report.total.toFixed(1)} <span className="text-lg font-normal text-white/70">kg</span></p>
                        </div>
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
                            <Scale size={26} className="text-white" />
                        </div>
                    </div>
                </motion.div>

                {/* Route info */}
                <motion.div {...fadeUp(0.1)} className="overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <div className="grid grid-cols-2 divide-x divide-neutral-100 dark:divide-neutral-800">
                        <div className="flex items-center gap-3 p-4">
                            <CalendarClock size={16} className="shrink-0 text-neutral-400" />
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">Report Date</p>
                                <p className="text-sm font-semibold text-neutral-900 dark:text-white">{report.report_date}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-4">
                            <CalendarClock size={16} className="shrink-0 text-neutral-400" />
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">Route Date</p>
                                <p className="text-sm font-semibold text-neutral-900 dark:text-white">{report.route_date ?? '—'}</p>
                            </div>
                        </div>
                    </div>
                    <div className="border-t border-neutral-100 dark:border-neutral-800">
                        <div className="flex items-center gap-3 p-4">
                            <MapPin size={16} className="shrink-0 text-neutral-400" />
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">Zone</p>
                                <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                                    {report.zone ? `${report.zone.name} (${report.zone.barangay ?? '—'})` : '—'}
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Waste breakdown */}
                <motion.div {...fadeUp(0.15)} className="overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <div className="flex items-center gap-2 px-5 pt-5 pb-3">
                        <Recycle size={16} className="text-emerald-600 dark:text-emerald-400" />
                        <h2 className="text-sm font-bold text-neutral-900 dark:text-white">Waste Breakdown</h2>
                    </div>

                    {/* Visual bar */}
                    {report.total > 0 && (
                        <div className="flex gap-0.5 px-5">
                            {wasteConfig.map((item) => (
                                <div key={item.key} className={`h-2.5 rounded-full ${item.color} transition-all`}
                                    style={{ width: `${(report[item.key] / report.total) * 100}%` }} />
                            ))}
                        </div>
                    )}

                    <div className="space-y-2 p-4">
                        {wasteConfig.map((item, i) => (
                            <motion.div key={item.key} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.04 }}
                                className={`flex items-center justify-between rounded-xl ${item.bg} px-4 py-3`}
                            >
                                <span className="flex items-center gap-2 text-sm font-medium">
                                    <span className={`h-2.5 w-2.5 rounded-full ${item.color}`} />
                                    <span className={item.text}>{item.label}</span>
                                </span>
                                <span className="text-sm font-bold text-neutral-900 dark:text-white">{report[item.key].toFixed(2)} kg</span>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* Notes */}
                {report.notes && (
                    <motion.div {...fadeUp(0.2)} className="overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                        <div className="flex items-center gap-2 px-5 pt-5 pb-3">
                            <FileText size={16} className="text-neutral-400" />
                            <h2 className="text-sm font-bold text-neutral-900 dark:text-white">Notes</h2>
                        </div>
                        <div className="px-5 pb-5">
                            <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">{report.notes}</p>
                        </div>
                    </motion.div>
                )}
            </div>
        </CollectorLayout>
    );
}
