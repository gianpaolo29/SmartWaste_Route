import { Link, router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { Bell, ChevronDown, Maximize, Minimize, Search, X } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserMenuContent } from '@/components/user-menu-content';
import { useInitials } from '@/hooks/use-initials';
import type { BreadcrumbItem as BreadcrumbItemType, User } from '@/types';

type Notification = {
    id: number;
    title: string;
    message: string;
    type: string;
    is_read: boolean;
    created_at: string;
};

export function AdminHeader({ breadcrumbs = [] }: { breadcrumbs?: BreadcrumbItemType[] }) {
    const { auth } = usePage().props as { auth: { user: User } };
    const getInitials = useInitials();
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [notifOpen, setNotifOpen] = useState(false);

    const unreadCount = notifications.filter((n) => !n.is_read).length;

    // Poll notifications
    useEffect(() => {
        const fetchNotifs = async () => {
            try {
                const res = await fetch('/admin/notifications', { headers: { Accept: 'application/json' }, credentials: 'include' });
                if (res.ok) {
                    const data = await res.json();
                    setNotifications(data.notifications ?? []);
                }
            } catch { /* ignore */ }
        };
        fetchNotifs();
        const id = setInterval(fetchNotifs, 30000);
        return () => clearInterval(id);
    }, []);

    const markAllRead = async () => {
        try {
            await fetch('/admin/notifications/read-all', { method: 'POST', headers: { Accept: 'application/json', 'X-XSRF-TOKEN': decodeURIComponent(document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] ?? '') }, credentials: 'include' });
            setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
        } catch { /* ignore */ }
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    const timeAgo = (date: string) => {
        const diff = Date.now() - new Date(date).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        return `${Math.floor(hrs / 24)}d ago`;
    };

    return (
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-neutral-100 bg-white/80 px-4 backdrop-blur-xl transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 dark:border-neutral-800 dark:bg-neutral-950/80">
            {/* Left */}
            <div className="flex flex-1 items-center gap-2">
                <SidebarTrigger className="-ml-1 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400" />
                <div className="hidden h-5 w-px bg-neutral-200 sm:block dark:bg-neutral-800" />
                <div className="hidden sm:block">
                    <Breadcrumbs breadcrumbs={breadcrumbs} />
                </div>
            </div>

            {/* Right */}
            <div className="flex items-center gap-1">
                {/* Search */}
                {searchOpen ? (
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                            <input autoFocus type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search..."
                                className="w-44 rounded-xl border border-neutral-200 bg-neutral-50/50 py-1.5 pl-8 pr-3 text-xs outline-none transition-all focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 sm:w-56 dark:border-neutral-700 dark:bg-neutral-800/50 dark:focus:border-emerald-700" />
                        </div>
                        <button onClick={() => { setSearchOpen(false); setSearchQuery(''); }} className="rounded-lg p-1.5 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800">
                            <X size={16} />
                        </button>
                    </div>
                ) : (
                    <button onClick={() => setSearchOpen(true)} className="flex h-8 w-8 items-center justify-center rounded-xl text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800" title="Search">
                        <Search size={17} />
                    </button>
                )}

                {/* Notifications */}
                <DropdownMenu modal={false} open={notifOpen} onOpenChange={setNotifOpen}>
                    <DropdownMenuTrigger asChild>
                        <button className="relative flex h-8 w-8 items-center justify-center rounded-xl text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800">
                            <Bell size={17} />
                            {unreadCount > 0 && (
                                <span className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white ring-2 ring-white dark:ring-neutral-950">
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            )}
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" sideOffset={8} className="w-80 rounded-2xl border-neutral-200/80 p-0 shadow-xl dark:border-neutral-800">
                        <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3 dark:border-neutral-800">
                            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">Notifications</h3>
                            {unreadCount > 0 && (
                                <button onClick={markAllRead} className="text-xs font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400">
                                    Mark all read
                                </button>
                            )}
                        </div>
                        <div className="max-h-72 overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="px-4 py-8 text-center">
                                    <Bell size={24} className="mx-auto text-neutral-300 dark:text-neutral-600" />
                                    <p className="mt-2 text-sm text-neutral-400 dark:text-neutral-500">No notifications</p>
                                </div>
                            ) : (
                                notifications.map((n) => (
                                    <div key={n.id} className={`border-b border-neutral-50 px-4 py-3 last:border-0 dark:border-neutral-800/50 ${!n.is_read ? 'bg-emerald-50/40 dark:bg-emerald-950/20' : ''}`}>
                                        <div className="flex items-start gap-2">
                                            {!n.is_read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />}
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-medium text-neutral-900 dark:text-white">{n.title}</p>
                                                <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2">{n.message}</p>
                                                <p className="mt-1 text-[11px] text-neutral-400 dark:text-neutral-500">{timeAgo(n.created_at)}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* Fullscreen */}
                <button onClick={toggleFullscreen} className="hidden h-8 w-8 items-center justify-center rounded-xl text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-700 sm:flex dark:text-neutral-400 dark:hover:bg-neutral-800" title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}>
                    {isFullscreen ? <Minimize size={17} /> : <Maximize size={17} />}
                </button>

                {/* Divider */}
                <div className="mx-1 hidden h-5 w-px bg-neutral-200 sm:block dark:bg-neutral-800" />

                {/* User avatar */}
                <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                        <button className="group flex items-center gap-2 rounded-full border border-transparent p-1 pr-2 transition-all hover:border-neutral-200 hover:bg-neutral-50 focus:outline-none dark:hover:border-neutral-700 dark:hover:bg-neutral-800/50">
                            <Avatar className="h-8 w-8 ring-2 ring-emerald-200/60 dark:ring-emerald-800/50">
                                <AvatarImage src={auth.user.avatar} alt={auth.user.name} />
                                <AvatarFallback className="bg-gradient-to-br from-emerald-100 to-teal-100 text-xs font-bold text-emerald-700 dark:from-emerald-900/60 dark:to-teal-900/60 dark:text-emerald-300">
                                    {getInitials(auth.user.name)}
                                </AvatarFallback>
                            </Avatar>
                            <span className="hidden text-xs font-semibold text-neutral-700 md:block dark:text-neutral-300">{auth.user.name}</span>
                            <ChevronDown size={12} className="hidden text-neutral-400 md:block" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 rounded-xl" align="end" sideOffset={8}>
                        <UserMenuContent user={auth.user} />
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
