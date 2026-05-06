import { Head, Link, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays, Clock, MapPin, Truck, CheckCircle2, AlertCircle, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminLayout from '@/layouts/admin-layout';
import type { BreadcrumbItem } from '@/types';

type RouteItem = {
    id: number;
    route_date: string;
    status: string;
    zone: { name: string; barangays: string } | null;
    collector: { id: number; name: string } | null;
    stops_count: number;
    started_at: string | null;
    finished_at: string | null;
};

type Stats = {
    total: number;
    planned: number;
    in_progress: number;
    completed: number;
    cancelled: number;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/admin/dashboard' },
    { title: 'Schedules', href: '/admin/schedules' },
];

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const STATUS_CONFIG: Record<string, { bg: string; text: string; dot: string; label: string; icon: typeof CheckCircle2 }> = {
    planned: { bg: 'bg-blue-50/80 border-blue-200/60 dark:bg-blue-900/20 dark:border-blue-800/30', text: 'text-blue-700 dark:text-blue-400', dot: 'bg-blue-500', label: 'Planned', icon: CalendarDays },
    in_progress: { bg: 'bg-amber-50/80 border-amber-200/60 dark:bg-amber-900/20 dark:border-amber-800/30', text: 'text-amber-700 dark:text-amber-400', dot: 'bg-amber-500', label: 'In Progress', icon: Play },
    completed: { bg: 'bg-emerald-50/80 border-emerald-200/60 dark:bg-emerald-900/20 dark:border-emerald-800/30', text: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500', label: 'Completed', icon: CheckCircle2 },
    cancelled: { bg: 'bg-neutral-50/80 border-neutral-200/60 dark:bg-neutral-800/30 dark:border-neutral-700/30', text: 'text-neutral-500 dark:text-neutral-400', dot: 'bg-neutral-400', label: 'Cancelled', icon: AlertCircle },
};

const PILL_COLORS: Record<string, string> = {
    planned: 'bg-blue-500',
    in_progress: 'bg-amber-500',
    completed: 'bg-emerald-500',
    cancelled: 'bg-neutral-400',
};

export default function SchedulesIndex({
    routes,
    stats,
    month,
    year,
}: {
    routes: RouteItem[];
    stats: Stats;
    month: number;
    year: number;
}) {
    const [selectedDate, setSelectedDate] = useState<string | null>(null);

    const navigate = (m: number, y: number) => {
        router.get('/admin/schedules', { month: m, year: y }, { preserveState: false });
    };
    const prevMonth = () => navigate(month === 1 ? 12 : month - 1, month === 1 ? year - 1 : year);
    const nextMonth = () => navigate(month === 12 ? 1 : month + 1, month === 12 ? year + 1 : year);
    const goToday = () => { const n = new Date(); navigate(n.getMonth() + 1, n.getFullYear()); };

    const calendarDays = useMemo(() => {
        const firstDay = new Date(year, month - 1, 1);
        const lastDay = new Date(year, month, 0);
        const startPad = firstDay.getDay();
        const totalDays = lastDay.getDate();
        const days: { date: string; day: number; inMonth: boolean; isToday: boolean }[] = [];

        const prevLast = new Date(year, month - 1, 0).getDate();
        for (let i = startPad - 1; i >= 0; i--) {
            const d = prevLast - i;
            const pm = month === 1 ? 12 : month - 1;
            const py = month === 1 ? year - 1 : year;
            days.push({ date: `${py}-${String(pm).padStart(2, '0')}-${String(d).padStart(2, '0')}`, day: d, inMonth: false, isToday: false });
        }

        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        for (let d = 1; d <= totalDays; d++) {
            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            days.push({ date: dateStr, day: d, inMonth: true, isToday: dateStr === todayStr });
        }

        const remaining = 7 - (days.length % 7);
        if (remaining < 7) {
            for (let i = 1; i <= remaining; i++) {
                const nm = month === 12 ? 1 : month + 1;
                const ny = month === 12 ? year + 1 : year;
                days.push({ date: `${ny}-${String(nm).padStart(2, '0')}-${String(i).padStart(2, '0')}`, day: i, inMonth: false, isToday: false });
            }
        }
        return days;
    }, [month, year]);

    const routesByDate = useMemo(() => {
        const map: Record<string, RouteItem[]> = {};
        routes.forEach((r) => { (map[r.route_date] ??= []).push(r); });
        return map;
    }, [routes]);

    const selectedRoutes = selectedDate ? (routesByDate[selectedDate] ?? []) : [];
    const selectedLabel = selectedDate
        ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
        : null;

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Schedules" />
            <div className="flex h-[calc(100vh-4rem)] flex-col lg:flex-row">
                {/* Left: Calendar */}
                <div className="flex flex-1 flex-col overflow-hidden bg-white dark:bg-neutral-900">
                    {/* Header */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 px-6 py-4 dark:border-neutral-800">
                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-sm shadow-indigo-500/20">
                                <CalendarDays size={16} className="text-white" />
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-neutral-900 dark:text-white">
                                    {MONTH_NAMES[month - 1]} {year}
                                </h1>
                                <p className="text-[11px] text-neutral-400">{stats.total} route{stats.total !== 1 ? 's' : ''} this month</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <button onClick={goToday}
                                className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-600 transition-all hover:border-neutral-300 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-400 dark:hover:border-neutral-600 dark:hover:bg-neutral-800">
                                Today
                            </button>
                            <div className="flex items-center gap-0.5 rounded-lg border border-neutral-200 bg-neutral-50/50 p-0.5 dark:border-neutral-700 dark:bg-neutral-800/50">
                                <button onClick={prevMonth} className="rounded-md p-1.5 text-neutral-400 transition-all hover:bg-white hover:text-neutral-600 hover:shadow-sm dark:hover:bg-neutral-700 dark:hover:text-neutral-300">
                                    <ChevronLeft size={16} />
                                </button>
                                <button onClick={nextMonth} className="rounded-md p-1.5 text-neutral-400 transition-all hover:bg-white hover:text-neutral-600 hover:shadow-sm dark:hover:bg-neutral-700 dark:hover:text-neutral-300">
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Day headers */}
                    <div className="grid grid-cols-7 border-b border-neutral-100 bg-neutral-50/50 dark:border-neutral-800 dark:bg-neutral-800/30">
                        {DAY_NAMES.map((d) => (
                            <div key={d} className="px-2 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wider text-neutral-400">{d}</div>
                        ))}
                    </div>

                    {/* Calendar grid */}
                    <div className="flex-1 overflow-y-auto">
                        <div className="grid grid-cols-7 auto-rows-fr" style={{ minHeight: '100%' }}>
                            {calendarDays.map((cell, i) => {
                                const dayRoutes = routesByDate[cell.date] ?? [];
                                const isSelected = selectedDate === cell.date;

                                return (
                                    <button
                                        key={i}
                                        onClick={() => setSelectedDate(isSelected ? null : cell.date)}
                                        className={`relative flex min-h-[90px] flex-col border-b border-r border-neutral-100/80 p-1.5 text-left transition-all dark:border-neutral-800/50 ${
                                            !cell.inMonth ? 'bg-neutral-50/50 dark:bg-neutral-900/50' : 'bg-white dark:bg-neutral-900'
                                        } ${isSelected
                                            ? 'bg-indigo-50/50 ring-2 ring-inset ring-indigo-500 dark:bg-indigo-900/10'
                                            : 'hover:bg-neutral-50/80 dark:hover:bg-neutral-800/30'}`}
                                    >
                                        <span
                                            className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-all ${
                                                cell.isToday
                                                    ? 'bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-sm shadow-indigo-500/20'
                                                    : cell.inMonth
                                                      ? 'text-neutral-700 dark:text-neutral-300'
                                                      : 'text-neutral-300 dark:text-neutral-600'
                                            }`}
                                        >
                                            {cell.day}
                                        </span>

                                        {cell.inMonth && dayRoutes.slice(0, 3).map((r) => (
                                            <div
                                                key={r.id}
                                                className={`mt-0.5 flex items-center gap-1 truncate rounded-md px-1.5 py-0.5 text-[10px] font-semibold text-white shadow-sm ${PILL_COLORS[r.status] ?? PILL_COLORS.planned}`}
                                            >
                                                <span className="truncate">{r.zone?.name ?? 'Route'}</span>
                                            </div>
                                        ))}

                                        {cell.inMonth && dayRoutes.length > 3 && (
                                            <span className="mt-0.5 text-[10px] font-medium text-neutral-400">+{dayRoutes.length - 3} more</span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Right: sidebar detail */}
                <div className="w-full border-l border-neutral-100 bg-white lg:w-[380px] dark:border-neutral-800 dark:bg-neutral-900">
                    <div className="flex h-full flex-col overflow-y-auto">
                        <AnimatePresence mode="wait">
                            {selectedDate ? (
                                <motion.div key="selected" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }} className="flex-1">
                                    {/* Date header */}
                                    <div className="border-b border-neutral-100 px-5 py-4 dark:border-neutral-800">
                                        <p className="text-sm font-bold text-neutral-900 dark:text-white">{selectedLabel}</p>
                                        <p className="mt-0.5 text-[11px] text-neutral-400">
                                            {selectedRoutes.length} route{selectedRoutes.length !== 1 ? 's' : ''} scheduled
                                        </p>
                                    </div>

                                    {selectedRoutes.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center px-5 py-20 text-center">
                                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100 dark:bg-neutral-800">
                                                <CalendarDays size={24} className="text-neutral-300 dark:text-neutral-600" />
                                            </div>
                                            <p className="mt-3 text-sm font-medium text-neutral-500">No routes on this date</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2.5 p-4">
                                            {selectedRoutes.map((r, i) => {
                                                const cfg = STATUS_CONFIG[r.status] ?? STATUS_CONFIG.planned;
                                                const Icon = cfg.icon;
                                                return (
                                                    <motion.div key={r.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                                                        <Link
                                                            href={`/admin/routes/${r.id}`}
                                                            className={`group block rounded-xl border p-4 transition-all hover:shadow-lg hover:shadow-black/[0.03] ${cfg.bg}`}
                                                        >
                                                            <div className="flex items-start justify-between">
                                                                <div className="min-w-0 flex-1">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className={`h-2 w-2 rounded-full ${cfg.dot}`} />
                                                                        <span className="text-sm font-bold text-neutral-900 dark:text-white">
                                                                            {r.zone?.name ?? 'Unknown Zone'}
                                                                        </span>
                                                                    </div>
                                                                    {r.zone?.barangays && (
                                                                        <p className="mt-0.5 pl-4 text-[11px] text-neutral-500">{r.zone.barangays}</p>
                                                                    )}
                                                                </div>
                                                                <span className={`flex items-center gap-1 rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-bold backdrop-blur-sm dark:bg-black/20 ${cfg.text}`}>
                                                                    <Icon size={10} />
                                                                    {cfg.label}
                                                                </span>
                                                            </div>

                                                            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 pl-4 text-[11px] text-neutral-500">
                                                                {r.collector && (
                                                                    <span className="flex items-center gap-1">
                                                                        <Truck size={11} />
                                                                        {r.collector.name}
                                                                    </span>
                                                                )}
                                                                <span className="flex items-center gap-1">
                                                                    <MapPin size={11} />
                                                                    {r.stops_count} stop{r.stops_count !== 1 ? 's' : ''}
                                                                </span>
                                                                {r.started_at && (
                                                                    <span className="flex items-center gap-1">
                                                                        <Clock size={11} />
                                                                        {r.started_at}{r.finished_at ? ` - ${r.finished_at}` : ''}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </Link>
                                                    </motion.div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </motion.div>
                            ) : (
                                <motion.div key="overview" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }} className="flex-1">
                                    {/* Overview header */}
                                    <div className="border-b border-neutral-100 px-5 py-4 dark:border-neutral-800">
                                        <div className="flex items-center gap-2.5">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-sm shadow-indigo-500/20">
                                                <CalendarDays size={14} className="text-white" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-neutral-900 dark:text-white">{MONTH_NAMES[month - 1]} Overview</p>
                                                <p className="text-[11px] text-neutral-400">Click a date to view details</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Stats cards */}
                                    <div className="grid grid-cols-2 gap-2.5 p-4">
                                        {([
                                            { label: 'Total Routes', value: stats.total, icon: CalendarDays, from: 'from-indigo-500', to: 'to-violet-600', shadow: 'shadow-indigo-500/15' },
                                            { label: 'Completed', value: stats.completed, icon: CheckCircle2, from: 'from-emerald-500', to: 'to-teal-600', shadow: 'shadow-emerald-500/15' },
                                            { label: 'Planned', value: stats.planned, icon: Clock, from: 'from-blue-500', to: 'to-cyan-600', shadow: 'shadow-blue-500/15' },
                                            { label: 'In Progress', value: stats.in_progress, icon: Play, from: 'from-amber-500', to: 'to-orange-600', shadow: 'shadow-amber-500/15' },
                                        ] as const).map(({ label, value, icon: SIcon, from, to, shadow }) => (
                                            <div key={label} className={`overflow-hidden rounded-xl bg-gradient-to-br ${from} ${to} p-3.5 text-white shadow-md ${shadow}`}>
                                                <div className="flex items-center justify-between">
                                                    <SIcon size={16} className="text-white/50" />
                                                    <p className="text-2xl font-extrabold">{value}</p>
                                                </div>
                                                <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-white/60">{label}</p>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Routes list */}
                                    <div className="px-4 pb-4">
                                        <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">All Routes This Month</p>
                                        {routes.length === 0 ? (
                                            <div className="py-10 text-center">
                                                <CalendarDays size={24} className="mx-auto text-neutral-200 dark:text-neutral-700" />
                                                <p className="mt-2 text-sm text-neutral-400">No routes scheduled</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-1.5">
                                                {routes.map((r) => {
                                                    const cfg = STATUS_CONFIG[r.status] ?? STATUS_CONFIG.planned;
                                                    return (
                                                        <Link
                                                            key={r.id}
                                                            href={`/admin/routes/${r.id}`}
                                                            className="group flex items-center gap-3 rounded-xl border border-neutral-100 bg-neutral-50/30 px-3.5 py-2.5 transition-all hover:border-neutral-200 hover:bg-white hover:shadow-sm dark:border-neutral-800 dark:bg-neutral-800/20 dark:hover:border-neutral-700 dark:hover:bg-neutral-800/50"
                                                        >
                                                            <div className={`h-2 w-2 flex-shrink-0 rounded-full ${cfg.dot}`} />
                                                            <div className="min-w-0 flex-1">
                                                                <div className="flex items-center justify-between">
                                                                    <span className="text-xs font-semibold text-neutral-900 dark:text-white">{r.zone?.name}</span>
                                                                    <span className="text-[10px] font-medium text-neutral-400">{r.route_date.split('-').slice(1).join('/')}</span>
                                                                </div>
                                                                <div className="mt-0.5 flex items-center gap-2 text-[11px] text-neutral-400">
                                                                    {r.collector && <span>{r.collector.name}</span>}
                                                                    <span>{r.stops_count} stops</span>
                                                                </div>
                                                            </div>
                                                        </Link>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
