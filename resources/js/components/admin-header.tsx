import { Link, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { Bell, Maximize, Minimize, Search, Settings, X } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Breadcrumbs } from '@/components/breadcrumbs';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserMenuContent } from '@/components/user-menu-content';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';

export function AdminHeader({ breadcrumbs = [] }: { breadcrumbs?: BreadcrumbItemType[] }) {
    const { auth } = usePage().props;
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isFullscreen, setIsFullscreen] = useState(false);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    const initials = auth.user.name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    return (
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-gray-100 bg-white/80 px-4 backdrop-blur-xl transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 dark:border-white/5 dark:bg-[#0a0a0a]/80">
            {/* Left: sidebar trigger + breadcrumbs */}
            <div className="flex flex-1 items-center gap-2">
                <SidebarTrigger className="-ml-1 text-gray-500 hover:text-gray-700 dark:text-gray-400" />
                <div className="hidden h-5 w-px bg-gray-200 sm:block dark:bg-white/10" />
                <div className="hidden sm:block">
                    <Breadcrumbs breadcrumbs={breadcrumbs} />
                </div>
            </div>

            {/* Right: actions */}
            <div className="flex items-center gap-1">
                {/* Search */}
                {searchOpen ? (
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                autoFocus
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search..."
                                className="w-44 rounded-lg border border-gray-200 bg-gray-50/50 py-1.5 pl-8 pr-3 text-xs outline-none transition-all focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 sm:w-56 dark:border-white/10 dark:bg-white/5"
                            />
                        </div>
                        <button
                            onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
                            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/5"
                        >
                            <X size={16} />
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => setSearchOpen(true)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5"
                        title="Search"
                    >
                        <Search size={17} />
                    </button>
                )}

                {/* Notifications */}
                <button
                    className="relative flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5"
                    title="Notifications"
                >
                    <Bell size={17} />
                    <span className="absolute right-1 top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white">
                        2
                    </span>
                </button>

                {/* Fullscreen */}
                <button
                    onClick={toggleFullscreen}
                    className="hidden h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 sm:flex dark:text-gray-400 dark:hover:bg-white/5"
                    title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                >
                    {isFullscreen ? <Minimize size={17} /> : <Maximize size={17} />}
                </button>

                {/* Settings */}
                <Link
                    href="/settings/profile"
                    className="hidden h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 sm:flex dark:text-gray-400 dark:hover:bg-white/5"
                    title="Settings"
                >
                    <Settings size={17} />
                </Link>

                {/* Divider */}
                <div className="mx-1 hidden h-5 w-px bg-gray-200 sm:block dark:bg-white/10" />

                {/* User avatar */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#2d6a4f] to-[#40916c] text-xs font-bold text-white shadow-sm ring-2 ring-white transition-all hover:ring-emerald-200 dark:ring-[#0a0a0a] dark:hover:ring-emerald-800/50">
                            {initials}
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 rounded-xl" align="end" side="bottom" sideOffset={8}>
                        <UserMenuContent user={auth.user} />
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
