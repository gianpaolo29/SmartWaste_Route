import { Head, Link, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays, Clock, MapPin, Truck, Users, CheckCircle2, AlertCircle, Play, Plus } from 'lucide-react';
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

const STATUS_CONFIG: Record<string, { bg: string; dot: string; label: string; icon: typeof CheckCircle2 }> = {
    planned: { bg: 'bg-blue-50 border-blue-100 dark:bg-blue-900/20 dark:border-blue-800/40', dot: 'bg-blue-500', label: 'Planned', icon: CalendarDays },
    in_progress: { bg: 'bg-amber-50 border-amber-100 dark:bg-amber-900/20 dark:border-amber-800/40', dot: 'bg-amber-500', label: 'In Progress', icon: Play },
    completed: { bg: 'bg-emerald-50 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800/40', dot: 'bg-emerald-500', label: 'Completed', icon: CheckCircle2 },
    cancelled: { bg: 'bg-gray-50 border-gray-100 dark:bg-gray-800/30 dark:border-gray-700', dot: 'bg-gray-400', label: 'Cancelled', icon: AlertCircle },
};

const PILL_COLORS: Record<string, string> = {
    planned: 'bg-blue-500',
    in_progress: 'bg-amber-500',
    completed: 'bg-emerald-500',
    cancelled: 'bg-gray-400',
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

    // Build calendar grid
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

    // Group routes by date
    const routesByDate = useMemo(() => {
        const map: Record<string, RouteItem[]> = {};
        routes.forEach((r) => { (map[r.route_date] ??= []).push(r); });
        return map;
    }, [routes]);

    // Selected date detail
    const selectedRoutes = selectedDate ? (routesByDate[selectedDate] ?? []) : [];
    const selectedLabel = selectedDate
        ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
        : null;

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Schedules" />
            <div className="flex h-[calc(100vh-4rem)] flex-col lg:flex-row">
                {/* Left: Calendar + stats */}
                <div className="flex flex-1 flex-col overflow-hidden">
                    {/* Header */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-6 py-4 dark:border-gray-800">
                        <div className="flex items-center gap-3">
                            <CalendarDays className="h-5 w-5 text-indigo-600" />
                            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                                {MONTH_NAMES[month - 1]} {year}
                            </h1>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={goToday} className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800">Today</button>
                            <button onClick={prevMonth} className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 dark:hover:bg-gray-800"><ChevronLeft className="h-5 w-5" /></button>
                            <button onClick={nextMonth} className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 dark:hover:bg-gray-800"><ChevronRight className="h-5 w-5" /></button>
                            <Link
                                href="/admin/routes/create"
                                className="ml-2 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-indigo-700"
                            >
                                <Plus className="h-3.5 w-3.5" />
                                New Route
                            </Link>
                        </div>
                    </div>

                    {/* Stat pills */}
                    <div className="flex gap-3 overflow-x-auto border-b border-gray-100 px-6 py-3 dark:border-gray-800">
                        {([
                            { label: 'Total', value: stats.total, color: 'text-gray-900 dark:text-white', bg: 'bg-gray-100 dark:bg-gray-800' },
                            { label: 'Planned', value: stats.planned, color: 'text-blue-700', bg: 'bg-blue-50 dark:bg-blue-900/20' },
                            { label: 'In Progress', value: stats.in_progress, color: 'text-amber-700', bg: 'bg-amber-50 dark:bg-amber-900/20' },
                            { label: 'Completed', value: stats.completed, color: 'text-emerald-700', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
                        ] as const).map((s) => (
                            <div key={s.label} className={`flex items-center gap-2 rounded-lg ${s.bg} px-3 py-1.5`}>
                                <span className={`text-lg font-bold ${s.color}`}>{s.value}</span>
                                <span className="text-xs text-gray-500">{s.label}</span>
                            </div>
                        ))}
                    </div>

                    {/* Day headers */}
                    <div className="grid grid-cols-7 border-b border-gray-100 dark:border-gray-800">
                        {DAY_NAMES.map((d) => (
                            <div key={d} className="px-2 py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-gray-400">{d}</div>
                        ))}
                    </div>

                    {/* Calendar grid */}
                    <div className="flex-1 overflow-y-auto">
                        <div className="grid grid-cols-7 auto-rows-fr" style={{ minHeight: '100%' }}>
                            {calendarDays.map((cell, i) => {
                                const dayRoutes = routesByDate[cell.date] ?? [];
                                const isSelected = selectedDate === cell.date;
                                const hasRoutes = dayRoutes.length > 0;

                                return (
                                    <button
                                        key={i}
                                        onClick={() => setSelectedDate(isSelected ? null : cell.date)}
                                        className={`relative flex min-h-[90px] flex-col border-b border-r border-gray-50 p-1.5 text-left transition dark:border-gray-800/50 ${
                                            !cell.inMonth ? 'bg-gray-50/50 dark:bg-gray-900/30' : 'bg-white dark:bg-gray-900'
                                        } ${isSelected ? 'ring-2 ring-inset ring-indigo-500' : 'hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10'}`}
                                    >
                                        <span
                                            className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium ${
                                                cell.isToday
                                                    ? 'bg-indigo-600 text-white'
                                                    : cell.inMonth
                                                      ? 'text-gray-900 dark:text-gray-200'
                                                      : 'text-gray-300 dark:text-gray-600'
                                            }`}
                                        >
                                            {cell.day}
                                        </span>

                                        {cell.inMonth && dayRoutes.slice(0, 3).map((r) => (
                                            <div
                                                key={r.id}
                                                className={`mt-0.5 flex items-center gap-1 truncate rounded px-1.5 py-0.5 text-[10px] font-medium text-white ${PILL_COLORS[r.status] ?? PILL_COLORS.planned}`}
                                            >
                                                <span className="truncate">{r.zone?.name ?? 'Route'}</span>
                                            </div>
                                        ))}

                                        {cell.inMonth && dayRoutes.length > 3 && (
                                            <span className="mt-0.5 text-[10px] text-gray-400">+{dayRoutes.length - 3} more</span>
                                        )}

                                        {/* Dot indicator for days with routes */}
                                        {cell.inMonth && hasRoutes && dayRoutes.length === 0 && (
                                            <div className="absolute bottom-1.5 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-indigo-400" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Right: sidebar detail */}
                <div className="w-full border-l border-gray-100 lg:w-[380px] dark:border-gray-800">
                    <div className="flex h-full flex-col overflow-y-auto">
                        {selectedDate ? (
                            <div className="flex-1">
                                {/* Date header */}
                                <div className="border-b border-gray-100 px-5 py-4 dark:border-gray-800">
                                    <p className="text-lg font-bold text-gray-900 dark:text-white">{selectedLabel}</p>
                                    <p className="mt-0.5 text-sm text-gray-400">
                                        {selectedRoutes.length} route{selectedRoutes.length !== 1 ? 's' : ''} scheduled
                                    </p>
                                </div>

                                {selectedRoutes.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
                                        <CalendarDays className="mb-3 h-10 w-10 text-gray-200 dark:text-gray-700" />
                                        <p className="text-sm font-medium text-gray-500">No routes on this date</p>
                                        <Link
                                            href="/admin/routes/create"
                                            className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-indigo-700"
                                        >
                                            <Plus className="h-3.5 w-3.5" />
                                            Create Route
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="space-y-3 p-4">
                                        {selectedRoutes.map((r) => {
                                            const cfg = STATUS_CONFIG[r.status] ?? STATUS_CONFIG.planned;
                                            const Icon = cfg.icon;
                                            return (
                                                <Link
                                                    key={r.id}
                                                    href={`/admin/routes/${r.id}`}
                                                    className={`block rounded-xl border p-4 transition hover:shadow-md ${cfg.bg}`}
                                                >
                                                    <div className="flex items-start justify-between">
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-center gap-2">
                                                                <div className={`h-2.5 w-2.5 rounded-full ${cfg.dot}`} />
                                                                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                                                    {r.zone?.name ?? 'Unknown Zone'}
                                                                </span>
                                                            </div>
                                                            {r.zone?.barangays && (
                                                                <p className="mt-0.5 pl-[18px] text-xs text-gray-500">{r.zone.barangays}</p>
                                                            )}
                                                        </div>
                                                        <span className="flex items-center gap-1 rounded-full bg-white/60 px-2 py-0.5 text-[10px] font-semibold text-gray-700 dark:bg-black/20 dark:text-gray-300">
                                                            <Icon className="h-3 w-3" />
                                                            {cfg.label}
                                                        </span>
                                                    </div>

                                                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 pl-[18px] text-xs text-gray-500">
                                                        {r.collector && (
                                                            <span className="flex items-center gap-1">
                                                                <Truck className="h-3 w-3" />
                                                                {r.collector.name}
                                                            </span>
                                                        )}
                                                        <span className="flex items-center gap-1">
                                                            <MapPin className="h-3 w-3" />
                                                            {r.stops_count} stop{r.stops_count !== 1 ? 's' : ''}
                                                        </span>
                                                        {r.started_at && (
                                                            <span className="flex items-center gap-1">
                                                                <Clock className="h-3 w-3" />
                                                                {r.started_at}{r.finished_at ? ` - ${r.finished_at}` : ''}
                                                            </span>
                                                        )}
                                                    </div>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        ) : (
                            /* Default: upcoming routes for the month */
                            <div className="flex-1">
                                <div className="border-b border-gray-100 px-5 py-4 dark:border-gray-800">
                                    <p className="text-lg font-bold text-gray-900 dark:text-white">{MONTH_NAMES[month - 1]} Overview</p>
                                    <p className="mt-0.5 text-sm text-gray-400">Click a date to view details</p>
                                </div>

                                {/* Stats cards */}
                                <div className="grid grid-cols-2 gap-3 p-4">
                                    <div className="rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 p-4 text-white shadow">
                                        <CalendarDays className="mb-2 h-5 w-5 opacity-70" />
                                        <p className="text-2xl font-bold">{stats.total}</p>
                                        <p className="text-xs text-white/70">Total Routes</p>
                                    </div>
                                    <div className="rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-4 text-white shadow">
                                        <CheckCircle2 className="mb-2 h-5 w-5 opacity-70" />
                                        <p className="text-2xl font-bold">{stats.completed}</p>
                                        <p className="text-xs text-white/70">Completed</p>
                                    </div>
                                    <div className="rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 p-4 text-white shadow">
                                        <Clock className="mb-2 h-5 w-5 opacity-70" />
                                        <p className="text-2xl font-bold">{stats.planned}</p>
                                        <p className="text-xs text-white/70">Planned</p>
                                    </div>
                                    <div className="rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 p-4 text-white shadow">
                                        <Play className="mb-2 h-5 w-5 opacity-70" />
                                        <p className="text-2xl font-bold">{stats.in_progress}</p>
                                        <p className="text-xs text-white/70">In Progress</p>
                                    </div>
                                </div>

                                {/* Upcoming routes list */}
                                <div className="px-4 pb-4">
                                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">All Routes This Month</p>
                                    {routes.length === 0 ? (
                                        <div className="py-8 text-center text-sm text-gray-400">No routes scheduled this month.</div>
                                    ) : (
                                        <div className="space-y-2">
                                            {routes.map((r) => {
                                                const cfg = STATUS_CONFIG[r.status] ?? STATUS_CONFIG.planned;
                                                return (
                                                    <Link
                                                        key={r.id}
                                                        href={`/admin/routes/${r.id}`}
                                                        className="flex items-center gap-3 rounded-lg border border-gray-50 px-3 py-2.5 transition hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50"
                                                    >
                                                        <div className={`h-2 w-2 flex-shrink-0 rounded-full ${cfg.dot}`} />
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-sm font-medium text-gray-900 dark:text-white">{r.zone?.name}</span>
                                                                <span className="text-[10px] text-gray-400">{r.route_date}</span>
                                                            </div>
                                                            <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-400">
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
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
