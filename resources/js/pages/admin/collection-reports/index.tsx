import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import type { BreadcrumbItem } from '@/types';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    PieChart,
    Pie,
    Cell,
} from 'recharts';
import { Download, Recycle, Leaf, Trash2, Package, FlaskConical, TrendingUp, TrendingDown, Search, X } from 'lucide-react';
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

const PERIODS = [
    { label: 'Today', value: 'today' },
    { label: 'Weekly', value: 'weekly' },
    { label: 'Monthly', value: 'monthly' },
    { label: 'All', value: 'all' },
];

const PIE_COLORS = ['#eab308', '#22c55e', '#3b82f6', '#6b7280', '#ef4444'];

const STAT_CARDS = [
    { key: 'total' as const, label: 'Total Waste', icon: Package, gradient: 'from-indigo-500 to-indigo-600' },
    { key: 'biodegradable' as const, label: 'Biodegradable', icon: Leaf, gradient: 'from-emerald-500 to-emerald-600' },
    { key: 'recyclable' as const, label: 'Recyclable', icon: Recycle, gradient: 'from-blue-500 to-blue-600' },
    { key: 'mixed_waste' as const, label: 'Mixed Waste', icon: FlaskConical, gradient: 'from-amber-500 to-amber-600' },
    { key: 'residual' as const, label: 'Residual', icon: Trash2, gradient: 'from-gray-500 to-gray-600' },
    { key: 'solid_waste' as const, label: 'Solid Waste', icon: Trash2, gradient: 'from-red-500 to-red-600' },
];

