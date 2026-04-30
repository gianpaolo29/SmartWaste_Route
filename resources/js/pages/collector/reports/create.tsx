import { Head, useForm, Link } from '@inertiajs/react';
import { ChevronLeft, ClipboardList } from 'lucide-react';
import { motion } from 'framer-motion';
import CollectorLayout from '@/layouts/collector-layout';
import type { FormEventHandler } from 'react';

type RouteOption = {
    id: number;
    route_date: string | null;
    zone: string;
};

const inputCls = 'w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-sm text-neutral-900 outline-none transition-colors focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 dark:border-neutral-700 dark:bg-neutral-800/50 dark:text-white dark:focus:border-emerald-700';

const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 16 } as const,
    animate: { opacity: 1, y: 0 } as const,
    transition: { duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
});

export default function ReportsCreate({ routes, route_id }: { routes: RouteOption[]; route_id?: string }) {
    const { data, setData, post, processing, errors } = useForm({
        route_plan_id: route_id ?? '',
        mixed_waste: '',
        biodegradable: '',
        recyclable: '',
        residual: '',
        solid_waste: '',
        notes: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/collector/reports');
    };

    const total =
        (parseFloat(data.mixed_waste) || 0) +
        (parseFloat(data.biodegradable) || 0) +
        (parseFloat(data.recyclable) || 0) +
        (parseFloat(data.residual) || 0) +
        (parseFloat(data.solid_waste) || 0);

    return (
        <CollectorLayout>
            <Head title="New Collection Report" />
            <div className="mx-auto max-w-2xl space-y-4 px-4 py-5 pb-36">

                {/* Header */}
                <motion.div {...fadeUp(0)} className="flex items-center gap-3">
                    <Link href="/collector/reports" className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-neutral-600 transition-colors hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400">
                        <ChevronLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">New Report</h1>
                        <p className="text-xs text-neutral-400">Submit a collection report</p>
                    </div>
                </motion.div>

                <motion.form {...fadeUp(0.05)} onSubmit={submit} className="space-y-4 rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    {/* Route */}
                    <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-neutral-400">Completed Route</label>
                        <select value={data.route_plan_id} onChange={(e) => setData('route_plan_id', e.target.value)} className={inputCls}>
                            <option value="">Select a route...</option>
                            {routes.map((r) => (
                                <option key={r.id} value={r.id}>{r.route_date ?? 'No date'} — {r.zone}</option>
                            ))}
                        </select>
                        {routes.length === 0 && <p className="mt-1 text-xs text-neutral-400">No completed routes without reports.</p>}
                        {errors.route_plan_id && <p className="mt-1 text-xs text-red-500">{errors.route_plan_id}</p>}
                    </div>

                    {/* Waste fields */}
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { key: 'mixed_waste' as const, label: 'Mixed Waste', color: 'bg-amber-400' },
                            { key: 'biodegradable' as const, label: 'Biodegradable', color: 'bg-emerald-500' },
                            { key: 'recyclable' as const, label: 'Recyclable', color: 'bg-blue-500' },
                            { key: 'residual' as const, label: 'Residual', color: 'bg-neutral-400' },
                            { key: 'solid_waste' as const, label: 'Solid Waste', color: 'bg-red-400' },
                        ].map((field) => (
                            <div key={field.key}>
                                <label className="mb-1 flex items-center gap-1.5 text-xs font-medium text-neutral-500 dark:text-neutral-400">
                                    <span className={`h-2 w-2 rounded-full ${field.color}`} />
                                    {field.label} (kg)
                                </label>
                                <input type="number" step="0.01" min="0" value={data[field.key]} onChange={(e) => setData(field.key, e.target.value)} placeholder="0.00" className={inputCls} />
                                {errors[field.key] && <p className="mt-0.5 text-xs text-red-500">{errors[field.key]}</p>}
                            </div>
                        ))}
                    </div>

                    {/* Total */}
                    <div className="rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 px-4 py-3 dark:from-emerald-950/30 dark:to-teal-950/30">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Total Waste</span>
                            <span className="text-xl font-bold text-emerald-700 dark:text-emerald-400">{total.toFixed(2)} <span className="text-sm font-normal">kg</span></span>
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="mb-1 block text-xs font-medium text-neutral-500 dark:text-neutral-400">Notes (optional)</label>
                        <textarea value={data.notes} onChange={(e) => setData('notes', e.target.value)} rows={2} placeholder="Additional notes..." className={inputCls} />
                    </div>

                    {/* Submit */}
                    <button type="submit" disabled={processing}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition-all active:scale-[0.97] hover:shadow-xl disabled:opacity-50">
                        {processing ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <ClipboardList size={16} />}
                        {processing ? 'Submitting...' : 'Submit Report'}
                    </button>
                </motion.form>
            </div>
        </CollectorLayout>
    );
}
