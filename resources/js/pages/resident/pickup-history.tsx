import { Head } from '@inertiajs/react';
import {
    CheckCircle2, XCircle, SkipForward, Clock,
    Truck, Recycle, Camera, X, Eye, MapPin,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
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
    proof_photo: string | null;
};

type Props = {
    pickups: Pickup[];
    stats: { total: number; collected: number; skipped: number; failed: number };
};

const statusConfig: Record<string, { label: string; icon: typeof CheckCircle2; color: string; bg: string; dot: string }> = {
    collected: { label: 'Collected', icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/40', dot: 'bg-emerald-500' },
    skipped: { label: 'Skipped', icon: SkipForward, color: 'text-neutral-500 dark:text-neutral-400', bg: 'bg-neutral-100 dark:bg-neutral-800', dot: 'bg-neutral-400' },
    failed: { label: 'Missed', icon: XCircle, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950/40', dot: 'bg-red-500' },
};

export default function PickupHistory({ pickups, stats }: Props) {
    const [selected, setSelected] = useState<Pickup | null>(null);

    return (
        <ResidentLayout>
            <Head title="Pickup History" />
            <div className="space-y-5 px-4 py-5 pb-36">

                {/* Header */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">Pickup History</h1>
                    <p className="mt-0.5 text-sm text-neutral-400">Track your waste collection records</p>
                </motion.div>

                {/* Stats */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                    className="grid grid-cols-3 gap-2.5">
                    {[
                        { label: 'Collected', value: stats.collected, gradient: 'from-emerald-500 to-teal-500', shadow: 'shadow-emerald-500/20', icon: CheckCircle2 },
                        { label: 'Skipped', value: stats.skipped, gradient: 'from-neutral-400 to-neutral-500', shadow: 'shadow-neutral-400/20', icon: SkipForward },
                        { label: 'Missed', value: stats.failed, gradient: 'from-red-500 to-rose-500', shadow: 'shadow-red-500/20', icon: XCircle },
                    ].map((s) => (
                        <div key={s.label} className="overflow-hidden rounded-2xl border border-neutral-100 bg-white p-3.5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                            <div className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${s.gradient} shadow-md ${s.shadow}`}>
                                <s.icon size={15} className="text-white" />
                            </div>
                            <p className="mt-2.5 text-xl font-bold text-neutral-900 dark:text-white">{s.value}</p>
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">{s.label}</p>
                        </div>
                    ))}
                </motion.div>

                {/* Table */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    className="overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    {pickups.length === 0 ? (
                        <div className="px-4 py-14 text-center">
                            <Recycle size={32} className="mx-auto text-neutral-200 dark:text-neutral-700" />
                            <p className="mt-3 text-sm font-medium text-neutral-400">No pickup history yet</p>
                            <p className="mt-1 text-xs text-neutral-300 dark:text-neutral-600">Records will appear after your first collection</p>
                        </div>
                    ) : (
                        <>
                            {/* Table header — hidden on mobile */}
                            <div className="hidden border-b border-neutral-100 bg-neutral-50/50 px-4 py-2.5 sm:grid sm:grid-cols-[1fr_1fr_1fr_80px_60px] sm:gap-3 dark:border-neutral-800 dark:bg-neutral-800/30">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Date</span>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Collector</span>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Zone</span>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Status</span>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 text-right">Action</span>
                            </div>

                            {/* Rows */}
                            <div className="divide-y divide-neutral-50 dark:divide-neutral-800">
                                {pickups.map((p) => {
                                    const cfg = statusConfig[p.status] ?? statusConfig.collected;
                                    return (
                                        <div key={p.id}
                                            className="group px-4 py-3 transition-colors hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 sm:grid sm:grid-cols-[1fr_1fr_1fr_80px_60px] sm:items-center sm:gap-3">
                                            {/* Date */}
                                            <div>
                                                <p className="text-sm font-medium text-neutral-900 dark:text-white">{p.date ?? '—'}</p>
                                                <p className="text-[11px] text-neutral-400 sm:hidden">{p.time} · {p.collector ?? 'Unknown'}</p>
                                                <p className="hidden text-[11px] text-neutral-400 sm:block">{p.time}</p>
                                            </div>

                                            {/* Collector */}
                                            <div className="hidden sm:block">
                                                <p className="truncate text-xs text-neutral-600 dark:text-neutral-400">{p.collector ?? '—'}</p>
                                            </div>

                                            {/* Zone */}
                                            <div className="hidden sm:block">
                                                <p className="truncate text-xs text-neutral-600 dark:text-neutral-400">{p.zone ?? '—'}</p>
                                            </div>

                                            {/* Status */}
                                            <div className="mt-1.5 sm:mt-0">
                                                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${cfg.bg} ${cfg.color}`}>
                                                    <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                                                    {cfg.label}
                                                </span>
                                            </div>

                                            {/* View button */}
                                            <div className="mt-2 sm:mt-0 sm:text-right">
                                                <button onClick={() => setSelected(p)}
                                                    className="inline-flex items-center gap-1 rounded-lg bg-neutral-100 px-2.5 py-1.5 text-[11px] font-semibold text-neutral-600 transition-all hover:bg-emerald-50 hover:text-emerald-600 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-400">
                                                    <Eye size={12} /> View
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </motion.div>
            </div>

            {/* Detail modal */}
            <AnimatePresence>
                {selected && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
                        onClick={() => setSelected(null)}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                            className="w-full max-w-md overflow-hidden rounded-2xl border border-neutral-200/60 bg-white shadow-2xl dark:border-neutral-700/60 dark:bg-neutral-900"
                            onClick={(e) => e.stopPropagation()}>

                            {/* Header */}
                            <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4 dark:border-neutral-800">
                                <h3 className="text-sm font-bold text-neutral-900 dark:text-white">Collection Details</h3>
                                <button onClick={() => setSelected(null)} className="rounded-full p-1.5 text-neutral-400 transition-all hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800">
                                    <X size={16} />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="space-y-4 p-5">
                                {/* Status badge */}
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-neutral-400">Status</span>
                                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${statusConfig[selected.status]?.bg ?? ''} ${statusConfig[selected.status]?.color ?? ''}`}>
                                        <span className={`h-2 w-2 rounded-full ${statusConfig[selected.status]?.dot ?? 'bg-neutral-400'}`} />
                                        {statusConfig[selected.status]?.label ?? selected.status}
                                    </span>
                                </div>

                                {/* Info rows */}
                                <div className="space-y-2.5 rounded-xl border border-neutral-100 bg-neutral-50/50 p-3.5 dark:border-neutral-800 dark:bg-neutral-800/30">
                                    {[
                                        { icon: Clock, label: 'Date & Time', value: `${selected.date ?? '—'} at ${selected.time ?? '—'}` },
                                        { icon: Truck, label: 'Collector', value: selected.collector ?? 'Unknown' },
                                        { icon: MapPin, label: 'Zone', value: selected.zone ?? '—' },
                                    ].map(({ icon: Icon, label, value }) => (
                                        <div key={label} className="flex items-center justify-between">
                                            <span className="flex items-center gap-2 text-xs text-neutral-400">
                                                <Icon size={12} /> {label}
                                            </span>
                                            <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">{value}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Remarks */}
                                {selected.remarks && (
                                    <div>
                                        <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400">Remarks</p>
                                        <p className="text-xs italic text-neutral-500 dark:text-neutral-400">"{selected.remarks}"</p>
                                    </div>
                                )}

                                {/* Proof photo */}
                                {selected.proof_photo ? (
                                    <div>
                                        <p className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                                            <Camera size={11} /> Collection Proof
                                        </p>
                                        <img src={selected.proof_photo} alt="Collection proof"
                                            className="w-full rounded-xl border border-neutral-100 object-cover dark:border-neutral-800" style={{ maxHeight: '250px' }} />
                                    </div>
                                ) : (
                                    <div className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50/50 py-5 text-center dark:border-neutral-800 dark:bg-neutral-800/20">
                                        <Camera size={20} className="mx-auto text-neutral-300 dark:text-neutral-600" />
                                        <p className="mt-1.5 text-xs text-neutral-400">No proof photo</p>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="border-t border-neutral-100 px-5 py-3 dark:border-neutral-800">
                                <button onClick={() => setSelected(null)}
                                    className="w-full rounded-xl bg-neutral-100 py-2.5 text-xs font-semibold text-neutral-600 transition-all hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700">
                                    Close
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </ResidentLayout>
    );
}
