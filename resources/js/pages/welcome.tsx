import { Head, Link, usePage } from '@inertiajs/react';
import {
    Route,
    Leaf,
    BarChart3,
    MapPin,
    Bell,
    Recycle,
    CheckCircle2,
    ArrowRight,
    Mail,
    Phone,
    Send,
    Sparkles,
    Shield,
    Zap,
    Globe,
    ChevronRight,
    Play,
    Menu,
    X,
    CalendarDays,
    Truck,
    Users,
    ClipboardList,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { dashboard, login, register } from '@/routes';

type Feature = {
    icon: React.ElementType;
    title: string;
    description: string;
    gradient: string;
};

const features: Feature[] = [
    {
        icon: Route,
        title: 'Route Planning & Optimization',
        description:
            'Create and manage optimized collection routes with turn-by-turn voice navigation for collectors in the field.',
        gradient: 'from-emerald-500 to-teal-600',
    },
    {
        icon: MapPin,
        title: 'Zone & Barangay Management',
        description:
            'Organize collection areas by barangays and zones for structured, efficient waste pickup coverage.',
        gradient: 'from-blue-500 to-cyan-600',
    },
    {
        icon: Bell,
        title: 'Real-time Notifications',
        description:
            'Residents receive alerts when collection trucks are nearby, so they never miss a pickup.',
        gradient: 'from-violet-500 to-purple-600',
    },
    {
        icon: ClipboardList,
        title: 'Collection Reports',
        description:
            'Track waste collected per route — mixed waste, biodegradable, recyclable, residual, and solid waste breakdowns.',
        gradient: 'from-orange-500 to-amber-600',
    },
    {
        icon: CalendarDays,
        title: 'Schedule Management',
        description:
            'Plan and manage collection schedules so residents and collectors always know when pickups happen.',
        gradient: 'from-green-500 to-emerald-600',
    },
    {
        icon: BarChart3,
        title: 'Missed Pickup Reporting',
        description:
            'Residents can report missed pickups directly, helping admins identify and resolve service gaps.',
        gradient: 'from-teal-500 to-green-600',
    },
];

const steps = [
    {
        title: 'Admin Plans Routes',
        description: 'Admins create optimized collection routes across barangays and zones.',
        icon: Route,
    },
    {
        title: 'Schedules Published',
        description: 'Collection schedules are set and shared with collectors and residents.',
        icon: CalendarDays,
    },
    {
        title: 'Collectors Navigate',
        description: 'Collectors follow routes with GPS tracking and voice-guided navigation.',
        icon: Truck,
    },
    {
        title: 'Reports & Insights',
        description: 'Waste data is logged per stop — track totals, breakdowns, and missed pickups.',
        icon: BarChart3,
    },
];

const stats = [
    { value: 100, suffix: '%', label: 'Route Coverage', icon: Route },
    { value: 5, suffix: '', label: 'Waste Categories', icon: Recycle },
    { value: 3, suffix: '', label: 'User Roles', icon: Users },
    { value: 24, suffix: '/7', label: 'GPS Tracking', icon: Globe },
];

function useCountUp(target: number, duration = 2000, shouldStart = true) {
    const [value, setValue] = useState(0);
    useEffect(() => {
        if (!shouldStart) return;
        let raf = 0;
        const start = performance.now();
        const tick = (now: number) => {
            const p = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1 - p, 3);
            setValue(Math.floor(eased * target));
            if (p < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [target, duration, shouldStart]);
    return value;
}

function StatCard({ value, suffix, label, icon: Icon, index }: { value: number; suffix: string; label: string; icon: React.ElementType; index: number }) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: '-50px' });
    const n = useCountUp(value, 2000, isInView);

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="group relative overflow-hidden rounded-2xl border border-white/20 bg-white/60 p-4 text-center shadow-sm backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/5 sm:p-6 dark:border-white/5 dark:bg-white/[0.03]"
        >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.03] to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            <div className="relative">
                <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition-colors group-hover:bg-emerald-100 sm:mb-3 sm:h-10 sm:w-10 dark:bg-emerald-900/20 dark:text-emerald-400">
                    <Icon size={16} className="sm:hidden" />
                    <Icon size={18} className="hidden sm:block" />
                </div>
                <div className="text-2xl font-bold tracking-tight text-[#1b4332] sm:text-4xl dark:text-emerald-300">
                    {n}
                    <span className="text-[#2d6a4f] dark:text-emerald-400">{suffix}</span>
                </div>
                <div className="mt-1 text-xs font-medium text-gray-500 sm:mt-1.5 sm:text-sm dark:text-gray-400">{label}</div>
            </div>
        </motion.div>
    );
}

