import { Head, router, usePage } from '@inertiajs/react';
import { Megaphone, Send, Users, Calendar, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import AdminLayout from '@/layouts/admin-layout';
import { confirm, successAlert, errorAlert } from '@/lib/notify';
import type { BreadcrumbItem } from '@/types';

type Zone = { id: number; name: string };
type Announcement = { title: string; message: string; recipient_count: number; created_at: string; date: string };

type Props = {
    announcements: Announcement[];
    zones: Zone[];
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/admin/dashboard' },
    { title: 'Announcements', href: '/admin/announcements' },
];

const inputCls = 'w-full rounded-xl border border-neutral-200 bg-neutral-50/50 px-3.5 py-2.5 text-sm text-neutral-900 outline-none transition-all focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 dark:border-neutral-700 dark:bg-neutral-800/50 dark:text-white dark:focus:border-emerald-600';

export default function Announcements({ announcements, zones }: Props) {
    const { errors } = usePage().props as unknown as { errors: Record<string, string> };
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [selectedZones, setSelectedZones] = useState<number[]>([]);
    const [allZones, setAllZones] = useState(true);
    const [processing, setProcessing] = useState(false);

    const toggleZone = (id: number) => {
        setSelectedZones((prev) => prev.includes(id) ? prev.filter((z) => z !== id) : [...prev, id]);
    };

    const handleSubmit = async () => {
        if (!title.trim() || !message.trim()) return;
        const targetLabel = allZones ? 'all residents' : `${selectedZones.length} zone(s)`;
        const yes = await confirm('Send announcement?', `This will notify ${targetLabel}. Continue?`, 'Send');
        if (!yes) return;

        setProcessing(true);
        router.post('/admin/announcements', {
            title: title.trim(),
            message: message.trim(),
            zone_ids: allZones ? [] : selectedZones,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setTitle('');
                setMessage('');
                setSelectedZones([]);
                successAlert('Announcement sent', 'Residents have been notified.');
            },
            onError: (errs) => {
                const msg = Object.values(errs).join('\n');
                errorAlert('Failed to send', msg || 'Please check the form.');
            },
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Announcements" />
            <div className="space-y-5 p-4 sm:p-5">

                <div>
                    <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">Announcements</h1>
                    <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">Broadcast messages to residents</p>
                </div>

                <div className="grid gap-5 lg:grid-cols-2">
                    {/* Create form */}
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className="overflow-hidden rounded-2xl border border-neutral-200/60 bg-white shadow-sm dark:border-neutral-700/60 dark:bg-neutral-900"
                    >
                        <div className="flex items-center gap-3 border-b border-neutral-100 px-5 py-4 dark:border-neutral-800">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/50">
                                <Megaphone size={16} className="text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-neutral-900 dark:text-white">New Announcement</h3>
                                <p className="text-[11px] text-neutral-400">Send a message to residents</p>
                            </div>
                        </div>
                        <div className="space-y-4 p-5">
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-neutral-600 dark:text-neutral-400">Title</label>
                                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Schedule Change Notice" className={inputCls} />
                                {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title}</p>}
                            </div>
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-neutral-600 dark:text-neutral-400">Message</label>
                                <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} placeholder="Write your announcement..." className={`${inputCls} resize-none`} />
                                {errors.message && <p className="mt-1 text-xs text-red-500">{errors.message}</p>}
                            </div>

                            {/* Target zones */}
                            <div>
                                <label className="mb-2 block text-xs font-semibold text-neutral-600 dark:text-neutral-400">Target</label>
                                <label className="mb-3 flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                    <input type="checkbox" checked={allZones} onChange={(e) => setAllZones(e.target.checked)}
                                        className="h-4 w-4 rounded border-neutral-300 text-emerald-600 focus:ring-emerald-500" />
                                    All residents
                                </label>
                                {!allZones && (
                                    <div className="flex flex-wrap gap-2">
                                        {zones.map((z) => (
                                            <button key={z.id} onClick={() => toggleZone(z.id)}
                                                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                                                    selectedZones.includes(z.id)
                                                        ? 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-400 dark:ring-emerald-700'
                                                        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400'
                                                }`}
                                            >
                                                {z.name}
                                            </button>
                                        ))}
                                    </div>
                                )}
                                {errors.zone_ids && <p className="mt-1 text-xs text-red-500">{errors.zone_ids}</p>}
                            </div>

                            <button onClick={handleSubmit} disabled={processing || !title.trim() || !message.trim()}
                                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition-all active:scale-[0.97] disabled:opacity-50"
                            >
                                <Send size={16} />
                                {processing ? 'Sending...' : 'Send Announcement'}
                            </button>
                        </div>
                    </motion.div>

                    {/* Past announcements */}
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                        className="overflow-hidden rounded-2xl border border-neutral-200/60 bg-white shadow-sm dark:border-neutral-700/60 dark:bg-neutral-900"
                    >
                        <div className="flex items-center gap-3 border-b border-neutral-100 px-5 py-4 dark:border-neutral-800">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800">
                                <Calendar size={16} className="text-neutral-500 dark:text-neutral-400" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-neutral-900 dark:text-white">Sent Announcements</h3>
                                <p className="text-[11px] text-neutral-400">{announcements.length} total</p>
                            </div>
                        </div>
                        <div className="max-h-[500px] overflow-y-auto">
                            {announcements.length === 0 ? (
                                <div className="px-5 py-10 text-center">
                                    <Megaphone size={28} className="mx-auto text-neutral-300 dark:text-neutral-600" />
                                    <p className="mt-3 text-sm text-neutral-400">No announcements sent yet</p>
                                </div>
                            ) : (
                                announcements.map((a, i) => (
                                    <div key={i} className="border-b border-neutral-50 px-5 py-4 last:border-0 dark:border-neutral-800/50">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-semibold text-neutral-900 dark:text-white">{a.title}</p>
                                                <p className="mt-1 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">{a.message}</p>
                                            </div>
                                        </div>
                                        <div className="mt-2 flex items-center gap-3 text-[11px] text-neutral-400">
                                            <span className="flex items-center gap-1"><Users size={11} /> {a.recipient_count} recipients</span>
                                            <span className="flex items-center gap-1"><Calendar size={11} /> {a.created_at}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>
                </div>
            </div>
        </AdminLayout>
    );
}