const BAR_COLORS: Record<string, string> = {
    mixed_waste: '#eab308',
    biodegradable: '#22c55e',
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
        <span
            className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold ${
                positive ? 'bg-white/20 text-white' : 'bg-white/20 text-white'
            }`}
        >
            {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {positive ? '+' : ''}
            {value}%
        </span>
    );
}

export default function CollectionReportsIndex({
    items,
    totals,
    prevTotals,
    chartData,
    breakdown,
    suggestions,
    search: initialSearch,
    selectedPeriod,
}: {
    items: Report[];
    totals: Totals;
    prevTotals: Totals;
    chartData: ChartPoint[];
    breakdown: Breakdown[];
    suggestions: Suggestion[];
    search: string;
    selectedPeriod: string;
}) {
    const tableRef = useRef<HTMLTableElement>(null);
    const searchRef = useRef<HTMLDivElement>(null);
    const [searchText, setSearchText] = useState(initialSearch);
    const [showSuggestions, setShowSuggestions] = useState(false);

    // Filter suggestions client-side as user types
    const filtered = searchText.trim()
        ? suggestions.filter((s) =>
              s.text.toLowerCase().includes(searchText.trim().toLowerCase()),
          )
        : [];

    // Close suggestions on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

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

    const submitSearch = useCallback(
        (value: string) => {
            navigate({ search: value });
        },
        [navigate],
    );

    const handleSearchChange = (value: string) => {
        setSearchText(value);
        setShowSuggestions(value.trim().length > 0);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            setShowSuggestions(false);
            submitSearch(searchText);
        }
    };

    const selectSuggestion = (text: string) => {
        setSearchText(text);
        setShowSuggestions(false);
        submitSearch(text);
    };

    const clearSearch = () => {
        setSearchText('');
        setShowSuggestions(false);
        submitSearch('');
    };

    const handleExport = () => {
        const headers = ['Date', 'Collector', 'Zone', 'Mixed Waste (kg)', 'Biodegradable (kg)', 'Recyclable (kg)', 'Residual (kg)', 'Solid Waste (kg)', 'Total (kg)', 'Notes'];
        const csvRows = [headers.join(',')];
        items.forEach((r) => {
            csvRows.push(
                [
                    r.report_date,
                    `"${r.collector ?? ''}"`,
                    `"${r.zone ? `${r.zone.name} (${r.zone.barangay ?? ''})` : ''}"`,
                    r.mixed_waste.toFixed(2),
                    r.biodegradable.toFixed(2),
                    r.recyclable.toFixed(2),
                    r.residual.toFixed(2),
                    r.solid_waste.toFixed(2),
                    r.total.toFixed(2),
                    `"${(r.notes ?? '').replace(/"/g, '""')}"`,
                ].join(','),
            );
        });
        // Add totals row
        csvRows.push(
            ['TOTAL', '', '', totals.mixed_waste.toFixed(2), totals.biodegradable.toFixed(2), totals.recyclable.toFixed(2), totals.residual.toFixed(2), totals.solid_waste.toFixed(2), totals.total.toFixed(2), ''].join(','),
        );
        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `collection-reports-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const periodLabel = PERIODS.find((p) => p.value === selectedPeriod)?.label ?? 'All';

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Collection Reports" />
            <div className="space-y-6 p-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Collection Reports</h1>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                    </div>
                    <button
                        onClick={handleExport}
                        className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700"
                    >
                        <Download className="h-4 w-4" />
                        Save Report
                    </button>
                </div>

                {/* Search (left) + Period Filter (right) */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    {/* Search */}
                    <div ref={searchRef} className="relative w-full sm:max-w-sm">
                        <div className="relative">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={searchText}
                                onChange={(e) => handleSearchChange(e.target.value)}
                                onKeyDown={handleKeyDown}
                                onFocus={() => searchText.trim() && setShowSuggestions(true)}
                                placeholder="Search collector, zone, barangay..."
                                className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pr-9 pl-10 text-sm text-gray-700 shadow-sm transition placeholder:text-gray-400 hover:border-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:placeholder:text-gray-500"
                            />
                            {searchText && (
                                <button
                                    onClick={clearSearch}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                        {/* Suggestions Dropdown */}
                        {showSuggestions && filtered.length > 0 && (
                            <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
                                <ul className="max-h-60 overflow-y-auto py-1">
                                    {filtered.map((s, i) => (
                                        <li key={`${s.type}-${s.text}-${i}`}>
                                            <button
                                                type="button"
                                                onMouseDown={() => selectSuggestion(s.text)}
                                                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition hover:bg-indigo-50 dark:hover:bg-gray-700"
                                            >
                                                <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                                                    {s.type}
                                                </span>
                                                <span className="text-gray-700 dark:text-gray-200">{s.text}</span>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                    {/* Period Filter */}
                    <div className="inline-flex rounded-xl bg-gray-100 p-1 dark:bg-gray-800">
                        {PERIODS.map((p) => (
                            <button
                                key={p.value}
                                onClick={() => navigate({ period: p.value })}
                                className={`rounded-lg px-5 py-2 text-sm font-medium transition ${
                                    selectedPeriod === p.value
                                        ? 'bg-white text-indigo-600 shadow-sm dark:bg-gray-700 dark:text-indigo-400'
                                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                                }`}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Stat Cards */}
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
                    {STAT_CARDS.map((card) => {
                        const Icon = card.icon;
                        const change = pctChange(totals[card.key], prevTotals[card.key]);
                        return (
                            <div
                                key={card.key}
                                className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${card.gradient} p-5 text-white shadow-lg`}
                            >
                                <div className="absolute -right-3 -top-3 opacity-10">
                                    <Icon className="h-20 w-20" />
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="rounded-lg bg-white/20 p-2">
                                        <Icon className="h-4 w-4" />
                                    </div>
                                    <Badge value={change} />
                                </div>
                                <p className="mt-3 text-2xl font-bold">{totals[card.key].toFixed(2)}</p>
                                <p className="text-sm font-medium text-white/80">{card.label} (kg)</p>
                            </div>
                        );
                    })}
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                    {/* Bar Chart */}
                    <div className="xl:col-span-2 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Waste Collection</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Track waste collection over time</p>
                            </div>
                            <span className="rounded-lg bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                                {periodLabel}
                            </span>
                        </div>
                        {chartData.length === 0 ? (
                            <div className="flex h-[300px] items-center justify-center text-gray-400">
                                No data for this period.
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={chartData} barCategoryGap="20%">
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                    <XAxis
                                        dataKey="date"
                                        tick={{ fontSize: 12, fill: '#94a3b8' }}
                                        tickFormatter={(v) => {
                                            const d = new Date(v);
                                            return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                                        }}
                                    />
                                    <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} />
                                    <Tooltip
                                        shared={false}
                                        cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                                        contentStyle={{
                                            borderRadius: 12,
                                            border: 'none',
                                            boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
                                        }}
                                        formatter={(val, name) => [
                                            `${Number(val).toFixed(2)} kg`,
                                            String(name).replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
                                        ]}
                                    />
                                    <Legend
                                        formatter={(value) =>
                                            value.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())
                                        }
                                    />
                                    {Object.entries(BAR_COLORS).map(([key, color]) => (
                                        <Bar key={key} dataKey={key} fill={color} radius={[4, 4, 0, 0]} />
                                    ))}
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>

                    {/* Donut Chart */}
                    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Waste Breakdown</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400">By waste category</p>
                            </div>
                            <span className="rounded-lg bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                                {periodLabel}
                            </span>
                        </div>
                        {totals.total === 0 ? (
                            <div className="flex h-[240px] items-center justify-center text-gray-400">
                                No data for this period.
                            </div>
                        ) : (
                            <>
                                <ResponsiveContainer width="100%" height={200}>
                                    <PieChart>
                                        <Pie
                                            data={breakdown}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={55}
                                            outerRadius={80}
                                            paddingAngle={3}
                                            dataKey="value"
                                        >
                                            {breakdown.map((_, i) => (
                                                <Cell key={i} fill={PIE_COLORS[i]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.12)' }}
                                            formatter={(val) => [`${Number(val).toFixed(2)} kg`]}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="mt-2 space-y-2">
                                    {breakdown.map((b, i) => (
                                        <div key={b.name} className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className="inline-block h-3 w-3 rounded-full"
                                                    style={{ backgroundColor: PIE_COLORS[i] }}
                                                />
                                                <span className="text-gray-600 dark:text-gray-400">{b.name}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-gray-900 dark:text-white">{b.value.toFixed(2)}</span>
                                                <span className="text-xs text-gray-400">
                                                    {totals.total > 0 ? ((b.value / totals.total) * 100).toFixed(1) : 0}%
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
                    <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-gray-800">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Report Details</h2>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                            {items.length} {items.length === 1 ? 'report' : 'reports'}
                        </span>
                    </div>
                    <div className="overflow-x-auto">
                        <table ref={tableRef} className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-50 text-left dark:border-gray-800">
                                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Date</th>
                                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Collector</th>
                                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Zone</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-400">Mixed</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-400">Biodeg.</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-400">Recyclable</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-400">Residual</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-400">Solid</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-400">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="px-6 py-12 text-center text-gray-400">
                                            No reports for this period.
                                        </td>
                                    </tr>
                                ) : (
                                    <>
                                        {items.map((r) => (
                                            <tr
                                                key={r.id}
                                                className="border-t border-gray-50 transition-colors hover:bg-gray-50/50 dark:border-gray-800 dark:hover:bg-white/[0.02]"
                                            >
                                                <td className="px-6 py-3.5 font-medium text-gray-900 dark:text-white">{r.report_date}</td>
                                                <td className="px-6 py-3.5 text-gray-600 dark:text-gray-400">{r.collector ?? '—'}</td>
                                                <td className="px-6 py-3.5 text-gray-600 dark:text-gray-400">
                                                    {r.zone ? `${r.zone.name} (${r.zone.barangay ?? '—'})` : '—'}
                                                </td>
                                                <td className="px-6 py-3.5 text-right tabular-nums">{r.mixed_waste.toFixed(2)}</td>
                                                <td className="px-6 py-3.5 text-right tabular-nums">{r.biodegradable.toFixed(2)}</td>
                                                <td className="px-6 py-3.5 text-right tabular-nums">{r.recyclable.toFixed(2)}</td>
                                                <td className="px-6 py-3.5 text-right tabular-nums">{r.residual.toFixed(2)}</td>
                                                <td className="px-6 py-3.5 text-right tabular-nums">{r.solid_waste.toFixed(2)}</td>
                                                <td className="px-6 py-3.5 text-right font-semibold tabular-nums text-gray-900 dark:text-white">
                                                    {r.total.toFixed(2)}
                                                </td>
                                            </tr>
                                        ))}
                                        {/* Totals Row */}
                                        <tr className="border-t-2 border-gray-200 bg-gray-50 font-semibold dark:border-gray-700 dark:bg-gray-800/50">
                                            <td className="px-6 py-3.5 text-gray-900 dark:text-white" colSpan={3}>
                                                Total
                                            </td>
                                            <td className="px-6 py-3.5 text-right tabular-nums">{totals.mixed_waste.toFixed(2)}</td>
                                            <td className="px-6 py-3.5 text-right tabular-nums">{totals.biodegradable.toFixed(2)}</td>
                                            <td className="px-6 py-3.5 text-right tabular-nums">{totals.recyclable.toFixed(2)}</td>
                                            <td className="px-6 py-3.5 text-right tabular-nums">{totals.residual.toFixed(2)}</td>
                                            <td className="px-6 py-3.5 text-right tabular-nums">{totals.solid_waste.toFixed(2)}</td>
                                            <td className="px-6 py-3.5 text-right tabular-nums text-indigo-600 dark:text-indigo-400">
                                                {totals.total.toFixed(2)}
                                            </td>
                                        </tr>
                                    </>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