function RouteDemo() {
    const bins = useMemo(
        () => [
            { id: 1, x: 60, y: 80 },
            { id: 2, x: 140, y: 50 },
            { id: 3, x: 220, y: 110 },
            { id: 4, x: 300, y: 60 },
            { id: 5, x: 360, y: 140 },
            { id: 6, x: 260, y: 200 },
            { id: 7, x: 130, y: 180 },
        ],
        [],
    );
    const [active, setActive] = useState(0);
    useEffect(() => {
        const t = setInterval(() => setActive((a) => (a + 1) % (bins.length + 1)), 900);
        return () => clearInterval(t);
    }, [bins.length]);

    const path = bins
        .slice(0, active)
        .map((b, i) => `${i === 0 ? 'M' : 'L'} ${b.x} ${b.y}`)
        .join(' ');

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="relative overflow-hidden rounded-2xl border border-white/20 bg-gradient-to-br from-emerald-50 to-teal-50 p-4 shadow-2xl shadow-emerald-500/10 sm:rounded-3xl sm:p-6 dark:border-white/5 dark:from-[#0d2818] dark:to-[#071a10]"
        >
            <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-emerald-400/10 blur-3xl" />
            <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-teal-400/10 blur-3xl" />

            <svg viewBox="0 0 420 240" className="relative h-full w-full">
                <defs>
                    <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                        <path
                            d="M 20 0 L 0 0 0 20"
                            fill="none"
                            stroke="rgba(45,106,79,0.08)"
                            strokeWidth="1"
                        />
                    </pattern>
                    <linearGradient id="routeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#2d6a4f" />
                        <stop offset="100%" stopColor="#40916c" />
                    </linearGradient>
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>
                <rect width="420" height="240" fill="url(#grid)" />
                {path && (
                    <path
                        d={path}
                        fill="none"
                        stroke="url(#routeGrad)"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeDasharray="8 4"
                        filter="url(#glow)"
                    />
                )}
                {bins.map((b, i) => (
                    <g key={b.id}>
                        {i < active && (
                            <circle
                                cx={b.x}
                                cy={b.y}
                                r="18"
                                fill="#2d6a4f"
                                opacity="0.06"
                            />
                        )}
                        <circle
                            cx={b.x}
                            cy={b.y}
                            r={i < active ? 8 : 6}
                            fill={i < active ? '#2d6a4f' : '#e8f5e9'}
                            stroke={i < active ? '#1b4332' : '#2d6a4f'}
                            strokeWidth="2"
                            className="transition-all duration-500"
                        />
                        {i === active - 1 && (
                            <>
                                <circle
                                    cx={b.x}
                                    cy={b.y}
                                    r="16"
                                    fill="none"
                                    stroke="#2d6a4f"
                                    strokeWidth="2"
                                    opacity="0.4"
                                >
                                    <animate attributeName="r" from="10" to="26" dur="1.5s" repeatCount="indefinite" />
                                    <animate attributeName="opacity" from="0.5" to="0" dur="1.5s" repeatCount="indefinite" />
                                </circle>
                                <circle
                                    cx={b.x}
                                    cy={b.y}
                                    r="10"
                                    fill="none"
                                    stroke="#40916c"
                                    strokeWidth="1.5"
                                    opacity="0.3"
                                >
                                    <animate attributeName="r" from="10" to="20" dur="1.5s" repeatCount="indefinite" begin="0.3s" />
                                    <animate attributeName="opacity" from="0.4" to="0" dur="1.5s" repeatCount="indefinite" begin="0.3s" />
                                </circle>
                            </>
                        )}
                    </g>
                ))}
            </svg>

            <div className="mt-2 flex items-center justify-between">
                <div className="flex items-center gap-2 text-[10px] font-medium text-[#1b4332] sm:text-xs dark:text-emerald-300">
                    <span className="flex h-2 w-2 rounded-full bg-emerald-500">
                        <span className="h-2 w-2 animate-ping rounded-full bg-emerald-400" />
                    </span>
                    Live route simulation
                </div>
                <div className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 sm:px-2.5 sm:text-xs dark:bg-emerald-900/30 dark:text-emerald-300">
                    {active}/{bins.length} stops
                </div>
            </div>
        </motion.div>
    );
}

