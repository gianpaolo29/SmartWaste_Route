import { Head } from '@inertiajs/react';
import {
    CheckCircle2, XCircle, SkipForward, Clock,
    Truck, Calendar, Recycle,
} from 'lucide-react';
import { motion } from 'framer-motion';
import ResidentLayout from '@/layouts/resident-layout';

type Pickup = {
    id: number;
    status: string;
    collected_at: string | null;
    date: string | null;
    time: string | null;
    remarks: string | null;
    collector: string | null;
    zone: string | null;
    route_date: string | null;
};

type Props = {
    pickups: Pickup[];
    stats: { total: number; collected: number; skipped: number; failed: number };
};

const statusConfig: Record<string, { label: string; icon: typeof CheckCircle2; color: string; bg: string }> = {
    collected: { label: 'Collected', icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/40' },
    skipped: { label: 'Skipped', icon: SkipForward, color: 'text-neutral-500 dark:text-neutral-400', bg: 'bg-neutral-100 dark:bg-neutral-800' },
    failed: { label: 'Missed', icon: XCircle, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950/40' },
};

const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 16 } as const,
    animate: { opacity: 1, y: 0 } as const,
    transition: { duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
});

export default function PickupHistory({ pickups, stats }: Props) {
    // Group pickups by date
    const grouped = pickups.reduce<Record<string, Pickup[]>>((acc, p) => {
        const key = p.date ?? 'Unknown';
        if (!acc[key]) acc[key] = [];
        acc[key].push(p);
        return acc;
    }, {});

    return (
        <ResidentLayout>
            <Head title="Pickup History" />
            <div className="space-y-5 px-4 py-5 pb-36">

                {/* Header */}
                <motion.div {...fadeUp(0)}>
                    <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">Pickup History</h1>
                    <p className="mt-0.5 text-sm text-neutral-400">Track your waste collection records</p>
                </motion.div>

                {/* Stats */}
                <motion.div {...fadeUp(0.05)} className="grid grid-cols-3 gap-2.5">
                    {[
                        { label: 'Collected', value: stats.collected, color: 'text-emerald-600 dark:text-emerald-400', bg: 'from-emerald-500 to-teal-500', shadow: 'shadow-emerald-500/20', icon: CheckCircle2 },
                        { label: 'Skipped', value: stats.skipped, color: 'text-neutral-500', bg: 'from-neutral-400 to-neutral-500', shadow: 'shadow-neutral-400/20', icon: SkipForward },
                        { label: 'Missed', value: stats.failed, color: 'text-red-600 dark:text-red-400', bg: 'from-red-500 to-rose-500', shadow: 'shadow-red-500/20', icon: XCircle },
                    ].map((s) => (
                        <div key={s.label} className="overflow-hidden rounded-2xl border border-neutral-100 bg-white p-3.5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                            <div className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${s.bg} shadow-md ${s.shadow}`}>
                                <s.icon size={15} className="text-white" />
                            </div>
                            <p className="mt-2.5 text-xl font-bold tracking-tight text-neutral-900 dark:text-white">{s.value}</p>
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">{s.label}</p>
                        </div>
                    ))}
                </motion.div>

                {/* Timeline */}
                {pickups.length === 0 ? (
                    <motion.div {...fadeUp(0.1)} className="rounded-2xl border border-dashed border-neutral-200 bg-white px-4 py-12 text-center shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-100 dark:bg-neutral-800">
                            <Recycle size={28} className="text-neutral-300 dark:text-neutral-600" />
                        </div>
                        <p className="mt-4 text-sm font-semibold text-neutral-400">No pickup history yet</p>
                        <p className="mt-1 text-xs text-neutral-300 dark:text-neutral-600">Records will appear here after your first collection</p>
                    </motion.div>
                ) : (
                    <div className="space-y-4">
                        {Object.entries(grouped).map(([date, items], gi) => (
                            <motion.div key={date} {...fadeUp(0.1 + gi * 0.05)}>
                                {/* Date header */}
                                <div className="mb-2 flex items-center gap-2">
                                    <Calendar size={13} className="text-neutral-400" />
                                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">{date}</span>
                                </div>

                                {/* Cards */}
                                <div className="space-y-2">
                                    {items.map((p) => {
                                        const cfg = statusConfig[p.status] ?? statusConfig.collected;
                                        const StatusIcon = cfg.icon;
                                        return (
                                            <div key={p.id} className="overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                                                <div className="flex items-center gap-3 p-4">
                                                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${cfg.bg}`}>
                                                        <StatusIcon size={18} className={cfg.color} />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center justify-between gap-2">
                                                            <p className="text-sm font-semibold text-neutral-900 dark:text-white">{cfg.label}</p>
                                                            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${cfg.bg} ${cfg.color}`}>
                                                                {cfg.label}
                                                            </span>
                                                        </div>
                                                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-neutral-400">
                                                            {p.time && (
                                                                <span className="flex items-center gap-1">
                                                                    <Clock size={11} /> {p.time}
                                                                </span>
                                                            )}
                                                            {p.collector && (
                                                                <span className="flex items-center gap-1">
                                                                    <Truck size={11} /> {p.collector}
                                                                </span>
                                                            )}
                                                            {p.zone && (
                                                                <span>{p.zone}</span>
                                                            )}
                                                        </div>
                                                        {p.remarks && (
                                                            <p className="mt-1.5 text-xs italic text-neutral-400 dark:text-neutral-500">"{p.remarks}"</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </ResidentLayout>
    );
}
