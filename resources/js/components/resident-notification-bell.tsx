import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, CheckCircle2, Megaphone, Package, X } from 'lucide-react';

type Notification = {
    id: number;
    title: string;
    message: string;
    type: string;
    is_read: boolean;
    created_at: string;
};

const typeIcon: Record<string, { icon: typeof Bell; color: string }> = {
    collection_confirmation: { icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400' },
    announcement: { icon: Megaphone, color: 'text-blue-600 dark:text-blue-400' },
    schedule_update: { icon: Package, color: 'text-amber-600 dark:text-amber-400' },
};

export function ResidentNotificationBell() {
    const [open, setOpen] = useState(false);
    const [count, setCount] = useState(0);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loaded, setLoaded] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);

    // Poll unread count
    useEffect(() => {
        const fetchCount = async () => {
            try {
                const res = await fetch('/resident/notifications/unread-count', { headers: { Accept: 'application/json' }, credentials: 'include' });
                if (res.ok) { const data = await res.json(); setCount(data.count ?? 0); }
            } catch { /* ignore */ }
        };
        fetchCount();
        const id = setInterval(fetchCount, 30000);
        return () => clearInterval(id);
    }, []);

    // Fetch full list when opened
    const fetchList = async () => {
        try {
            const res = await fetch('/resident/notifications', { headers: { Accept: 'application/json' }, credentials: 'include' });
            if (res.ok) { const data = await res.json(); setNotifications(data.notifications ?? []); setLoaded(true); }
        } catch { /* ignore */ }
    };

    const handleOpen = () => {
        setOpen(true);
        fetchList();
    };

    const handleClose = () => {
        setOpen(false);
        // Mark all as read
        if (count > 0) {
            fetch('/resident/notifications/read-all', { method: 'POST', headers: { Accept: 'application/json', 'X-CSRF-TOKEN': document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '' }, credentials: 'include' });
            setCount(0);
            setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
        }
    };

    // Close on outside click
    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) handleClose();
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open, count]);

    return (
        <div className="relative" ref={panelRef}>
            <button
                onClick={open ? handleClose : handleOpen}
                className="relative flex h-10 w-10 items-center justify-center rounded-xl text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
            >
                <Bell size={20} strokeWidth={1.8} />
                {count > 0 && (
                    <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-neutral-950"
                    >
                        {count > 9 ? '9+' : count}
                    </motion.span>
                )}
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-12 z-50 w-80 overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-xl shadow-black/10 dark:border-neutral-700 dark:bg-neutral-900 dark:shadow-black/40"
                    >
                        <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3 dark:border-neutral-800">
                            <h3 className="text-sm font-bold text-neutral-900 dark:text-white">Notifications</h3>
                            <button onClick={handleClose} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300">
                                <X size={16} />
                            </button>
                        </div>

                        <div className="max-h-80 overflow-y-auto">
                            {!loaded ? (
                                <div className="flex items-center justify-center py-8">
                                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-500/30 border-t-emerald-500" />
                                </div>
                            ) : notifications.length === 0 ? (
                                <div className="px-4 py-8 text-center">
                                    <Bell size={24} className="mx-auto text-neutral-300 dark:text-neutral-600" />
                                    <p className="mt-2 text-xs text-neutral-400">No notifications yet</p>
                                </div>
                            ) : (
                                notifications.map((n) => {
                                    const cfg = typeIcon[n.type] ?? { icon: Bell, color: 'text-neutral-500' };
                                    const Icon = cfg.icon;
                                    return (
                                        <div key={n.id} className={`flex gap-3 border-b border-neutral-50 px-4 py-3 last:border-0 dark:border-neutral-800/50 ${!n.is_read ? 'bg-emerald-50/50 dark:bg-emerald-950/20' : ''}`}>
                                            <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${!n.is_read ? 'bg-emerald-100 dark:bg-emerald-900/40' : 'bg-neutral-100 dark:bg-neutral-800'}`}>
                                                <Icon size={14} className={cfg.color} />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className={`text-xs font-semibold ${!n.is_read ? 'text-neutral-900 dark:text-white' : 'text-neutral-600 dark:text-neutral-400'}`}>{n.title}</p>
                                                <p className="mt-0.5 text-[11px] leading-relaxed text-neutral-500 dark:text-neutral-400">{n.message}</p>
                                                <p className="mt-1 text-[10px] text-neutral-400">{n.created_at}</p>
                                            </div>
                                            {!n.is_read && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
