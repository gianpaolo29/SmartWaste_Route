import { Head, router } from '@inertiajs/react';
import { CalendarDays, ChevronLeft, ChevronRight, Truck, CheckCircle2, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import ResidentLayout from '@/layouts/resident-layout';

type ScheduleDay = { day_of_week: number; start_time: string; end_time: string };
type RoutePlanItem = { id: number; route_date: string; status: string; collector: string | null };

type Props = {
    schedules: ScheduleDay[];
    routes: RoutePlanItem[];
    month: number;
    year: number;
    zoneName: string | null;
};

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const statusStyles: Record<string, { bg: string; text: string; dot: string }> = {
    completed: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500' },
    in_progress: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', dot: 'bg-blue-500' },
    planned: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', dot: 'bg-amber-500' },
    cancelled: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', dot: 'bg-red-500' },
};

function getDaysInMonth(year: number, month: number) {
    return new Date(year, month, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
    return new Date(year, month - 1, 1).getDay();
}

export default function Schedule({ schedules, routes, month, year, zoneName }: Props) {
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const today = new Date();
    const isCurrentMonth = today.getFullYear() === year && today.getMonth() + 1 === month;

    const scheduledDays = new Set(schedules.map((s) => s.day_of_week));
    const routesByDate = routes.reduce<Record<string, RoutePlanItem[]>>((acc, r) => {
        if (!acc[r.route_date]) acc[r.route_date] = [];
        acc[r.route_date].push(r);
        return acc;
    }, {});

    const navigate = (dir: -1 | 1) => {
        let newMonth = month + dir;
        let newYear = year;
        if (newMonth < 1) { newMonth = 12; newYear--; }
        if (newMonth > 12) { newMonth = 1; newYear++; }
        router.get('/resident/schedule', { month: newMonth, year: newYear }, { preserveState: true, preserveScroll: true });
    };

    const cells: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);

    return (
        <ResidentLayout>
            <Head title="Collection Schedule" />
            <div className="space-y-5 px-4 py-5 pb-36">

                {/* Header */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                    <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">Collection Schedule</h1>
                    <p className="mt-0.5 text-sm text-neutral-400">{zoneName ? `Zone: ${zoneName}` : 'Your collection calendar'}</p>
                </motion.div>

                {/* Weekly schedule info */}
                {schedules.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.05 }}
                        className="rounded-2xl border border-emerald-200/60 bg-emerald-50/50 p-4 dark:border-emerald-800/30 dark:bg-emerald-950/20"
                    >
                        <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                            <CalendarDays size={14} />
                            Regular collection days
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                            {schedules.map((s) => (
                                <span key={s.day_of_week} className="rounded-lg bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
                                    {DAY_NAMES[s.day_of_week]} {s.start_time?.slice(0, 5)}–{s.end_time?.slice(0, 5)}
                                </span>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Calendar */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}
                    className="overflow-hidden rounded-2xl border border-neutral-200/60 bg-white shadow-sm dark:border-neutral-700/60 dark:bg-neutral-900"
                >
                    {/* Month navigation */}
                    <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-3 dark:border-neutral-800">
                        <button onClick={() => navigate(-1)} className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800">
                            <ChevronLeft size={18} />
                        </button>
                        <h2 className="text-sm font-bold text-neutral-900 dark:text-white">
                            {MONTH_NAMES[month - 1]} {year}
                        </h2>
                        <button onClick={() => navigate(1)} className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800">
                            <ChevronRight size={18} />
                        </button>
                    </div>

                    {/* Day headers */}
                    <div className="grid grid-cols-7 border-b border-neutral-100 dark:border-neutral-800">
                        {DAY_NAMES.map((d) => (
                            <div key={d} className="py-2 text-center text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                                {d}
                            </div>
                        ))}
                    </div>

                    {/* Days grid */}
                    <div className="grid grid-cols-7">
                        {cells.map((day, i) => {
                            if (day === null) return <div key={`empty-${i}`} className="min-h-[60px] border-b border-r border-neutral-50 dark:border-neutral-800/50" />;

                            const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                            const dayOfWeek = new Date(year, month - 1, day).getDay();
                            const isScheduled = scheduledDays.has(dayOfWeek);
                            const dayRoutes = routesByDate[date] ?? [];
                            const isToday = isCurrentMonth && day === today.getDate();

                            return (
                                <div key={day} className={`relative min-h-[60px] border-b border-r border-neutral-50 p-1 dark:border-neutral-800/50 ${isScheduled && dayRoutes.length === 0 ? 'bg-emerald-50/30 dark:bg-emerald-950/10' : ''}`}>
                                    <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold ${
                                        isToday
                                            ? 'bg-emerald-600 text-white'
                                            : isScheduled
                                            ? 'text-emerald-700 dark:text-emerald-400'
                                            : 'text-neutral-500 dark:text-neutral-400'
                                    }`}>
                                        {day}
                                    </span>
                                    {/* Route pills */}
                                    {dayRoutes.map((r) => {
                                        const st = statusStyles[r.status] ?? statusStyles.planned;
                                        return (
                                            <div key={r.id} className={`mt-0.5 flex items-center gap-1 rounded px-1 py-0.5 ${st.bg}`}>
                                                <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                                                <span className={`truncate text-[9px] font-semibold ${st.text}`}>
                                                    {r.status === 'completed' ? 'Done' : r.status === 'in_progress' ? 'Active' : 'Planned'}
                                                </span>
                                            </div>
                                        );
                                    })}
                                    {/* Scheduled day indicator (no route yet) */}
                                    {isScheduled && dayRoutes.length === 0 && (
                                        <div className="mt-0.5 flex items-center gap-1 rounded bg-emerald-50 px-1 py-0.5 dark:bg-emerald-950/30">
                                            <Truck size={8} className="text-emerald-500" />
                                            <span className="text-[9px] font-medium text-emerald-600 dark:text-emerald-400">Scheduled</span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </motion.div>

                {/* Upcoming routes list */}
                {routes.filter((r) => r.status !== 'completed').length > 0 && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.15 }}>
                        <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-neutral-900 dark:text-white">
                            <Clock size={14} className="text-neutral-400" /> Upcoming this month
                        </h3>
                        <div className="space-y-2">
                            {routes.filter((r) => r.status !== 'completed').map((r) => {
                                const st = statusStyles[r.status] ?? statusStyles.planned;
                                return (
                                    <div key={r.id} className="flex items-center gap-3 rounded-2xl border border-neutral-100 bg-white p-3.5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${st.bg}`}>
                                            {r.status === 'in_progress' ? <Truck size={16} className={st.text} /> : <CalendarDays size={16} className={st.text} />}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-semibold text-neutral-900 dark:text-white">{r.route_date}</p>
                                            <p className="text-xs text-neutral-400">{r.collector ?? 'Unassigned'}</p>
                                        </div>
                                        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${st.bg} ${st.text}`}>
                                            {r.status === 'in_progress' ? 'Active' : 'Planned'}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </div>
        </ResidentLayout>
    );
}
