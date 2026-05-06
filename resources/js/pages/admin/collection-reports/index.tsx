import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import type { BreadcrumbItem } from '@/types';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
    PieChart, Pie, Cell,
} from 'recharts';
import { Download, Recycle, Leaf, Trash2, Package, FlaskConical, TrendingUp, TrendingDown, Search, X, ChevronLeft, ChevronRight, FileBarChart } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRef, useState, useEffect, useCallback } from 'react';

type Report = {
    id: number;
    report_date: string;
    collector: string | null;
    zone: { name: string; barangay: string | null } | null;
    mixed_waste: number;
    biodegradable: number;
    recyclable: number;
    residual: number;
    solid_waste: number;
    total: number;
    notes: string | null;
};

type Totals = {
    mixed_waste: number;
    biodegradable: number;
    recyclable: number;
    residual: number;
    solid_waste: number;
    total: number;
    reports_count: number;
};

type ChartPoint = {
    date: string;
    mixed_waste: number;
    biodegradable: number;
    recyclable: number;
    residual: number;
    solid_waste: number;
};

type Breakdown = { name: string; value: number };
type Suggestion = { type: string; text: string };

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/admin/dashboard' },
    { title: 'Collection Reports', href: '/admin/collection-reports' },
];

const fade = (delay = 0) => ({
    initial: { opacity: 0, y: 12 } as const,
    animate: { opacity: 1, y: 0 } as const,
    transition: { duration: 0.3, delay },
});

const PERIODS = [
    { label: 'Today', value: 'today' },
    { label: 'Weekly', value: 'weekly' },
    { label: 'Monthly', value: 'monthly' },
    { label: 'All', value: 'all' },
];

const PIE_COLORS = ['#eab308', '#10b981', '#3b82f6', '#6b7280', '#ef4444'];

