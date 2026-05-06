import { Link, router, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { AlertTriangle, ChevronDown, Home, LogOut, User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { useInitials } from '@/hooks/use-initials';
import { confirm } from '@/lib/notify';
import { logout } from '@/routes';
import type { NavItem, User as UserType } from '@/types';

const navItems: NavItem[] = [
    { title: 'Home', href: '/resident/dashboard', icon: Home },
    { title: 'Report', href: '/resident/missed-pickup', icon: AlertTriangle },
];

export function ResidentTopbar() {
    const { auth } = usePage().props as { auth: { user: UserType } };
    const { isCurrentUrl } = useCurrentUrl();
    const getInitials = useInitials();

    const handleLogout = async () => {
        const yes = await confirm('Log out?', 'Are you sure you want to log out?', 'Log out');
        if (!yes) return;
        document.body.style.removeProperty('pointer-events');
        router.flushAll();
        router.post(logout());
    };

    return (
        <motion.header
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="sticky top-0 z-40 w-full border-b border-neutral-200/50 bg-white/80 backdrop-blur-xl dark:border-white/[0.06] dark:bg-neutral-950/80"
        >
            <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-4 sm:px-6">
                {/* Logo */}
                <Link href="/resident/dashboard" className="group mr-6 flex items-center gap-2.5" prefetch>
                    <motion.div
                        whileHover={{ scale: 1.05, rotate: -3 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <img src="/logo.png" alt="SmartWaste" className="h-9 w-9 object-contain" />
                    </motion.div>
                    <div className="hidden sm:block">
                        <p className="text-sm font-bold leading-tight text-neutral-900 dark:text-white">SmartWaste</p>
                        <p className="text-[10px] font-medium leading-tight text-neutral-400 dark:text-neutral-500">Route</p>
                    </div>
                </Link>

                {/* Nav Links */}
                <nav className="flex items-center gap-1">
                    {navItems.map((item) => {
                        const active = isCurrentUrl(item.href);
                        return (
                            <Link
                                key={String(item.href)}
                                href={item.href}
                                prefetch
                                className="relative inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors duration-200"
                            >
                                {active && (
                                    <motion.div
                                        layoutId="resident-nav-pill"
                                        className="absolute inset-0 rounded-xl bg-emerald-50 dark:bg-emerald-950/50"
                                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                    />
                                )}
                                <span className={`relative z-10 flex items-center gap-2 ${
                                    active
                                        ? 'text-emerald-700 dark:text-emerald-400'
                                        : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200'
                                }`}>
                                    {item.icon && <item.icon size={16} strokeWidth={active ? 2.3 : 1.8} />}
                                    {item.title}
                                </span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Spacer */}
                <div className="flex-1" />

                {/* User Menu */}
                <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.97 }}
                            className="group flex items-center gap-2 rounded-full border border-transparent p-1 pl-1 pr-2 transition-all duration-200 hover:border-neutral-200 hover:bg-neutral-50 focus:outline-none dark:hover:border-white/10 dark:hover:bg-white/[0.04]"
                        >
                            <Avatar className="h-8 w-8 ring-2 ring-emerald-200/60 transition-all group-hover:ring-emerald-300 dark:ring-emerald-800/50">
                                <AvatarImage src={auth.user.avatar} alt={auth.user.name} />
                                <AvatarFallback className="bg-gradient-to-br from-emerald-100 to-teal-100 text-xs font-bold text-emerald-700 dark:from-emerald-900/60 dark:to-teal-900/60 dark:text-emerald-300">
                                    {getInitials(auth.user.name)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="hidden text-left md:block">
                                <p className="text-xs font-semibold leading-tight text-neutral-800 dark:text-neutral-200">{auth.user.name}</p>
                                <p className="text-[10px] leading-tight text-neutral-400 dark:text-neutral-500">Resident</p>
                            </div>
                            <ChevronDown size={14} className="hidden text-neutral-400 md:block" />
                        </motion.button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" sideOffset={8} className="w-60 rounded-2xl border-neutral-200/80 p-1 shadow-xl shadow-black/[0.08] dark:border-white/10 dark:shadow-black/40">
                        <DropdownMenuLabel className="rounded-xl bg-neutral-50 p-3 font-normal dark:bg-neutral-800/50">
                            <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10 ring-2 ring-emerald-200/60 dark:ring-emerald-800/50">
                                    <AvatarImage src={auth.user.avatar} alt={auth.user.name} />
                                    <AvatarFallback className="bg-gradient-to-br from-emerald-100 to-teal-100 text-sm font-bold text-emerald-700 dark:from-emerald-900/60 dark:to-teal-900/60 dark:text-emerald-300">
                                        {getInitials(auth.user.name)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-semibold text-neutral-900 dark:text-white">{auth.user.name}</p>
                                    <p className="truncate text-xs text-neutral-500 dark:text-neutral-400">{auth.user.email}</p>
                                </div>
                            </div>
                        </DropdownMenuLabel>
                        <div className="py-1">
                            <DropdownMenuGroup>
                                <DropdownMenuItem asChild className="rounded-xl">
                                    <Link href="/resident/account" className="cursor-pointer gap-3 px-3 py-2.5">
                                        <User className="h-4 w-4 text-neutral-500" />
                                        <span>My Account</span>
                                    </Link>
                                </DropdownMenuItem>
                            </DropdownMenuGroup>
                            <DropdownMenuSeparator className="my-1" />
                            <DropdownMenuItem
                                className="cursor-pointer gap-3 rounded-xl px-3 py-2.5 text-red-600 focus:bg-red-50 focus:text-red-600 dark:text-red-400 dark:focus:bg-red-950/30 dark:focus:text-red-400"
                                onClick={handleLogout}
                            >
                                <LogOut className="h-4 w-4" />
                                <span>Log out</span>
                            </DropdownMenuItem>
                        </div>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </motion.header>
    );
}