function FloatingOrb({ className, delay = 0 }: { className?: string; delay?: number }) {
    return (
        <motion.div
            className={`pointer-events-none absolute rounded-full blur-3xl ${className}`}
            animate={{
                y: [0, -30, 0],
                x: [0, 15, 0],
                scale: [1, 1.1, 1],
            }}
            transition={{
                duration: 8,
                delay,
                repeat: Infinity,
                ease: 'easeInOut',
            }}
        />
    );
}

export default function Welcome({ canRegister = true }: { canRegister?: boolean }) {
    const { auth } = usePage().props as unknown as { auth: { user: { name: string } | null }; canRegister: boolean };
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const navItems = [
        { label: 'Home', href: '#home' },
        { label: 'Features', href: '#features' },
        { label: 'How It Works', href: '#how-it-works' },
        { label: 'Contact', href: '#contact' },
    ];

    const [activeFeature, setActiveFeature] = useState<number | null>(null);
    const [form, setForm] = useState({ name: '', email: '', message: '' });
    const [sent, setSent] = useState(false);

    const featuresRef = useRef(null);
    const featuresInView = useInView(featuresRef, { once: true, margin: '-100px' });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSent(true);
        setTimeout(() => {
            setSent(false);
            setForm({ name: '', email: '', message: '' });
        }, 2500);
    };

    return (
        <>
            <Head title="Welcome | SmartWaste Route">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link
                    href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600,700"
                    rel="stylesheet"
                />
            </Head>

            <div className="flex min-h-screen flex-col overflow-x-hidden bg-[#FAFBF9] text-[#1b1b18] dark:bg-[#080c08] dark:text-[#EDEDEC]">
                {/* Header */}
                <motion.header
                    className="fixed top-0 z-50 w-full"
                    initial={{ y: -100 }}
                    animate={{ y: 0 }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                >
                    <div className="mx-auto max-w-7xl px-3 py-2 sm:px-6 sm:py-3">
                        <div className="flex items-center justify-between rounded-2xl border border-white/40 bg-white/70 px-3 py-2.5 shadow-lg shadow-black/[0.03] backdrop-blur-xl sm:px-5 sm:py-3 dark:border-white/5 dark:bg-[#111]/70">
                            {/* Logo */}
                            <a href="#home" className="flex items-center gap-2 font-bold text-[#1b4332] dark:text-emerald-400">
                                <img src="/logo.png" alt="SmartWaste" className="h-8 w-8 flex-shrink-0 object-contain sm:h-9 sm:w-9" />
                                <span className="hidden text-lg tracking-tight sm:inline">SmartWaste</span>
                            </a>

                            {/* Desktop nav */}
                            <nav className="hidden items-center gap-1 md:flex">
                                {navItems.map((item) => (
                                    <a
                                        key={item.label}
                                        href={item.href}
                                        className="rounded-lg px-3.5 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-emerald-50 hover:text-[#1b4332] dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-emerald-300"
                                    >
                                        {item.label}
                                    </a>
                                ))}
                            </nav>

                            {/* Right side actions */}
                            <div className="flex items-center gap-2 sm:gap-3">
                                {auth?.user ? (
                                    <Link
                                        href={dashboard()}
                                        className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#2d6a4f] to-[#40916c] px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all hover:-translate-y-0.5 sm:gap-2 sm:rounded-xl sm:px-5 sm:py-2.5 sm:text-sm"
                                    >
                                        Dashboard
                                        <ArrowRight size={14} />
                                    </Link>
                                ) : (
                                    <>
                                        <Link href={login()} className="hidden px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:text-[#1b4332] sm:block dark:text-gray-400">
                                            Log in
                                        </Link>
                                        {canRegister && (
                                            <Link
                                                href={register()}
                                                className="hidden items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#2d6a4f] to-[#40916c] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all hover:-translate-y-0.5 sm:inline-flex"
                                            >
                                                Get Started
                                                <ChevronRight size={14} />
                                            </Link>
                                        )}
                                    </>
                                )}
                                <button
                                    className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 md:hidden dark:hover:bg-white/5"
                                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                >
                                    {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                                </button>
                            </div>
                        </div>

                        {/* Mobile menu */}
                        <AnimatePresence>
                            {mobileMenuOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10, height: 0 }}
                                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                                    exit={{ opacity: 0, y: -10, height: 0 }}
                                    className="mt-2 overflow-hidden rounded-2xl border border-white/40 bg-white/95 backdrop-blur-xl md:hidden dark:border-white/5 dark:bg-[#111]/95"
                                >
                                    <nav className="flex flex-col p-2">
                                        {navItems.map((item) => (
                                            <a
                                                key={item.label}
                                                href={item.href}
                                                onClick={() => setMobileMenuOpen(false)}
                                                className="rounded-xl px-4 py-3 text-sm font-medium text-gray-600 transition-colors hover:bg-emerald-50 hover:text-[#1b4332] dark:text-gray-300 dark:hover:bg-white/5"
                                            >
                                                {item.label}
                                            </a>
                                        ))}
                                        <div className="mt-1 border-t border-gray-100 pt-2 dark:border-white/5">
                                            {!auth?.user && (
                                                <>
                                                    <Link
                                                        href={login()}
                                                        onClick={() => setMobileMenuOpen(false)}
                                                        className="block rounded-xl px-4 py-3 text-sm font-medium text-gray-600 hover:bg-emerald-50 hover:text-[#1b4332] dark:text-gray-300"
                                                    >
                                                        Log in
                                                    </Link>
                                                    {canRegister && (
                                                        <Link
                                                            href={register()}
                                                            onClick={() => setMobileMenuOpen(false)}
                                                            className="mx-2 mt-1 block rounded-xl bg-gradient-to-r from-[#2d6a4f] to-[#40916c] px-4 py-3 text-center text-sm font-semibold text-white shadow-md"
                                                        >
                                                            Get Started
                                                        </Link>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </nav>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.header>

                <main>
                    {/* Hero */}
                    <section id="home" className="relative overflow-hidden px-4 pb-16 pt-24 sm:px-6 sm:pb-20 sm:pt-36 lg:pt-40">
                        {/* Background orbs */}
                        <FloatingOrb className="-left-32 -top-32 h-[300px] w-[300px] bg-emerald-400/15 sm:h-[500px] sm:w-[500px] dark:bg-emerald-500/10" delay={0} />
                        <FloatingOrb className="-right-32 top-20 h-[250px] w-[250px] bg-teal-300/10 sm:h-[400px] sm:w-[400px] dark:bg-teal-500/5" delay={2} />
                        <FloatingOrb className="-bottom-20 left-1/3 h-[200px] w-[200px] bg-green-300/10 sm:h-[350px] sm:w-[350px] dark:bg-green-500/5" delay={4} />

                        {/* Subtle grid */}
                        <div className="absolute inset-0 -z-10" style={{
                            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(45,106,79,0.04) 1px, transparent 0)',
                            backgroundSize: '40px 40px',
                        }} />

                        <div className="mx-auto grid max-w-7xl items-center gap-10 sm:gap-16 lg:grid-cols-2">
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                                className="text-center lg:text-left"
                            >
                                <motion.span
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.2, duration: 0.5 }}
                                    className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700 sm:px-4 sm:py-1.5 sm:text-xs dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300"
                                >
                                    <Sparkles size={12} />
                                    Smart Waste Collection System
                                </motion.span>

                                <h1 className="mt-5 text-3xl font-bold leading-[1.15] tracking-tight sm:mt-6 sm:text-5xl lg:text-6xl xl:text-7xl">
                                    Smarter routes.{' '}
                                    <span className="bg-gradient-to-r from-[#1b4332] via-[#2d6a4f] to-[#52b788] bg-clip-text text-transparent dark:from-emerald-300 dark:via-emerald-400 dark:to-teal-300">
                                        Cleaner communities.
                                    </span>
                                </h1>

                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.3, duration: 0.6 }}
                                    className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-gray-500 sm:mt-6 sm:text-lg lg:mx-0 dark:text-gray-400"
                                >
                                    SmartWaste Route streamlines waste collection with optimized routing,
                                    real-time GPS tracking, voice-guided navigation for collectors, and
                                    resident notifications — all in one platform.
                                </motion.p>

                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5, duration: 0.6 }}
                                    className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:flex-wrap sm:gap-4 lg:justify-start"
                                    style={{ alignItems: 'center' }}
                                >
                                    <a
                                        href="#features"
                                        className="group inline-flex w-full items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-[#1b4332] via-[#2d6a4f] to-[#40916c] px-7 py-3.5 text-sm font-semibold text-white shadow-xl shadow-emerald-600/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl sm:w-auto"
                                    >
                                        Explore Features
                                        <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
                                    </a>
                                    <a
                                        href="#how-it-works"
                                        className="group inline-flex w-full items-center justify-center gap-2.5 rounded-xl border border-gray-200 bg-white px-7 py-3.5 text-sm font-semibold text-gray-700 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-lg sm:w-auto dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:border-emerald-800"
                                    >
                                        <Play size={14} className="text-emerald-600" />
                                        How it works
                                    </a>
                                </motion.div>

                                {/* Trust badges */}
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.7, duration: 0.6 }}
                                    className="mt-8 flex flex-wrap items-center justify-center gap-4 text-[11px] text-gray-400 sm:mt-12 sm:gap-6 sm:text-xs lg:justify-start"
                                >
                                    <div className="flex items-center gap-1.5">
                                        <Shield size={13} className="text-emerald-600" />
                                        <span>Role-based access</span>
                                    </div>
                                    <div className="hidden h-3 w-px bg-gray-200 sm:block dark:bg-gray-700" />
                                    <div className="flex items-center gap-1.5">
                                        <Zap size={13} className="text-emerald-600" />
                                        <span>Real-time GPS tracking</span>
                                    </div>
                                    <div className="hidden h-3 w-px bg-gray-200 sm:block dark:bg-gray-700" />
                                    <div className="flex items-center gap-1.5">
                                        <Leaf size={13} className="text-emerald-600" />
                                        <span>Eco-friendly operations</span>
                                    </div>
                                </motion.div>
                            </motion.div>

                            <RouteDemo />
                        </div>

                        {/* Stats */}
                        <div className="mx-auto mt-16 grid max-w-5xl grid-cols-2 gap-3 sm:mt-24 sm:gap-4 md:grid-cols-4">
                            {stats.map((s, i) => (
                                <StatCard key={s.label} {...s} index={i} />
                            ))}
                        </div>
                    </section>

                    {/* Features */}
                    <section id="features" className="relative px-4 py-16 sm:px-6 sm:py-28" ref={featuresRef}>
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-50/30 to-transparent dark:via-emerald-950/10" />

                        <div className="relative mx-auto max-w-7xl">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={featuresInView ? { opacity: 1, y: 0 } : {}}
                                transition={{ duration: 0.6 }}
                                className="text-center"
                            >
                                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700 sm:px-4 sm:py-1.5 sm:text-xs dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300">
                                    Features
                                </span>
                                <h2 className="mt-4 text-2xl font-bold tracking-tight sm:mt-5 sm:text-4xl md:text-5xl">
                                    Everything you need for waste collection
                                </h2>
                                <p className="mx-auto mt-3 max-w-2xl text-base text-gray-500 sm:mt-4 sm:text-lg dark:text-gray-400">
                                    From route planning to collection reporting — a complete platform for admins, collectors, and residents.
                                </p>
                            </motion.div>

                            <div className="mt-10 grid gap-4 sm:mt-16 sm:gap-5 md:grid-cols-2 lg:grid-cols-3">
                                {features.map((f, i) => {
                                    const Icon = f.icon;
                                    const isActive = activeFeature === i;
                                    return (
                                        <motion.div
                                            key={f.title}
                                            initial={{ opacity: 0, y: 30 }}
                                            animate={featuresInView ? { opacity: 1, y: 0 } : {}}
                                            transition={{ duration: 0.5, delay: i * 0.08 }}
                                            onMouseEnter={() => setActiveFeature(i)}
                                            onMouseLeave={() => setActiveFeature(null)}
                                            className={`group relative cursor-default overflow-hidden rounded-2xl border p-5 transition-all duration-500 sm:p-7 ${
                                                isActive
                                                    ? 'border-emerald-200 bg-white shadow-xl shadow-emerald-500/5 dark:border-emerald-800/50 dark:bg-white/[0.06]'
                                                    : 'border-gray-100 bg-white/60 hover:border-gray-200 dark:border-white/5 dark:bg-white/[0.02] dark:hover:border-white/10'
                                            }`}
                                        >
                                            <div className={`absolute inset-0 bg-gradient-to-br ${f.gradient} opacity-0 transition-opacity duration-500 ${isActive ? 'opacity-[0.03]' : ''}`} />
                                            <div className="relative">
                                                <div
                                                    className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-500 sm:mb-5 sm:h-12 sm:w-12 sm:rounded-2xl ${
                                                        isActive
                                                            ? `bg-gradient-to-br ${f.gradient} text-white shadow-lg`
                                                            : 'bg-gray-50 text-gray-600 dark:bg-white/5 dark:text-gray-400'
                                                    }`}
                                                >
                                                    <Icon size={20} className="sm:hidden" />
                                                    <Icon size={22} className="hidden sm:block" />
                                                </div>
                                                <h3 className="text-base font-semibold tracking-tight sm:text-lg">{f.title}</h3>
                                                <p className="mt-2 text-sm leading-relaxed text-gray-500 sm:mt-2.5 dark:text-gray-400">
                                                    {f.description}
                                                </p>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </div>
                    </section>

                    {/* How it works */}
                    <section id="how-it-works" className="relative px-4 py-16 sm:px-6 sm:py-28">
                        <div className="mx-auto max-w-7xl">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: '-100px' }}
                                transition={{ duration: 0.6 }}
                                className="text-center"
                            >
                                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700 sm:px-4 sm:py-1.5 sm:text-xs dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300">
                                    How It Works
                                </span>
                                <h2 className="mt-4 text-2xl font-bold tracking-tight sm:mt-5 sm:text-4xl md:text-5xl">
                                    Four simple steps
                                </h2>
                                <p className="mx-auto mt-3 max-w-2xl text-base text-gray-500 sm:mt-4 sm:text-lg dark:text-gray-400">
                                    From route planning to collection reporting — efficient waste management made simple.
                                </p>
                            </motion.div>

                            <div className="relative mt-10 grid grid-cols-2 gap-4 sm:mt-16 sm:gap-6 md:grid-cols-4">
                                {/* Connecting line */}
                                <div className="absolute left-0 right-0 top-[60px] hidden h-px bg-gradient-to-r from-transparent via-emerald-200 to-transparent md:block dark:via-emerald-800/30" />

                                {steps.map((step, i) => {
                                    const Icon = step.icon;
                                    return (
                                        <motion.div
                                            key={step.title}
                                            initial={{ opacity: 0, y: 30 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            viewport={{ once: true, margin: '-50px' }}
                                            transition={{ duration: 0.5, delay: i * 0.12 }}
                                            className="group relative text-center"
                                        >
                                            <div className="relative mx-auto mb-4 flex h-14 w-14 items-center justify-center sm:mb-6 sm:h-[72px] sm:w-[72px]">
                                                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-50 transition-transform duration-500 group-hover:scale-110 sm:rounded-2xl dark:from-emerald-900/20 dark:to-teal-900/10" />
                                                <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-md bg-gradient-to-br from-[#2d6a4f] to-[#40916c] text-[9px] font-bold text-white shadow-md sm:h-6 sm:w-6 sm:rounded-lg sm:text-[10px]">
                                                    {i + 1}
                                                </div>
                                                <Icon size={20} className="relative text-[#2d6a4f] sm:hidden dark:text-emerald-400" />
                                                <Icon size={26} className="relative hidden text-[#2d6a4f] sm:block dark:text-emerald-400" />
                                            </div>
                                            <h3 className="text-sm font-semibold sm:text-lg">{step.title}</h3>
                                            <p className="mt-1 text-xs text-gray-500 sm:mt-2 sm:text-sm dark:text-gray-400">
                                                {step.description}
                                            </p>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </div>
                    </section>

                    {/* CTA Banner */}
                    <section className="px-4 py-10 sm:px-6 sm:py-16">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            className="mx-auto max-w-5xl overflow-hidden rounded-2xl bg-gradient-to-br from-[#1b4332] via-[#2d6a4f] to-[#40916c] p-8 text-center text-white shadow-2xl shadow-emerald-900/20 sm:rounded-3xl sm:p-12 md:p-16"
                        >
                            <div className="relative">
                                <h2 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
                                    Ready to optimize your waste collection?
                                </h2>
                                <p className="mx-auto mt-3 max-w-xl text-sm text-emerald-100/80 sm:mt-4 sm:text-base">
                                    Join SmartWaste Route and streamline collection operations for your community.
                                </p>
                                <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-4">
                                    <Link
                                        href={register()}
                                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-[#1b4332] shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl sm:px-8 sm:py-3.5"
                                    >
                                        Get Started Free
                                        <ArrowRight size={16} />
                                    </Link>
                                    <a
                                        href="#contact"
                                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 px-6 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-white/10 sm:px-8 sm:py-3.5"
                                    >
                                        Contact Us
                                    </a>
                                </div>
                            </div>
                        </motion.div>
                    </section>

                    {/* Contact */}
                    <section id="contact" className="px-4 py-16 sm:px-6 sm:py-28">
                        <div className="mx-auto grid max-w-6xl gap-10 sm:gap-16 lg:grid-cols-2">
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6 }}
                                className="text-center lg:text-left"
                            >
                                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700 sm:px-4 sm:py-1.5 sm:text-xs dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300">
                                    Contact Us
                                </span>
                                <h2 className="mt-4 text-2xl font-bold tracking-tight sm:mt-5 sm:text-4xl md:text-5xl">Get in touch</h2>
                                <p className="mt-3 text-base text-gray-500 sm:mt-4 sm:text-lg dark:text-gray-400">
                                    Have questions about SmartWaste Route? We'd love to hear from you.
                                </p>
                                <div className="mt-8 flex flex-col items-center gap-4 sm:mt-10 sm:gap-5 lg:items-start">
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 sm:h-12 sm:w-12 sm:rounded-2xl dark:bg-emerald-900/20 dark:text-emerald-400">
                                            <Mail size={18} className="sm:hidden" />
                                            <Mail size={20} className="hidden sm:block" />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-xs text-gray-400 sm:text-sm">Email us at</p>
                                            <p className="text-sm font-medium sm:text-base">hello@smartwaste-route.com</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 sm:h-12 sm:w-12 sm:rounded-2xl dark:bg-emerald-900/20 dark:text-emerald-400">
                                            <Phone size={18} className="sm:hidden" />
                                            <Phone size={20} className="hidden sm:block" />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-xs text-gray-400 sm:text-sm">Call us at</p>
                                            <p className="text-sm font-medium sm:text-base">+63 (912) 345-6789</p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>

                            <motion.form
                                initial={{ opacity: 0, x: 20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: 0.1 }}
                                onSubmit={handleSubmit}
                                className="overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-xl shadow-gray-200/50 sm:rounded-3xl sm:p-8 md:p-10 dark:border-white/5 dark:bg-white/[0.03] dark:shadow-none"
                            >
                                <div className="space-y-4 sm:space-y-5">
                                    <div>
                                        <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Your name</label>
                                        <input
                                            required
                                            type="text"
                                            value={form.name}
                                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                                            className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm outline-none transition-all focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 dark:border-white/10 dark:bg-white/5 dark:focus:border-emerald-600 dark:focus:bg-white/[0.03]"
                                            placeholder="Juan Dela Cruz"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Email address</label>
                                        <input
                                            required
                                            type="email"
                                            value={form.email}
                                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                                            className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm outline-none transition-all focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 dark:border-white/10 dark:bg-white/5 dark:focus:border-emerald-600 dark:focus:bg-white/[0.03]"
                                            placeholder="you@example.com"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Message</label>
                                        <textarea
                                            required
                                            rows={4}
                                            value={form.message}
                                            onChange={(e) => setForm({ ...form, message: e.target.value })}
                                            className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm outline-none transition-all focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 dark:border-white/10 dark:bg-white/5 dark:focus:border-emerald-600 dark:focus:bg-white/[0.03]"
                                            placeholder="Tell us about your needs..."
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={sent}
                                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#1b4332] to-[#2d6a4f] px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition-all hover:-translate-y-0.5 hover:shadow-xl disabled:opacity-70"
                                    >
                                        {sent ? (
                                            <>
                                                <CheckCircle2 size={18} /> Message sent!
                                            </>
                                        ) : (
                                            <>
                                                <Send size={16} /> Send message
                                            </>
                                        )}
                                    </button>
                                </div>
                            </motion.form>
                        </div>
                    </section>
                </main>

                {/* Footer */}
                <footer className="border-t border-gray-100 dark:border-white/5">
                    <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-6 sm:px-6 sm:py-8 md:flex-row">
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                            <img src="/logo.png" alt="SmartWaste" className="h-7 w-7 object-contain" />
                            SmartWaste Route
                        </div>
                        <p className="text-xs text-gray-400 sm:text-sm">
                            &copy; {new Date().getFullYear()} SmartWaste Route. Building cleaner communities.
                        </p>
                    </div>
                </footer>
            </div>
        </>
    );
}
