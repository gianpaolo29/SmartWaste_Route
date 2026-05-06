import { Head, Link, router } from '@inertiajs/react';
import { Users, Truck, MapPin, Route, ChevronRight, Activity, Clock, CheckCircle2, AlertTriangle, Scale, CalendarClock, Download, Container } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
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

type Stats = {
    residents: number; collectors: number; trucks: number; trucks_available: number;
    active_zones: number; total_routes: number; active_routes: number; completed_routes: number;
    total_barangays: number; open_reports: number; total_reports: number; today_routes: number;
    total_waste: number; total_stops_served: number;
};
type RecentRoute = { id: number; route_date: string | null; status: string; zone: string | null; barangay: string | null; collector: string | null };
type RecentReport = { id: number; description: string; status: string; report_datetime: string | null; resident: string | null; zone: string | null };
type CollectorPerf = { name: string; completed: number; total: number; rate: number };
type WasteTrend = { day: string; total: number };
type MonthlyWaste = { date: string; mixed: number; bio: number; recyclable: number; residual: number; solid: number; total: number };
type Breakdown = { name: string; value: number };

type Props = {
    stats: Stats; recentRoutes: RecentRoute[]; recentReports: RecentReport[];
    collectorPerformance: CollectorPerf[]; wasteTrend: WasteTrend[];
    monthlyWaste: MonthlyWaste[]; wasteBreakdown: Breakdown[]; routeBreakdown: Breakdown[];
    period: string;
};

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Dashboard', href: '/admin/dashboard' }];
const fade = (delay = 0) => ({ initial: { opacity: 0, y: 16 } as const, animate: { opacity: 1, y: 0 } as const, transition: { duration: 0.35, delay } });

const statusConfig: Record<string, { label: string; bg: string; text: string; dot: string }> = {
    planned: { label: 'Planned', bg: 'bg-neutral-100 dark:bg-neutral-800', text: 'text-neutral-600 dark:text-neutral-400', dot: 'bg-neutral-400' },
    in_progress: { label: 'In Progress', bg: 'bg-blue-50 dark:bg-blue-950/40', text: 'text-blue-600 dark:text-blue-400', dot: 'bg-blue-500 animate-pulse' },
    completed: { label: 'Completed', bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500' },
};
const PIE_COLORS = ['#eab308', '#10b981', '#3b82f6', '#6b7280', '#ef4444'];

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return <div className={`overflow-hidden rounded-2xl border border-neutral-200/60 bg-white shadow-sm dark:border-neutral-700/60 dark:bg-neutral-900 ${className}`}>{children}</div>;
}
function CardHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-3.5 dark:border-neutral-800">
            <div><h2 className="text-sm font-bold text-neutral-900 dark:text-white">{title}</h2>{subtitle && <p className="text-[11px] text-neutral-400">{subtitle}</p>}</div>
            {action}
        </div>
    );
}