const STAT_CARDS = [
    { key: 'total' as const, label: 'Total Waste', icon: Package, bg: 'bg-indigo-50 dark:bg-indigo-950/40', text: 'text-indigo-600 dark:text-indigo-400', ring: 'ring-indigo-500/20' },
    { key: 'biodegradable' as const, label: 'Biodegradable', icon: Leaf, bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-600 dark:text-emerald-400', ring: 'ring-emerald-500/20' },
    { key: 'recyclable' as const, label: 'Recyclable', icon: Recycle, bg: 'bg-blue-50 dark:bg-blue-950/40', text: 'text-blue-600 dark:text-blue-400', ring: 'ring-blue-500/20' },
    { key: 'mixed_waste' as const, label: 'Mixed Waste', icon: FlaskConical, bg: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-600 dark:text-amber-400', ring: 'ring-amber-500/20' },
    { key: 'residual' as const, label: 'Residual', icon: Trash2, bg: 'bg-neutral-50 dark:bg-neutral-950/40', text: 'text-neutral-600 dark:text-neutral-400', ring: 'ring-neutral-500/20' },
    { key: 'solid_waste' as const, label: 'Solid Waste', icon: Trash2, bg: 'bg-red-50 dark:bg-red-950/40', text: 'text-red-600 dark:text-red-400', ring: 'ring-red-500/20' },
];

const BAR_COLORS: Record<string, string> = {
    mixed_waste: '#eab308',
    biodegradable: '#10b981',
    recyclable: '#3b82f6',
    residual: '#6b7280',
    solid_waste: '#ef4444',
};

function pctChange(current: number, prev: number): number | null {
    if (prev === 0) return current > 0 ? 100 : null;
    return Math.round(((current - prev) / prev) * 100);
}

function Badge({ value }: { value: number | null }) {
    if (value === null) return null;
    const positive = value >= 0;
    return (
        <span className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${positive ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}>
            {positive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {positive ? '+' : ''}{value}%
        </span>
    );
}

export default function CollectionReportsIndex({
    items, totals, prevTotals, chartData, breakdown, suggestions, search: initialSearch, selectedPeriod,
}: {
    items: Report[]; totals: Totals; prevTotals: Totals; chartData: ChartPoint[];
    breakdown: Breakdown[]; suggestions: Suggestion[]; search: string; selectedPeriod: string;
}) {
    const tableRef = useRef<HTMLTableElement>(null);
    const searchRef = useRef<HTMLDivElement>(null);
    const [searchText, setSearchText] = useState(initialSearch);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [page, setPage] = useState(1);
    const perPage = 10;

    const filtered = searchText.trim()
        ? suggestions.filter((s) => s.text.toLowerCase().includes(searchText.trim().toLowerCase()))
        : [];

    const totalPages = Math.max(1, Math.ceil(items.length / perPage));
    const currentPage = Math.min(page, totalPages);
    const paginated = items.slice((currentPage - 1) * perPage, currentPage * perPage);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSuggestions(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    useEffect(() => { setPage(1); }, [items]);

    const navigate = useCallback(
        (params: Record<string, string>) => {
            const current: Record<string, string> = {};
            if (selectedPeriod && selectedPeriod !== 'all') current.period = selectedPeriod;
            if (initialSearch) current.search = initialSearch;
            const merged = { ...current, ...params };
            if (merged.period === 'all') delete merged.period;
            if (!merged.search) delete merged.search;
            router.get('/admin/collection-reports', merged, { preserveState: false });
        },
        [selectedPeriod, initialSearch],
    );

    const submitSearch = useCallback((value: string) => { navigate({ search: value }); }, [navigate]);
    const handleSearchChange = (value: string) => { setSearchText(value); setShowSuggestions(value.trim().length > 0); };
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter') { e.preventDefault(); setShowSuggestions(false); submitSearch(searchText); } };
    const selectSuggestion = (text: string) => { setSearchText(text); setShowSuggestions(false); submitSearch(text); };
    const clearSearch = () => { setSearchText(''); setShowSuggestions(false); submitSearch(''); };

    const periodLabel = PERIODS.find((p) => p.value === selectedPeriod)?.label ?? 'All';

    const handleExport = () => {
        const date = new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
        const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Collection Reports - ${periodLabel}</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',system-ui,sans-serif;color:#1a1a1a;padding:40px;background:#fff}.header{display:flex;align-items:center;gap:16px;margin-bottom:24px;padding-bottom:16px;border-bottom:2px solid #059669}.logo{width:44px;height:44px;background:linear-gradient(135deg,#059669,#0d9488);border-radius:12px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:18px;font-weight:bold}.header h1{font-size:20px;color:#1b4332}.header p{font-size:11px;color:#6b7280;margin-top:2px}.meta{display:flex;gap:24px;margin-bottom:20px;font-size:12px;color:#6b7280}.meta strong{color:#1a1a1a}.cards{display:grid;grid-template-columns:repeat(6,1fr);gap:8px;margin-bottom:24px}.card{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:12px;text-align:center}.card .v{font-size:18px;font-weight:700;color:#059669}.card .l{font-size:9px;color:#6b7280;margin-top:2px;text-transform:uppercase;letter-spacing:0.5px}table{width:100%;border-collapse:collapse;font-size:11px;margin-bottom:20px}th{background:#f9fafb;padding:8px 10px;text-align:left;font-weight:600;color:#374151;border-bottom:2px solid #e5e7eb;font-size:10px;text-transform:uppercase;letter-spacing:0.5px}td{padding:8px 10px;border-bottom:1px solid #f3f4f6}.num{text-align:right;font-variant-numeric:tabular-nums}.total td{font-weight:700;background:#f0fdf4;border-top:2px solid #059669}.footer{margin-top:24px;padding-top:12px;border-top:1px solid #e5e7eb;font-size:10px;color:#9ca3af;display:flex;justify-content:space-between}@media print{body{padding:20px}.no-print{display:none}}</style></head><body>
<div class="header"><div class="logo">SW</div><div><h1>SmartWaste Route</h1><p>Collection Analytics Report - ${periodLabel}</p></div></div>
<div class="meta"><div>Period: <strong>${periodLabel}</strong></div><div>Generated: <strong>${date}</strong></div><div>Reports: <strong>${totals.reports_count}</strong></div><div>Total Waste: <strong>${totals.total.toFixed(1)} kg</strong></div></div>
<div class="cards">${STAT_CARDS.map((c) => `<div class="card"><div class="v">${totals[c.key].toFixed(1)}</div><div class="l">${c.label} (kg)</div></div>`).join('')}</div>
<table><thead><tr><th>Date</th><th>Collector</th><th>Zone</th><th class="num">Mixed</th><th class="num">Bio</th><th class="num">Recyclable</th><th class="num">Residual</th><th class="num">Solid</th><th class="num">Total</th></tr></thead><tbody>
${items.map((r) => `<tr><td>${r.report_date}</td><td>${r.collector ?? '—'}</td><td>${r.zone ? `${r.zone.name} (${r.zone.barangay ?? '—'})` : '—'}</td><td class="num">${r.mixed_waste.toFixed(2)}</td><td class="num">${r.biodegradable.toFixed(2)}</td><td class="num">${r.recyclable.toFixed(2)}</td><td class="num">${r.residual.toFixed(2)}</td><td class="num">${r.solid_waste.toFixed(2)}</td><td class="num"><strong>${r.total.toFixed(2)}</strong></td></tr>`).join('')}
<tr class="total"><td colspan="3">TOTAL</td><td class="num">${totals.mixed_waste.toFixed(2)}</td><td class="num">${totals.biodegradable.toFixed(2)}</td><td class="num">${totals.recyclable.toFixed(2)}</td><td class="num">${totals.residual.toFixed(2)}</td><td class="num">${totals.solid_waste.toFixed(2)}</td><td class="num">${totals.total.toFixed(2)}</td></tr>
</tbody></table><div class="footer"><span>SmartWaste Route Analytics Report</span><span>${date}</span></div>
<script class="no-print">window.onload=function(){window.print()}</script></body></html>`;
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 10000);
    };

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Collection Reports" />
            <div className="space-y-4 p-4 sm:p-5">
                {/* Header */}
                <motion.div {...fade()} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">Collection Reports</h1>
                        <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">
                            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Period filter */}
                        <div className="flex items-center gap-0.5 rounded-xl border border-neutral-200 bg-neutral-50/50 p-0.5 dark:border-neutral-700 dark:bg-neutral-800/50">
                            {PERIODS.map((p) => (
                                <button key={p.value} onClick={() => navigate({ period: p.value })}
                                    className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all ${selectedPeriod === p.value
                                        ? 'bg-white text-indigo-700 shadow-sm dark:bg-neutral-700 dark:text-indigo-400'
                                        : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300'}`}>
                                    {p.label}
                                </button>
                            ))}
                        </div>
                        <button onClick={handleExport}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm shadow-indigo-600/20 transition-all hover:shadow-md hover:shadow-indigo-600/25">
                            <Download size={14} />
                            Export
                        </button>
                    </div>
                </motion.div>

                {/* Stat Cards */}
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
                    {STAT_CARDS.map((card, i) => {
                        const Icon = card.icon;
                        const change = pctChange(totals[card.key], prevTotals[card.key]);
                        return (
                            <motion.div key={card.key} {...fade(0.04 + i * 0.03)}
                                className="group rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900">
                                <div className="flex items-center justify-between">
                                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.bg} ring-4 ${card.ring} transition-transform group-hover:scale-110`}>
                                        <Icon size={18} className={card.text} />
                                    </div>
                                    <Badge value={change} />
                                </div>
                                <p className="mt-2 text-xl font-bold text-neutral-900 dark:text-white">{totals[card.key].toFixed(1)}</p>
                                <p className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">{card.label} (kg)</p>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                    {/* Bar Chart */}
                    <motion.div {...fade(0.2)} className="overflow-hidden rounded-2xl border border-neutral-200/60 bg-white p-5 shadow-lg shadow-black/[0.03] xl:col-span-2 dark:border-neutral-700/60 dark:bg-neutral-900">
                        <div className="mb-4 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-sm shadow-indigo-500/20">
                                    <FileBarChart size={14} className="text-white" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-bold text-neutral-900 dark:text-white">Waste Collection Trend</h2>
                                    <p className="text-[11px] text-neutral-400">Track waste over time</p>
                                </div>
                            </div>
                            <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-bold text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">{periodLabel}</span>
                        </div>
                        {chartData.length === 0 ? (
                            <div className="flex h-[280px] items-center justify-center text-neutral-400">No data for this period.</div>
                        ) : (
                            <ResponsiveContainer width="100%" height={280}>
                                <BarChart data={chartData} barCategoryGap="20%">
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }}
                                        tickFormatter={(v) => new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
                                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                                    <Tooltip cursor={{ fill: 'rgba(0,0,0,0.03)' }}
                                        contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: 12 }}
                                        formatter={(val, name) => [`${Number(val).toFixed(2)} kg`, String(name).replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())]} />
                                    <Legend formatter={(value) => value.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())} />
                                    {Object.entries(BAR_COLORS).map(([key, color]) => (
                                        <Bar key={key} dataKey={key} fill={color} radius={[4, 4, 0, 0]} />
                                    ))}
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </motion.div>

                    {/* Donut Chart */}
                    <motion.div {...fade(0.25)} className="overflow-hidden rounded-2xl border border-neutral-200/60 bg-white p-5 shadow-lg shadow-black/[0.03] dark:border-neutral-700/60 dark:bg-neutral-900">
                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <h2 className="text-sm font-bold text-neutral-900 dark:text-white">Waste Breakdown</h2>
                                <p className="text-[11px] text-neutral-400">By category</p>
                            </div>
                            <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-bold text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">{periodLabel}</span>
                        </div>
                        {totals.total === 0 ? (
                            <div className="flex h-[240px] items-center justify-center text-neutral-400">No data for this period.</div>
                        ) : (
                            <>
                                <ResponsiveContainer width="100%" height={190}>
                                    <PieChart>
                                        <Pie data={breakdown} cx="50%" cy="50%" innerRadius={55} outerRadius={78} paddingAngle={3} dataKey="value">
                                            {breakdown.map((_, i) => (<Cell key={i} fill={PIE_COLORS[i]} />))}
                                        </Pie>
                                        <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: 12 }}
                                            formatter={(val) => [`${Number(val).toFixed(2)} kg`]} />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="mt-1 space-y-1.5">
                                    {breakdown.map((b, i) => (
                                        <div key={b.name} className="flex items-center justify-between rounded-lg px-2 py-1.5 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                                            <div className="flex items-center gap-2">
                                                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i] }} />
                                                <span className="text-xs text-neutral-600 dark:text-neutral-400">{b.name}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold text-neutral-900 dark:text-white">{b.value.toFixed(1)}</span>
                                                <span className="text-[10px] font-medium text-neutral-400">
                                                    {totals.total > 0 ? ((b.value / totals.total) * 100).toFixed(1) : 0}%
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </motion.div>
                </div>

                {/* Table */}
                <motion.div {...fade(0.3)}>
                    <div className="overflow-hidden rounded-2xl border border-neutral-200/60 bg-white shadow-lg shadow-black/[0.03] dark:border-neutral-700/60 dark:bg-neutral-900">
                        {/* Table header */}
                        <div className="flex flex-col gap-3 border-b border-neutral-100 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between dark:border-neutral-800">
                            <div className="flex items-center gap-2.5">
                                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-sm shadow-indigo-500/20">
                                    <FileBarChart size={14} className="text-white" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-bold text-neutral-900 dark:text-white">Report Details</h2>
                                    <p className="text-[11px] text-neutral-400">{items.length} report{items.length !== 1 ? 's' : ''}</p>
                                </div>
                            </div>
                            {/* Search */}
                            <div ref={searchRef} className="relative">
                                <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                                <input type="text" value={searchText} onChange={(e) => handleSearchChange(e.target.value)} onKeyDown={handleKeyDown}
                                    onFocus={() => searchText.trim() && setShowSuggestions(true)}
                                    placeholder="Search collector, zone..."
                                    className="w-full rounded-xl border border-neutral-200 bg-neutral-50/50 py-2 pl-8 pr-8 text-xs outline-none transition-all placeholder:text-neutral-400 focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/10 sm:w-56 dark:border-neutral-700 dark:bg-neutral-800/50 dark:text-neutral-300 dark:focus:border-indigo-600" />
                                {searchText && (
                                    <button onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600">
                                        <X size={12} />
                                    </button>
                                )}
                                {showSuggestions && filtered.length > 0 && (
                                    <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-lg dark:border-neutral-700 dark:bg-neutral-800">
                                        <ul className="max-h-48 overflow-y-auto py-1">
                                            {filtered.map((s, i) => (
                                                <li key={`${s.type}-${s.text}-${i}`}>
                                                    <button type="button" onMouseDown={() => selectSuggestion(s.text)}
                                                        className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-xs transition hover:bg-indigo-50 dark:hover:bg-neutral-700">
                                                        <span className="rounded-md bg-neutral-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-neutral-500 dark:bg-neutral-700 dark:text-neutral-400">{s.type}</span>
                                                        <span className="text-neutral-700 dark:text-neutral-200">{s.text}</span>
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Table body */}
                        <div className="overflow-x-auto">
                            <table ref={tableRef} className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-neutral-50 text-left dark:border-neutral-800">
                                        <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">Date</th>
                                        <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">Collector</th>
                                        <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">Zone</th>
                                        <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-neutral-400">Mixed</th>
                                        <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-neutral-400">Bio.</th>
                                        <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-neutral-400">Recyclable</th>
                                        <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-neutral-400">Residual</th>
                                        <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-neutral-400">Solid</th>
                                        <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-neutral-400">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginated.length === 0 ? (
                                        <tr><td colSpan={9} className="px-5 py-16 text-center">
                                            <FileBarChart size={28} className="mx-auto text-neutral-200 dark:text-neutral-700" />
                                            <p className="mt-2 text-sm text-neutral-400">No reports for this period.</p>
                                        </td></tr>
                                    ) : (
                                        <>
                                            {paginated.map((r) => (
                                                <tr key={r.id} className="border-t border-neutral-50 transition-colors hover:bg-neutral-50/50 dark:border-neutral-800/50 dark:hover:bg-neutral-800/30">
                                                    <td className="px-5 py-3 text-sm font-semibold text-neutral-900 dark:text-white">{r.report_date}</td>
                                                    <td className="px-5 py-3 text-xs text-neutral-500">{r.collector ?? '—'}</td>
                                                    <td className="px-5 py-3">
                                                        {r.zone ? (
                                                            <div>
                                                                <p className="text-xs font-medium text-neutral-700 dark:text-neutral-300">{r.zone.name}</p>
                                                                {r.zone.barangay && <p className="text-[11px] text-neutral-400">{r.zone.barangay}</p>}
                                                            </div>
                                                        ) : <span className="text-xs text-neutral-300">—</span>}
                                                    </td>
                                                    <td className="px-5 py-3 text-right text-xs tabular-nums text-neutral-600 dark:text-neutral-400">{r.mixed_waste.toFixed(2)}</td>
                                                    <td className="px-5 py-3 text-right text-xs tabular-nums text-neutral-600 dark:text-neutral-400">{r.biodegradable.toFixed(2)}</td>
                                                    <td className="px-5 py-3 text-right text-xs tabular-nums text-neutral-600 dark:text-neutral-400">{r.recyclable.toFixed(2)}</td>
                                                    <td className="px-5 py-3 text-right text-xs tabular-nums text-neutral-600 dark:text-neutral-400">{r.residual.toFixed(2)}</td>
                                                    <td className="px-5 py-3 text-right text-xs tabular-nums text-neutral-600 dark:text-neutral-400">{r.solid_waste.toFixed(2)}</td>
                                                    <td className="px-5 py-3 text-right text-xs font-bold tabular-nums text-neutral-900 dark:text-white">{r.total.toFixed(2)}</td>
                                                </tr>
                                            ))}
                                            {/* Totals Row */}
                                            <tr className="border-t-2 border-neutral-200 bg-neutral-50 font-semibold dark:border-neutral-700 dark:bg-neutral-800/50">
                                                <td className="px-5 py-3 text-xs text-neutral-900 dark:text-white" colSpan={3}>Total</td>
                                                <td className="px-5 py-3 text-right text-xs tabular-nums">{totals.mixed_waste.toFixed(2)}</td>
                                                <td className="px-5 py-3 text-right text-xs tabular-nums">{totals.biodegradable.toFixed(2)}</td>
                                                <td className="px-5 py-3 text-right text-xs tabular-nums">{totals.recyclable.toFixed(2)}</td>
                                                <td className="px-5 py-3 text-right text-xs tabular-nums">{totals.residual.toFixed(2)}</td>
                                                <td className="px-5 py-3 text-right text-xs tabular-nums">{totals.solid_waste.toFixed(2)}</td>
                                                <td className="px-5 py-3 text-right text-xs tabular-nums text-indigo-600 dark:text-indigo-400">{totals.total.toFixed(2)}</td>
                                            </tr>
                                        </>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (() => {
                            const pages: (number | '...')[] = [];
                            if (totalPages <= 7) {
                                for (let i = 1; i <= totalPages; i++) pages.push(i);
                            } else {
                                pages.push(1);
                                if (currentPage > 3) pages.push('...');
                                for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i);
                                if (currentPage < totalPages - 2) pages.push('...');
                                pages.push(totalPages);
                            }
                            return (
                                <div className="flex items-center justify-between border-t border-neutral-100 px-5 py-3.5 dark:border-neutral-800">
                                    <p className="text-xs text-neutral-400">
                                        <span className="font-medium text-neutral-600 dark:text-neutral-300">{(currentPage - 1) * perPage + 1}–{Math.min(currentPage * perPage, items.length)}</span>
                                        {' '}of{' '}
                                        <span className="font-medium text-neutral-600 dark:text-neutral-300">{items.length}</span>
                                    </p>
                                    <div className="flex items-center gap-1">
                                        <button onClick={() => setPage(currentPage - 1)} disabled={currentPage <= 1}
                                            className="flex h-8 items-center gap-1 rounded-lg border border-neutral-200 px-2.5 text-xs font-medium text-neutral-500 transition-all hover:border-neutral-300 hover:bg-neutral-50 hover:text-neutral-700 disabled:cursor-not-allowed disabled:opacity-30 dark:border-neutral-700 dark:text-neutral-400 dark:hover:border-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-300">
                                            <ChevronLeft size={14} />
                                            <span className="hidden sm:inline">Prev</span>
                                        </button>
                                        <div className="flex items-center gap-0.5 rounded-lg border border-neutral-200 bg-neutral-50/50 p-0.5 dark:border-neutral-700 dark:bg-neutral-800/50">
                                            {pages.map((p, i) =>
                                                p === '...' ? (
                                                    <span key={`dots-${i}`} className="flex h-7 w-7 items-center justify-center text-[11px] text-neutral-300 dark:text-neutral-600">...</span>
                                                ) : (
                                                    <button key={p} onClick={() => setPage(p)}
                                                        className={`flex h-7 w-7 items-center justify-center rounded-md text-[11px] font-semibold transition-all ${p === currentPage
                                                            ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/25'
                                                            : 'text-neutral-500 hover:bg-white hover:text-neutral-700 hover:shadow-sm dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-neutral-200'}`}>
                                                        {p}
                                                    </button>
                                                ),
                                            )}
                                        </div>
                                        <button onClick={() => setPage(currentPage + 1)} disabled={currentPage >= totalPages}
                                            className="flex h-8 items-center gap-1 rounded-lg border border-neutral-200 px-2.5 text-xs font-medium text-neutral-500 transition-all hover:border-neutral-300 hover:bg-neutral-50 hover:text-neutral-700 disabled:cursor-not-allowed disabled:opacity-30 dark:border-neutral-700 dark:text-neutral-400 dark:hover:border-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-300">
                                            <span className="hidden sm:inline">Next</span>
                                            <ChevronRight size={14} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                </motion.div>
            </div>
        </AdminLayout>
    );
}
