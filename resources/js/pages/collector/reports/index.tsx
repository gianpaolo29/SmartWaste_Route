import { Head, router, useForm } from '@inertiajs/react';
import { useCallback, useEffect, useState } from 'react';
import { CalendarClock, ChevronRight, ClipboardList, Download, Plus, Recycle, Scale, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CollectorLayout from '@/layouts/collector-layout';
import type { FormEventHandler } from 'react';

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
};

type Summary = {
    count: number;
    total_waste: number;
    mixed: number;
    biodegradable: number;
    recyclable: number;
    residual: number;
    solid: number;
};

type Pagination = {
    current_page: number;
    last_page: number;
    total: number;
};

type RouteOption = {
    id: number;
    route_date: string | null;
    zone: string;
};

type Props = {
    reports: Report[];
    summary: Summary;
    period: string;
    pagination: Pagination;
    availableRoutes: RouteOption[];
    preselectedRouteId?: string;
};

const PERIODS = [
    { label: 'All', value: 'all' },
    { label: 'Today', value: 'today' },
    { label: 'This Week', value: 'week' },
    { label: 'This Month', value: 'month' },
];

const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 16 } as const,
    animate: { opacity: 1, y: 0 } as const,
    transition: { duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
});

const inputCls = 'w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-sm text-neutral-900 outline-none transition-colors focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 dark:border-neutral-700 dark:bg-neutral-800/50 dark:text-white dark:focus:border-emerald-700';

export default function ReportsIndex({ reports, summary, period, pagination, availableRoutes, preselectedRouteId }: Props) {
    const [showModal, setShowModal] = useState(false);

    // Auto-open modal if redirected from route finish
    useEffect(() => {
        if (preselectedRouteId) setShowModal(true);
    }, [preselectedRouteId]);

    const form = useForm({
        route_plan_id: preselectedRouteId ?? '',
        mixed_waste: '',
        biodegradable: '',
        recyclable: '',
        residual: '',
        solid_waste: '',
        notes: '',
    });

    const formTotal =
        (parseFloat(form.data.mixed_waste) || 0) +
        (parseFloat(form.data.biodegradable) || 0) +
        (parseFloat(form.data.recyclable) || 0) +
        (parseFloat(form.data.residual) || 0) +
        (parseFloat(form.data.solid_waste) || 0);

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        form.post('/collector/reports', {
            onSuccess: () => {
                setShowModal(false);
                form.reset();
            },
        });
    };

    const downloadReport = useCallback(() => {
        if (reports.length === 0) return;

        const periodLabel = PERIODS.find((p) => p.value === period)?.label ?? 'All';
        const date = new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });

        const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Collection Report - ${periodLabel}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',system-ui,sans-serif;color:#1a1a1a;padding:40px;background:#fff}
