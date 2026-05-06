import { Head, router } from '@inertiajs/react';
import { TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { motion } from 'framer-motion';
import AdminLayout from '@/layouts/admin-layout';
import type { BreadcrumbItem } from '@/types';

function useIsDark() {
    const [dark, setDark] = useState(false);
    useEffect(() => {
        const check = () => setDark(document.documentElement.classList.contains('dark'));
        check();
        const obs = new MutationObserver(check);
        obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => obs.disconnect();
    }, []);
    return dark;
}

type TrendItem = { date: string; mixed: number; bio: number; recyclable: number; residual: number; solid: number; total: number };
type ZoneItem = { zone: string; total: number };
type BreakdownItem = { name: string; value: number; color: string };

type Props = {
    trendData: TrendItem[];
    zoneComparison: ZoneItem[];
    wasteBreakdown: BreakdownItem[];
    range: string;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/admin/dashboard' },
    { title: 'Waste Trends', href: '/admin/analytics/waste-trends' },
];

const ranges = [
    { label: '7 Days', value: '7d' },
    { label: '30 Days', value: '30d' },
    { label: '90 Days', value: '90d' },
    { label: '1 Year', value: '1y' },
];

export default function WasteTrends({ trendData, zoneComparison, wasteBreakdown, range }: Props) {
    const isDark = useIsDark();
    const gridColor = isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9';
    const tickColor = isDark ? '#64748b' : '#94a3b8';
    const tooltipStyle = {
        backgroundColor: isDark ? '#1e293b' : '#fff',
        border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
        borderRadius: '12px',
        fontSize: '12px',
    };

    const totalWaste = wasteBreakdown.reduce((sum, b) => sum + b.value, 0);

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Waste Trends" />
            <div className="space-y-5 p-4 sm:p-5">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">Waste Trends</h1>
                        <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">Collection analytics over time</p>
                    </div>
                    <div className="flex items-center gap-1 rounded-xl border border-neutral-200/60 bg-neutral-50/50 p-1 dark:border-neutral-700/60 dark:bg-neutral-800/50">
                        {ranges.map((r) => (
                            <button key={r.value} onClick={() => router.get('/admin/analytics/waste-trends', { range: r.value }, { preserveState: true })}
                                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${range === r.value ? 'bg-white text-emerald-700 shadow-sm dark:bg-neutral-700 dark:text-emerald-400' : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300'}`}>
                                {r.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Trend Chart */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="overflow-hidden rounded-2xl border border-neutral-200/60 bg-white p-5 shadow-sm dark:border-neutral-700/60 dark:bg-neutral-900">
                    <div className="mb-4 flex items-center gap-2">
                        <TrendingUp size={16} className="text-emerald-600 dark:text-emerald-400" />
                        <h2 className="text-sm font-bold text-neutral-900 dark:text-white">Waste Collection Over Time</h2>
                    </div>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trendData}>
                                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                                <XAxis dataKey="date" tick={{ fontSize: 10, fill: tickColor }} axisLine={{ stroke: gridColor }} tickLine={{ stroke: gridColor }}
                                    tickFormatter={(v: string) => v.slice(5)} />
                                <YAxis tick={{ fontSize: 10, fill: tickColor }} axisLine={{ stroke: gridColor }} tickLine={{ stroke: gridColor }} />
                                <Tooltip contentStyle={tooltipStyle} />
                                <Area type="monotone" dataKey="mixed" stackId="1" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.3} name="Mixed" />
                                <Area type="monotone" dataKey="bio" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.3} name="Biodegradable" />
                                <Area type="monotone" dataKey="recyclable" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} name="Recyclable" />
                                <Area type="monotone" dataKey="residual" stackId="1" stroke="#6b7280" fill="#6b7280" fillOpacity={0.3} name="Residual" />
                                <Area type="monotone" dataKey="solid" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} name="Solid" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                <div className="grid gap-5 lg:grid-cols-2">
                    {/* Zone Comparison */}
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                        className="overflow-hidden rounded-2xl border border-neutral-200/60 bg-white p-5 shadow-sm dark:border-neutral-700/60 dark:bg-neutral-900">
                        <h2 className="mb-4 text-sm font-bold text-neutral-900 dark:text-white">Waste by Zone</h2>
                        {zoneComparison.length === 0 ? (
                            <p className="py-8 text-center text-xs text-neutral-400">No data</p>
                        ) : (
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={zoneComparison} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
                                        <XAxis type="number" tick={{ fontSize: 10, fill: tickColor }} axisLine={{ stroke: gridColor }} />
                                        <YAxis dataKey="zone" type="category" tick={{ fontSize: 10, fill: tickColor }} width={100} axisLine={{ stroke: gridColor }} />
                                        <Tooltip contentStyle={tooltipStyle} />
                                        <Bar dataKey="total" fill="#059669" radius={[0, 6, 6, 0]} name="Total (kg)" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </motion.div>

                    {/* Breakdown Donut */}
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                        className="overflow-hidden rounded-2xl border border-neutral-200/60 bg-white p-5 shadow-sm dark:border-neutral-700/60 dark:bg-neutral-900">
                        <h2 className="mb-4 text-sm font-bold text-neutral-900 dark:text-white">Waste Breakdown</h2>
                        <div className="flex items-center gap-6">
                            <div className="relative h-48 w-48 shrink-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={wasteBreakdown} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value" stroke="none">
                                            {wasteBreakdown.map((b, i) => <Cell key={i} fill={b.color} />)}
                                        </Pie>
                                        <Tooltip contentStyle={tooltipStyle} />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <p className="text-lg font-bold text-neutral-900 dark:text-white">{totalWaste.toFixed(0)}</p>
                                    <p className="text-[10px] text-neutral-400">kg total</p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                {wasteBreakdown.map((b) => (
                                    <div key={b.name} className="flex items-center gap-2">
                                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: b.color }} />
                                        <span className="text-xs text-neutral-600 dark:text-neutral-400">{b.name}</span>
                                        <span className="ml-auto text-xs font-bold text-neutral-900 dark:text-white">{b.value} kg</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </AdminLayout>
    );
}
