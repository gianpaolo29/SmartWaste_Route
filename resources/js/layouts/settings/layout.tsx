import { Link, usePage } from '@inertiajs/react';
import { ChevronLeft } from 'lucide-react';
import type { PropsWithChildren } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ResidentBottombar } from '@/components/resident-bottombar';
import { ResidentTopbar } from '@/components/resident-topbar';
import { useIsMobile } from '@/hooks/use-mobile';
import { useInitials } from '@/hooks/use-initials';
import type { User as UserType } from '@/types';

export default function SettingsLayout({ children, title = 'Settings' }: PropsWithChildren<{ title?: string }>) {
    const { auth } = usePage().props as { auth: { user: UserType } };
    const getInitials = useInitials();
    const isMobile = useIsMobile();

    if (typeof window === 'undefined') return null;

    const backHref = (auth.user as unknown as { role: string }).role === 'resident' ? '/resident/account' : '/dashboard';

    return (
        <div className="flex min-h-screen flex-col bg-neutral-50 dark:bg-neutral-950">
            {/* Desktop: topbar + simple page header */}
            {!isMobile && (
                <>
                    <ResidentTopbar />
                    <div className="mx-auto w-full max-w-2xl px-6 pt-8 pb-4">
                        <div className="flex items-center gap-4">
                            <Link href={backHref} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-neutral-600 transition-colors hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700">
                                <ChevronLeft size={18} />
                            </Link>
                            <div className="flex items-center gap-3">
                                <div className="rounded-full bg-gradient-to-br from-emerald-400 to-teal-400 p-[2px]">
                                    <Avatar className="h-10 w-10 border-2 border-neutral-50 dark:border-neutral-950">
                                        <AvatarImage src={auth.user.avatar ?? undefined} alt={auth.user.name} className="object-cover" />
                                        <AvatarFallback className="bg-gradient-to-br from-emerald-100 to-teal-100 text-sm font-bold text-emerald-700 dark:from-emerald-900 dark:to-teal-900 dark:text-emerald-300">
                                            {getInitials(auth.user.name)}
                                        </AvatarFallback>
                                    </Avatar>
                                </div>
                                <div>
                                    <h1 className="text-lg font-bold text-neutral-900 dark:text-white">{title}</h1>
                                    <p className="text-xs text-neutral-500 dark:text-neutral-400">{auth.user.name}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Mobile: gradient header */}
            {isMobile && (
                <div className="relative mb-11">
                    <div className="relative h-36 overflow-hidden bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 dark:from-emerald-700 dark:via-emerald-800 dark:to-teal-800">
                        <div className="absolute right-[-20px] top-[-10px] h-28 w-28 rounded-full bg-white/10" />
                        <div className="absolute right-[50px] top-[20px] h-16 w-16 rounded-full bg-white/[0.07]" />
                        <div className="absolute left-[-15px] top-[15px] h-16 w-16 rounded-full bg-white/[0.05]" />
                    </div>
                    <svg viewBox="0 0 400 24" className="absolute -bottom-[1px] left-0 z-10 w-full" preserveAspectRatio="none">
                        <path d="M 0 24 Q 100 0 200 12 Q 300 24 400 8 L 400 24 Z" className="fill-neutral-50 dark:fill-neutral-950" />
                    </svg>
                    <div className="absolute left-0 right-0 top-0 z-20 flex items-center px-4 pt-4">
                        <Link href={backHref} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-colors hover:bg-white/30">
                            <ChevronLeft size={20} />
                        </Link>
                        <h1 className="flex-1 text-center text-lg font-semibold text-white">{title}</h1>
                        <div className="w-9" />
                    </div>
                    <div className="absolute -bottom-9 left-1/2 z-30 -translate-x-1/2">
                        <div className="rounded-full bg-gradient-to-br from-emerald-400 to-teal-400 p-[2.5px] shadow-lg dark:from-emerald-500 dark:to-teal-500">
                            <Avatar className="h-14 w-14 border-[3px] border-neutral-50 dark:border-neutral-950">
                                <AvatarImage src={auth.user.avatar ?? undefined} alt={auth.user.name} className="object-cover" />
                                <AvatarFallback className="bg-gradient-to-br from-emerald-100 to-teal-100 text-base font-bold text-emerald-700 dark:from-emerald-900 dark:to-teal-900 dark:text-emerald-300">
                                    {getInitials(auth.user.name)}
                                </AvatarFallback>
                            </Avatar>
                        </div>
                    </div>
                </div>
            )}

            {/* Content */}
            <div className={`px-4 ${isMobile ? 'pb-28 pt-0' : 'mx-auto w-full max-w-2xl pb-16 pt-2 px-6'}`}>
                <div className="space-y-6 rounded-2xl bg-white p-4 shadow-sm dark:bg-neutral-900">
                    {children}
                </div>
            </div>

            {isMobile && <ResidentBottombar />}
        </div>
    );
}
