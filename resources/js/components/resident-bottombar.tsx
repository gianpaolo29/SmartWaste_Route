import { Link } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, CalendarDays, ClipboardList, Home, User } from 'lucide-react';
import { useCurrentUrl } from '@/hooks/use-current-url';

const tabs = [
    { title: 'Home', href: '/resident/dashboard', icon: Home },
    { title: 'Schedule', href: '/resident/schedule', icon: CalendarDays },
    { title: 'History', href: '/resident/pickup-history', icon: ClipboardList },
    { title: 'Report', href: '/resident/missed-pickup', icon: AlertTriangle },
    { title: 'Account', href: '/resident/account', icon: User },
];

const spring = { type: 'spring' as const, stiffness: 400, damping: 30 };

export function ResidentBottombar() {
    const { isCurrentUrl } = useCurrentUrl();

    let activeIndex = tabs.findIndex((t) => isCurrentUrl(t.href));
    if (activeIndex < 0) activeIndex = 0;

    const activeLeft = ((activeIndex * 2 + 1) / (tabs.length * 2)) * 100;

    return (
        <nav
            className="fixed inset-x-0 bottom-0 z-40 px-5"
            style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
        >
            <div className="relative mx-auto max-w-md">
                {/* ===== Glow behind circle ===== */}
                <motion.div
                    className="pointer-events-none absolute -top-[20px] z-[9] h-[44px] w-[44px]"
                    animate={{ left: `${activeLeft}%` }}
                    initial={false}
                    style={{ x: '-50%' }}
                    transition={spring}
                >
                    <div className="h-full w-full rounded-full bg-gradient-to-b from-emerald-400/30 to-emerald-600/10 blur-xl dark:from-emerald-400/20 dark:to-emerald-600/5" />
                </motion.div>

                {/* ===== Floating circle ===== */}
                <motion.div
                    className="pointer-events-none absolute -top-[28px] z-20 h-[58px] w-[58px]"
                    animate={{ left: `${activeLeft}%` }}
                    initial={false}
                    style={{ x: '-50%' }}
                    transition={spring}
                >
                    {/* Gradient ring */}
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-300 via-emerald-400/60 to-teal-300 p-[3px] shadow-[0_4px_20px_rgba(16,185,129,0.25)] dark:from-emerald-500/70 dark:via-emerald-600/40 dark:to-teal-500/70 dark:shadow-[0_4px_20px_rgba(16,185,129,0.15)]">
                        <div className="flex h-full w-full items-center justify-center rounded-full bg-white dark:bg-neutral-900">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeIndex}
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0, opacity: 0 }}
                                    transition={{
                                        type: 'spring',
                                        stiffness: 500,
                                        damping: 24,
                                    }}
                                >
                                    {(() => {
                                        const Icon = tabs[activeIndex].icon;
                                        return (
                                            <Icon
                                                size={23}
                                                strokeWidth={2.3}
                                                className="text-emerald-600 dark:text-emerald-400"
                                            />
                                        );
                                    })()}
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </div>
                </motion.div>

                {/* ===== Bump connector (SVG) ===== */}
                <motion.div
                    className="pointer-events-none absolute -top-[22px] z-10 h-[26px] w-[100px]"
                    animate={{ left: `${activeLeft}%` }}
                    initial={false}
                    style={{ x: '-50%' }}
                    transition={spring}
                >
                    <svg
                        viewBox="0 0 100 26"
                        className="h-full w-full"
                        preserveAspectRatio="none"
                    >
                        <path
                            d="M 0 26 C 0 26 4 26 8 22 C 14 16 18 0 26 0 L 74 0 C 82 0 86 16 92 22 C 96 26 100 26 100 26 Z"
                            className="fill-white/95 dark:fill-neutral-900/95"
                        />
                    </svg>
                </motion.div>

                {/* ===== Bar ===== */}
                <div className="relative z-[5] flex h-[66px] items-end rounded-[24px] border border-white/80 bg-white/90 px-2 pb-2.5 shadow-[0_-2px_30px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.04)] backdrop-blur-xl dark:border-white/[0.06] dark:bg-neutral-900/90 dark:shadow-[0_-2px_30px_rgba(0,0,0,0.4)]">
                    {tabs.map((tab, i) => {
                        const active = i === activeIndex;
                        const Icon = tab.icon;

                        return (
                            <Link
                                key={String(tab.href)}
                                href={tab.href}
                                prefetch
                                className="flex flex-1 flex-col items-center gap-1"
                            >
                                {/* Icon — fades when active (shown in floating circle) */}
                                <motion.div
                                    animate={{
                                        opacity: active ? 0 : 0.55,
                                        scale: active ? 0.3 : 1,
                                        y: active ? -10 : 0,
                                    }}
                                    transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                                >
                                    <Icon
                                        size={21}
                                        strokeWidth={1.8}
                                        className="text-neutral-400 dark:text-neutral-500"
                                    />
                                </motion.div>

                                {/* Label */}
                                <motion.span
                                    animate={{ opacity: active ? 1 : 0.5 }}
                                    transition={{ duration: 0.25 }}
                                    className={`text-[10.5px] font-bold tracking-wider uppercase ${
                                        active
                                            ? 'text-emerald-600 dark:text-emerald-400'
                                            : 'text-neutral-400 dark:text-neutral-500'
                                    }`}
                                >
                                    {tab.title}
                                </motion.span>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </nav>
    );
}