.header{display:flex;align-items:center;gap:16px;margin-bottom:32px;padding-bottom:20px;border-bottom:2px solid #059669}
.logo{width:48px;height:48px;background:linear-gradient(135deg,#059669,#0d9488);border-radius:12px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:20px;font-weight:bold}
.header h1{font-size:22px;color:#1b4332}.header p{font-size:12px;color:#6b7280;margin-top:2px}
.meta{display:flex;gap:32px;margin-bottom:24px;font-size:13px;color:#6b7280}.meta strong{color:#1a1a1a}
.summary{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:28px}
.summary-card{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px;text-align:center}
.summary-card .value{font-size:24px;font-weight:700;color:#059669}.summary-card .label{font-size:11px;color:#6b7280;margin-top:4px;text-transform:uppercase;letter-spacing:0.5px}
table{width:100%;border-collapse:collapse;font-size:13px;margin-bottom:24px}
th{background:#f9fafb;padding:10px 12px;text-align:left;font-weight:600;color:#374151;border-bottom:2px solid #e5e7eb;font-size:11px;text-transform:uppercase;letter-spacing:0.5px}
td{padding:10px 12px;border-bottom:1px solid #f3f4f6}.num{text-align:right;font-variant-numeric:tabular-nums}
.total-row td{font-weight:700;background:#f0fdf4;border-top:2px solid #059669}
.footer{margin-top:32px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:11px;color:#9ca3af;display:flex;justify-content:space-between}
@media print{body{padding:20px}.no-print{display:none}}
</style></head><body>
<div class="header"><div class="logo">SW</div><div><h1>SmartWaste Route</h1><p>Collection Report - ${periodLabel}</p></div></div>
<div class="meta"><div>Period: <strong>${periodLabel}</strong></div><div>Generated: <strong>${date}</strong></div><div>Reports: <strong>${summary.count}</strong></div></div>
<div class="summary">
<div class="summary-card"><div class="value">${summary.count}</div><div class="label">Reports</div></div>
<div class="summary-card"><div class="value">${summary.total_waste}</div><div class="label">Total (kg)</div></div>
<div class="summary-card"><div class="value">${summary.biodegradable}</div><div class="label">Biodegradable</div></div>
<div class="summary-card"><div class="value">${summary.recyclable}</div><div class="label">Recyclable</div></div>
</div>
<table><thead><tr><th>Date</th><th>Zone</th><th class="num">Mixed</th><th class="num">Bio</th><th class="num">Recyclable</th><th class="num">Residual</th><th class="num">Solid</th><th class="num">Total</th></tr></thead>
<tbody>${reports.map((r) => `<tr><td>${r.report_date}</td><td>${r.zone?.name ?? '—'} ${r.zone?.barangay ? `(${r.zone.barangay})` : ''}</td><td class="num">${r.mixed_waste.toFixed(2)}</td><td class="num">${r.biodegradable.toFixed(2)}</td><td class="num">${r.recyclable.toFixed(2)}</td><td class="num">${r.residual.toFixed(2)}</td><td class="num">${r.solid_waste.toFixed(2)}</td><td class="num"><strong>${r.total.toFixed(2)}</strong></td></tr>`).join('')}
<tr class="total-row"><td colspan="2">TOTAL</td><td class="num">${summary.mixed.toFixed(2)}</td><td class="num">${summary.biodegradable.toFixed(2)}</td><td class="num">${summary.recyclable.toFixed(2)}</td><td class="num">${summary.residual.toFixed(2)}</td><td class="num">${summary.solid.toFixed(2)}</td><td class="num">${summary.total_waste.toFixed(2)}</td></tr>
</tbody></table>
<div class="footer"><span>SmartWaste Route Collection Report</span><span>${date}</span></div>
<script class="no-print">window.onload=function(){window.print()}</script></body></html>`;

        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 10000);
    }, [reports, summary, period]);

    return (
        <CollectorLayout>
            <Head title="Collection Reports" />
            <div className="space-y-4 px-4 py-5 pb-36">

                {/* Header */}
                <motion.div {...fadeUp(0)} className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">Reports</h1>
                        <p className="mt-0.5 text-xs text-neutral-400">Your collection reports</p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-emerald-600/20 transition-all active:scale-[0.96] hover:shadow-lg"
                    >
                        <Plus size={14} /> New Report
                    </button>
                </motion.div>

                {/* Summary cards */}
                <motion.div {...fadeUp(0.05)} className="grid grid-cols-2 gap-2.5">
                    <div className="rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                        <div className="flex items-center gap-2.5">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-sm shadow-emerald-500/20">
                                <ClipboardList size={15} className="text-white" />
                            </div>
                            <div>
                                <p className="text-lg font-bold text-neutral-900 dark:text-white">{summary.count}</p>
                                <p className="text-[10px] font-medium text-neutral-400">Total Reports</p>
                            </div>
                        </div>
                    </div>
                    <div className="rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                        <div className="flex items-center gap-2.5">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 shadow-sm shadow-blue-500/20">
                                <Scale size={15} className="text-white" />
                            </div>
                            <div>
                                <p className="text-lg font-bold text-neutral-900 dark:text-white">{summary.total_waste} <span className="text-xs font-normal text-neutral-400">kg</span></p>
                                <p className="text-[10px] font-medium text-neutral-400">Total Waste</p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Waste breakdown */}
                {summary.total_waste > 0 && (
                    <motion.div {...fadeUp(0.1)} className="overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                        <div className="px-4 pt-4 pb-2">
                            <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">Waste Breakdown</p>
                        </div>
                        <div className="flex gap-0.5 px-4">
                            {[
                                { value: summary.mixed, color: 'bg-amber-400' },
                                { value: summary.biodegradable, color: 'bg-emerald-500' },
                                { value: summary.recyclable, color: 'bg-blue-500' },
                                { value: summary.residual, color: 'bg-neutral-400' },
                                { value: summary.solid, color: 'bg-red-400' },
                            ].map((item, i) => (
                                <div key={i} className={`h-2 rounded-full ${item.color}`}
                                    style={{ width: `${Math.max((item.value / summary.total_waste) * 100, 2)}%` }} />
                            ))}
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 px-4 py-3 text-[10px]">
                            {[
                                { label: 'Mixed', value: summary.mixed, color: 'bg-amber-400' },
                                { label: 'Biodegradable', value: summary.biodegradable, color: 'bg-emerald-500' },
                                { label: 'Recyclable', value: summary.recyclable, color: 'bg-blue-500' },
                                { label: 'Residual', value: summary.residual, color: 'bg-neutral-400' },
                                { label: 'Solid', value: summary.solid, color: 'bg-red-400' },
                            ].map((item) => (
                                <span key={item.label} className="flex items-center gap-1 text-neutral-500 dark:text-neutral-400">
                                    <span className={`h-2 w-2 rounded-full ${item.color}`} />
                                    {item.label} {item.value}kg
                                </span>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Filters + Download */}
                <motion.div {...fadeUp(0.15)} className="flex items-center gap-2">
                    <div className="flex flex-1 gap-1.5 overflow-x-auto">
                        {PERIODS.map((p) => (
                            <button
                                key={p.value}
                                onClick={() => router.get('/collector/reports', p.value !== 'all' ? { period: p.value } : {}, { preserveState: false })}
                                className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                                    period === p.value
                                        ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
                                        : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400'
                                }`}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                    {reports.length > 0 && (
                        <button
                            onClick={downloadReport}
                            className="flex items-center gap-1.5 rounded-full bg-neutral-100 px-3.5 py-1.5 text-xs font-semibold text-neutral-600 transition-all hover:bg-neutral-200 active:scale-[0.96] dark:bg-neutral-800 dark:text-neutral-400"
                        >
                            <Download size={13} /> Report
                        </button>
                    )}
                </motion.div>

                {/* Reports list */}
                {reports.length === 0 ? (
                    <motion.div {...fadeUp(0.2)} className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50/50 px-4 py-12 text-center dark:border-neutral-800 dark:bg-neutral-800/20">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100 dark:bg-neutral-800">
                            <ClipboardList size={24} className="text-neutral-300 dark:text-neutral-600" />
                        </div>
                        <p className="mt-4 text-sm font-semibold text-neutral-400">No reports found</p>
                        <p className="mt-1 text-xs text-neutral-300 dark:text-neutral-600">
                            {period !== 'all' ? 'Try a different time period' : 'Submit your first collection report'}
                        </p>
                    </motion.div>
                ) : (
                    <div className="space-y-2.5">
                        {reports.map((r, i) => (
                            <motion.div key={r.id} {...fadeUp(0.2 + i * 0.03)}>
                                <button
                                    onClick={() => router.visit(`/collector/reports/${r.id}`)}
                                    className="group block w-full overflow-hidden rounded-2xl border border-neutral-100 bg-white text-left shadow-sm transition-all active:scale-[0.98] hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900"
                                >
                                    <div className="flex items-center gap-3 p-4">
                                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 ring-1 ring-emerald-100 dark:from-emerald-950/50 dark:to-teal-950/50 dark:ring-emerald-900/30">
                                            <Recycle size={18} className="text-emerald-600 dark:text-emerald-400" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                                                {r.zone?.name ?? 'Unknown'} <span className="font-normal text-neutral-400">({r.zone?.barangay ?? '—'})</span>
                                            </p>
                                            <div className="mt-0.5 flex items-center gap-2 text-xs text-neutral-400">
                                                <CalendarClock size={11} />
                                                <span>{r.report_date}</span>
                                            </div>
                                        </div>
                                        <div className="shrink-0 text-right">
                                            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{r.total.toFixed(1)} <span className="text-[10px] font-normal">kg</span></p>
                                        </div>
                                        <ChevronRight size={16} className="shrink-0 text-neutral-300 transition-transform group-hover:translate-x-0.5 dark:text-neutral-600" />
                                    </div>
                                    {r.total > 0 && (
                                        <div className="flex gap-0 px-4 pb-3">
                                            {[
                                                { value: r.mixed_waste, color: 'bg-amber-400' },
                                                { value: r.biodegradable, color: 'bg-emerald-500' },
                                                { value: r.recyclable, color: 'bg-blue-500' },
                                                { value: r.residual, color: 'bg-neutral-400' },
                                                { value: r.solid_waste, color: 'bg-red-400' },
                                            ].map((item, idx) => (
                                                <div key={idx} className={`h-1 first:rounded-l-full last:rounded-r-full ${item.color}`}
                                                    style={{ width: `${(item.value / r.total) * 100}%` }} />
                                            ))}
                                        </div>
                                    )}
                                </button>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {pagination.last_page > 1 && (
                    <motion.div {...fadeUp(0.3)} className="flex items-center justify-between pt-2">
                        <p className="text-xs text-neutral-400">
                            Page {pagination.current_page} of {pagination.last_page} <span className="hidden sm:inline">· {pagination.total} reports</span>
                        </p>
                        <div className="flex gap-1.5">
                            {Array.from({ length: pagination.last_page }, (_, i) => i + 1).map((page) => (
                                <button
                                    key={page}
                                    onClick={() => router.get('/collector/reports', {
                                        ...(period !== 'all' ? { period } : {}),
                                        page,
                                    }, { preserveState: false })}
                                    className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-semibold transition-all ${
                                        page === pagination.current_page
                                            ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
                                            : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400'
                                    }`}
                                >
                                    {page}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </div>

            {/* ===== New Report Modal ===== */}
            <AnimatePresence>
                {showModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
                    >
                        {/* Backdrop */}
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />

                        {/* Modal */}
                        <motion.div
                            initial={{ y: 100, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 100, opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl sm:m-4 dark:bg-neutral-900"
                        >
                            {/* Handle bar (mobile) */}
                            <div className="flex justify-center pt-3 sm:hidden">
                                <div className="h-1 w-10 rounded-full bg-neutral-300 dark:bg-neutral-700" />
                            </div>

                            {/* Header */}
                            <div className="flex items-center justify-between px-5 pt-4 pb-3">
                                <div>
                                    <h2 className="text-lg font-bold text-neutral-900 dark:text-white">New Report</h2>
                                    <p className="text-xs text-neutral-400">Submit a collection report</p>
                                </div>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-neutral-500 transition-colors hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleSubmit} className="space-y-4 px-5 pb-8">
                                {/* Route */}
                                <div>
                                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-neutral-400">Completed Route</label>
                                    <select
                                        value={form.data.route_plan_id}
                                        onChange={(e) => form.setData('route_plan_id', e.target.value)}
                                        className={inputCls}
                                    >
                                        <option value="">Select a route...</option>
                                        {availableRoutes.map((r) => (
                                            <option key={r.id} value={r.id}>
                                                {r.route_date ?? 'No date'} — {r.zone}
                                            </option>
                                        ))}
                                    </select>
                                    {availableRoutes.length === 0 && (
                                        <p className="mt-1 text-xs text-neutral-400">No completed routes without reports.</p>
                                    )}
                                    {form.errors.route_plan_id && <p className="mt-1 text-xs text-red-500">{form.errors.route_plan_id}</p>}
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
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={form.data[field.key]}
                                                onChange={(e) => form.setData(field.key, e.target.value)}
                                                placeholder="0.00"
                                                className={inputCls}
                                            />
                                            {form.errors[field.key] && <p className="mt-0.5 text-xs text-red-500">{form.errors[field.key]}</p>}
                                        </div>
                                    ))}
                                </div>

                                {/* Total */}
                                <div className="rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 px-4 py-3 dark:from-emerald-950/30 dark:to-teal-950/30">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Total Waste</span>
                                        <span className="text-xl font-bold text-emerald-700 dark:text-emerald-400">{formTotal.toFixed(2)} <span className="text-sm font-normal">kg</span></span>
                                    </div>
                                </div>

                                {/* Notes */}
                                <div>
                                    <label className="mb-1 block text-xs font-medium text-neutral-500 dark:text-neutral-400">Notes (optional)</label>
                                    <textarea
                                        value={form.data.notes}
                                        onChange={(e) => form.setData('notes', e.target.value)}
                                        rows={2}
                                        placeholder="Additional notes..."
                                        className={inputCls}
                                    />
                                </div>

                                {/* Submit */}
                                <button
                                    type="submit"
                                    disabled={form.processing}
                                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition-all active:scale-[0.97] hover:shadow-xl disabled:opacity-50"
                                >
                                    {form.processing ? (
                                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                    ) : (
                                        <ClipboardList size={16} />
                                    )}
                                    {form.processing ? 'Submitting...' : 'Submit Report'}
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </CollectorLayout>
    );
}