export default function AdminDashboard({ stats, recentRoutes, recentReports, collectorPerformance, wasteTrend, monthlyWaste, wasteBreakdown, routeBreakdown, period = 'all' }: Props) {
    const isDark = useIsDark();
    const maxWaste = Math.max(...wasteTrend.map((w) => w.total), 1);
    const totalWasteBreakdown = wasteBreakdown.reduce((s, b) => s + b.value, 0);
    const completionRate = stats.total_routes > 0 ? Math.round((stats.completed_routes / stats.total_routes) * 100) : 0;

    // Dark-aware chart colors
    const gridColor = isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9';
    const tickColor = isDark ? '#64748b' : '#94a3b8';
    const tooltipStyle = {
        borderRadius: 14,
        border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e5e7eb',
        boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.4)' : '0 8px 32px rgba(0,0,0,0.08)',
        fontSize: 12,
        backgroundColor: isDark ? '#1e293b' : '#fff',
        color: isDark ? '#e2e8f0' : '#334155',
    };

    const handleExport = () => {
        const date = new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
        const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Dashboard Report</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',system-ui,sans-serif;color:#1a1a1a;padding:40px;background:#fff}.header{display:flex;align-items:center;gap:16px;margin-bottom:24px;padding-bottom:16px;border-bottom:2px solid #059669}.logo{width:44px;height:44px;background:linear-gradient(135deg,#059669,#0d9488);border-radius:12px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:18px;font-weight:bold}.header h1{font-size:20px;color:#1b4332}.header p{font-size:11px;color:#6b7280;margin-top:2px}.cards{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:24px}.card{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:16px}.card .v{font-size:22px;font-weight:700;color:#059669}.card .l{font-size:10px;color:#6b7280;margin-top:4px;text-transform:uppercase}table{width:100%;border-collapse:collapse;font-size:11px;margin-bottom:20px}th{background:#f9fafb;padding:8px 10px;text-align:left;font-weight:600;border-bottom:2px solid #e5e7eb;font-size:10px;text-transform:uppercase}td{padding:8px 10px;border-bottom:1px solid #f3f4f6}.footer{margin-top:24px;padding-top:12px;border-top:1px solid #e5e7eb;font-size:10px;color:#9ca3af;display:flex;justify-content:space-between}@media print{body{padding:20px}}</style></head><body><div class="header"><div class="logo">SW</div><div><h1>SmartWaste Route</h1><p>Dashboard Summary Report</p></div></div><div class="cards"><div class="card"><div class="v">${stats.residents}</div><div class="l">Residents</div></div><div class="card"><div class="v">${stats.collectors}</div><div class="l">Collectors</div></div><div class="card"><div class="v">${stats.trucks}</div><div class="l">Trucks</div></div><div class="card"><div class="v">${stats.total_waste} kg</div><div class="l">Total Waste</div></div></div><div class="cards"><div class="card"><div class="v">${stats.total_routes}</div><div class="l">Total Routes</div></div><div class="card"><div class="v">${stats.completed_routes}</div><div class="l">Completed</div></div><div class="card"><div class="v">${stats.active_routes}</div><div class="l">Active Now</div></div><div class="card"><div class="v">${stats.open_reports}</div><div class="l">Open Reports</div></div></div><h3 style="font-size:14px;margin-bottom:12px">Recent Routes</h3><table><thead><tr><th>Date</th><th>Zone</th><th>Collector</th><th>Status</th></tr></thead><tbody>${recentRoutes.map((r) => `<tr><td>${r.route_date ?? '—'}</td><td>${r.zone ?? '—'}</td><td>${r.collector ?? '—'}</td><td>${r.status}</td></tr>`).join('')}</tbody></table><div class="footer"><span>SmartWaste Route Dashboard Report</span><span>${date}</span></div><script>window.onload=function(){window.print()}</script></body></html>`;
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 10000);
    };

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Admin Dashboard" />
            <div className="space-y-4 p-4 sm:p-5">
                {/* Header with filter + export */}
                <motion.div {...fade()} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">Dashboard</h1>
                        <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">Overview of your waste management system</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-0.5 rounded-xl border border-neutral-200/60 bg-neutral-50/50 p-0.5 dark:border-neutral-700/60 dark:bg-neutral-800/50">
                            {([
                                { label: 'Today', value: 'today' },
                                { label: 'This Week', value: 'week' },
                                { label: 'Monthly', value: 'month' },
                                { label: 'All', value: 'all' },
                            ] as const).map((f) => (
                                <button key={f.value} onClick={() => router.get('/admin/dashboard', f.value !== 'all' ? { period: f.value } : {}, { preserveState: false })}
                                    className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all ${(period ?? 'all') === f.value
                                        ? 'bg-white text-emerald-700 shadow-sm dark:bg-neutral-700 dark:text-emerald-400'
                                        : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300'}`}>
                                    {f.label}
                                </button>
                            ))}
                        </div>
                        <button onClick={handleExport}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm shadow-emerald-600/20 transition-all hover:shadow-md hover:shadow-emerald-600/25">
                            <Download size={14} /> Export
                        </button>
                    </div>
                </motion.div>

                {/* Top Stats - 5 columns */}
                <div className="grid gap-3 grid-cols-2 lg:grid-cols-5">
                    {([
                        { label: 'Total Residents', value: stats.residents, sub: `${stats.total_barangays} barangays`, icon: Users, iconBg: 'bg-blue-50 dark:bg-blue-950/40', iconColor: 'text-blue-600 dark:text-blue-400', href: '/admin/residents' },
                        { label: 'Collectors', value: stats.collectors, sub: 'Active personnel', icon: Truck, iconBg: 'bg-emerald-50 dark:bg-emerald-950/40', iconColor: 'text-emerald-600 dark:text-emerald-400', href: '/admin/collectors' },
                        { label: 'Trucks', value: stats.trucks, sub: `${stats.trucks_available} available`, icon: Container, iconBg: 'bg-teal-50 dark:bg-teal-950/40', iconColor: 'text-teal-600 dark:text-teal-400', href: '/admin/trucks' },
                        { label: 'Active Zones', value: stats.active_zones, sub: `${stats.total_routes} total routes`, icon: MapPin, iconBg: 'bg-amber-50 dark:bg-amber-950/40', iconColor: 'text-amber-600 dark:text-amber-400', href: '/admin/zones' },
                        { label: 'Open Reports', value: stats.open_reports, sub: `${stats.total_reports} total filed`, icon: AlertTriangle, iconBg: 'bg-red-50 dark:bg-red-950/40', iconColor: 'text-red-500 dark:text-red-400', href: '/admin/reports' },
                    ] as const).map((card, i) => {
                        const Icon = card.icon;
                        return (
                            <motion.div key={card.label} {...fade(0.04 + i * 0.03)}>
                                <Link href={card.href}
                                    className="group block rounded-2xl border border-neutral-200/60 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-neutral-700/60 dark:bg-neutral-900">
                                    <div className="flex items-center justify-between">
                                        <p className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">{card.label}</p>
                                        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${card.iconBg} transition-transform group-hover:scale-110`}>
                                            <Icon size={17} className={card.iconColor} />
                                        </div>
                                    </div>
                                    <span className="mt-1.5 block text-2xl font-extrabold tracking-tight text-neutral-900 dark:text-white">{card.value.toLocaleString()}</span>
                                    <p className="mt-1 text-[11px] text-neutral-400 dark:text-neutral-500">{card.sub}</p>
                                </Link>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Operational summary row - 4 cols */}
                <motion.div {...fade(0.2)} className="grid gap-3 grid-cols-2 sm:grid-cols-4">
                    {([
                        { label: 'Today\'s Routes', value: stats.today_routes, icon: CalendarClock, color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-950/40' },
                        { label: 'Active Now', value: stats.active_routes, icon: Activity, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/40' },
                        { label: 'Stops Served', value: stats.total_stops_served, icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/40' },
                        { label: 'Waste Collected', value: `${stats.total_waste} kg`, icon: Scale, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/40' },
                    ] as const).map((item) => {
                        const Icon = item.icon;
                        return (
                            <div key={item.label} className="flex items-center gap-3 rounded-2xl border border-neutral-200/60 bg-white p-3.5 shadow-sm dark:border-neutral-700/60 dark:bg-neutral-900">
                                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${item.bg}`}>
                                    <Icon size={16} className={item.color} />
                                </div>
                                <div>
                                    <p className="text-lg font-extrabold text-neutral-900 dark:text-white">{item.value}</p>
                                    <p className="text-[10px] text-neutral-400">{item.label}</p>
                                </div>
                            </div>
                        );
                    })}
                </motion.div>

                {/* Charts row: Area Chart (2/3) + Waste Breakdown Donut (1/3) */}
                <div className="grid gap-4 lg:grid-cols-3">
                    <motion.div {...fade(0.24)} className="lg:col-span-2">
                        <Card>
                            <CardHeader title="Waste Collection Analytics" subtitle="Last 30 days trend" />
                            <div className="p-5">
                                {monthlyWaste.length === 0 ? (
                                    <div className="flex h-[280px] items-center justify-center text-neutral-400">No data available</div>
                                ) : (
                                    <ResponsiveContainer width="100%" height={280}>
                                        <AreaChart data={monthlyWaste}>
                                            <defs>
                                                <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#10b981" stopOpacity={isDark ? 0.25 : 0.3} />
                                                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                                            <XAxis dataKey="date" tick={{ fontSize: 10, fill: tickColor }} axisLine={{ stroke: gridColor }} tickLine={{ stroke: gridColor }}
                                                tickFormatter={(v) => new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
                                            <YAxis tick={{ fontSize: 10, fill: tickColor }} axisLine={{ stroke: gridColor }} tickLine={{ stroke: gridColor }} />
                                            <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', strokeWidth: 1 }}
                                                formatter={(val) => [`${Number(val).toFixed(1)} kg`]}
                                                labelFormatter={(v) => new Date(v).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} />
                                            <Area type="monotone" dataKey="total" stroke="#10b981" strokeWidth={2.5} fill="url(#gradTotal)"
                                                dot={false} activeDot={{ r: 5, fill: '#10b981', stroke: isDark ? '#1e293b' : '#fff', strokeWidth: 2 }} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </Card>
                    </motion.div>

                    <motion.div {...fade(0.28)}>
                        <Card className="h-full">
                            <CardHeader title="Waste Breakdown" subtitle="By category" />
                            <div className="p-4">
                                {totalWasteBreakdown === 0 ? (
                                    <div className="flex h-[200px] items-center justify-center text-neutral-400">No data</div>
                                ) : (
                                    <>
                                        <div className="relative">
                                            <ResponsiveContainer width="100%" height={180}>
                                                <PieChart>
                                                    <Pie data={wasteBreakdown} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value"
                                                        stroke={isDark ? 'rgba(255,255,255,0.05)' : '#fff'} strokeWidth={2}>
                                                        {wasteBreakdown.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                                                    </Pie>
                                                    <Tooltip contentStyle={tooltipStyle}
                                                        formatter={(val) => [`${Number(val).toFixed(1)} kg`]} />
                                                </PieChart>
                                            </ResponsiveContainer>
                                            {/* Center label */}
                                            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                                                <div className="text-center">
                                                    <p className="text-lg font-extrabold text-neutral-900 dark:text-white">{totalWasteBreakdown.toFixed(0)}</p>
                                                    <p className="text-[10px] font-medium text-neutral-400">kg total</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            {wasteBreakdown.map((b, i) => (
                                                <div key={b.name} className="flex items-center justify-between rounded-lg px-2 py-1 hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                                                    <div className="flex items-center gap-2">
                                                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i] }} />
                                                        <span className="text-xs text-neutral-600 dark:text-neutral-400">{b.name}</span>
                                                    </div>
                                                    <span className="text-xs font-bold text-neutral-900 dark:text-white">{b.value.toFixed(1)} kg</span>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        </Card>
                    </motion.div>
                </div>

                {/* Middle row: Weekly + Route Completion + Top Collectors */}
                <div className="grid gap-4 lg:grid-cols-3">
                    <motion.div {...fade(0.3)}>
                        <Card className="h-full">
                            <CardHeader title="This Week" subtitle="Daily collection (kg)" />
                            <div className="flex h-[calc(100%-54px)] items-end p-4">
                                {wasteTrend.length === 0 ? (
                                    <div className="flex h-full w-full items-center justify-center"><p className="text-xs text-neutral-400">No data this week</p></div>
                                ) : (
                                    <div className="flex w-full items-end gap-2" style={{ height: '140px' }}>
                                        {wasteTrend.map((w, i) => {
                                            const h = Math.max((w.total / maxWaste) * 100, 6);
                                            const isMax = w.total === maxWaste && w.total > 0;
                                            return (
                                                <div key={w.day} className="group flex flex-1 flex-col items-center gap-1.5">
                                                    <span className={`text-[10px] font-bold transition-colors ${isMax ? 'text-emerald-600 dark:text-emerald-400' : 'text-neutral-500 dark:text-neutral-400'}`}>{w.total}</span>
                                                    <div className={`w-full rounded-xl transition-all group-hover:opacity-80 ${isMax ? 'bg-gradient-to-t from-emerald-600 to-emerald-400 shadow-sm shadow-emerald-500/20' : 'bg-gradient-to-t from-emerald-500/70 to-teal-400/70 dark:from-emerald-600/50 dark:to-teal-500/50'}`}
                                                        style={{ height: `${h}px` }} />
                                                    <span className={`text-[9px] font-semibold ${isMax ? 'text-emerald-600 dark:text-emerald-400' : 'text-neutral-400 dark:text-neutral-500'}`}>{w.day}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </Card>
                    </motion.div>

                    <motion.div {...fade(0.34)}>
                        <Card className="h-full">
                            <CardHeader title="Route Completion" subtitle="Overall rate" />
                            <div className="flex h-[calc(100%-54px)] flex-col items-center justify-center p-5">
                                <div className="relative flex h-32 w-32 items-center justify-center">
                                    <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                                        <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="6" className="text-neutral-100 dark:text-neutral-800" />
                                        <circle cx="50" cy="50" r="42" fill="none" strokeWidth="6" strokeLinecap="round"
                                            strokeDasharray={`${completionRate * 2.64} 264`}
                                            className="drop-shadow-sm"
                                            style={{ stroke: 'url(#gaugeGrad)' }} />
                                        <defs>
                                            <linearGradient id="gaugeGrad" x1="0" y1="0" x2="1" y2="1">
                                                <stop offset="0%" stopColor="#10b981" />
                                                <stop offset="100%" stopColor="#06b6d4" />
                                            </linearGradient>
                                        </defs>
                                    </svg>
                                    <div className="absolute text-center">
                                        <p className="text-2xl font-extrabold text-neutral-900 dark:text-white">{completionRate}%</p>
                                        <p className="text-[9px] text-neutral-400">complete</p>
                                    </div>
                                </div>
                                <p className="mt-2 text-xs text-neutral-500">{stats.completed_routes} of {stats.total_routes} routes</p>
                                <div className="mt-3 grid w-full grid-cols-2 gap-2">
                                    <div className="rounded-lg bg-emerald-50 p-2 text-center dark:bg-emerald-950/30">
                                        <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">{stats.completed_routes}</p>
                                        <p className="text-[10px] text-emerald-600/60">Completed</p>
                                    </div>
                                    <div className="rounded-lg bg-blue-50 p-2 text-center dark:bg-blue-950/30">
                                        <p className="text-sm font-bold text-blue-700 dark:text-blue-400">{stats.active_routes}</p>
                                        <p className="text-[10px] text-blue-600/60">In Progress</p>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </motion.div>

                    <motion.div {...fade(0.38)}>
                        <Card className="h-full">
                            <CardHeader title="Top Collectors" subtitle="By completion rate"
                                action={<Link href="/admin/collectors" className="text-xs font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400">See All</Link>} />
                            <div className="p-3">
                                {collectorPerformance.length === 0 ? (
                                    <p className="py-6 text-center text-xs text-neutral-400">No collectors yet</p>
                                ) : (
                                    <div className="space-y-2">
                                        {collectorPerformance.map((c, i) => (
                                            <div key={c.name} className="flex items-center gap-3 rounded-xl bg-neutral-50 p-2.5 dark:bg-neutral-800/40">
                                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-100 to-teal-100 text-[10px] font-bold text-emerald-700 dark:from-emerald-900/50 dark:to-teal-900/50 dark:text-emerald-400">
                                                    #{i + 1}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-xs font-semibold text-neutral-900 dark:text-white">{c.name}</p>
                                                    <p className="text-[10px] text-neutral-400">{c.completed}/{c.total} routes</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{c.rate}%</p>
                                                    <div className="mt-0.5 h-1 w-12 rounded-full bg-neutral-200 dark:bg-neutral-700">
                                                        <div className="h-full rounded-full bg-emerald-500" style={{ width: `${c.rate}%` }} />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </Card>
                    </motion.div>
                </div>

                {/* Bottom row: Recent Routes (2/3) + Open Reports (1/3) */}
                <div className="grid gap-4 lg:grid-cols-3">
                    <motion.div {...fade(0.4)} className="lg:col-span-2">
                        <Card>
                            <CardHeader title="Recent Routes" subtitle="Latest collection activity"
                                action={<Link href="/admin/routes" className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400">View all <ChevronRight size={13} /></Link>} />
                            {recentRoutes.length === 0 ? (
                                <div className="px-4 py-12 text-center">
                                    <Route size={20} className="mx-auto text-neutral-300" />
                                    <p className="mt-2 text-sm text-neutral-400">No routes yet</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-neutral-50 dark:divide-neutral-800">
                                    {recentRoutes.map((r) => {
                                        const st = statusConfig[r.status] ?? statusConfig.planned;
                                        return (
                                            <Link key={r.id} href={`/admin/routes/${r.id}`} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800">
                                                    <Clock size={15} className="text-neutral-500 dark:text-neutral-400" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-sm font-medium text-neutral-900 dark:text-white">{r.route_date ?? '—'} {r.barangay && <span className="text-neutral-400">({r.barangay})</span>}</p>
                                                    <p className="truncate text-xs text-neutral-400">{r.zone ?? '—'} · {r.collector ?? 'Unassigned'}</p>
                                                </div>
                                                <span className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${st.bg} ${st.text}`}>
                                                    <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />{st.label}
                                                </span>
                                            </Link>
                                        );
                                    })}
                                </div>
                            )}
                        </Card>
                    </motion.div>

                    <motion.div {...fade(0.44)}>
                        <Card className="h-full">
                            <CardHeader title="Open Reports" subtitle="Missed pickups needing attention"
                                action={<Link href="/admin/reports" className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400">View all <ChevronRight size={13} /></Link>} />
                            {recentReports.length === 0 ? (
                                <div className="px-4 py-10 text-center">
                                    <CheckCircle2 size={20} className="mx-auto text-emerald-400" />
                                    <p className="mt-2 text-sm text-neutral-400">No open reports</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-neutral-50 dark:divide-neutral-800">
                                    {recentReports.map((r) => (
                                        <div key={r.id} className="flex items-start gap-3 px-4 py-3">
                                            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950/40">
                                                <AlertTriangle size={12} className="text-amber-600 dark:text-amber-400" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs font-semibold text-neutral-900 dark:text-white">{r.resident ?? 'Unknown'}</p>
                                                <p className="mt-0.5 line-clamp-1 text-[11px] text-neutral-400">{r.description}</p>
                                                <p className="mt-0.5 text-[10px] text-neutral-300 dark:text-neutral-600">{r.zone ?? '—'}</p>
                                            </div>
                                            <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">{r.status}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Card>
                    </motion.div>
                </div>
            </div>
        </AdminLayout>
    );
}
