import { Head, router } from '@inertiajs/react';
import { useState, useMemo, useEffect } from 'react';
import { Users, UserCheck, UserX, Search, Eye, Pencil, X, Plus, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminLayout from '@/layouts/admin-layout';
import { confirm, errorAlert, successAlert, toast } from '@/lib/notify';
import type { BreadcrumbItem } from '@/types';

type Item = {
    id: number;
    name: string;
    email: string;
    status: string;
    address: string | null;
    zone: { name: string; barangay: string | null } | null;
    created_at: string;
};

type Stats = { total: number; active: number; inactive: number; today: number; this_week: number; this_month: number };

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/admin/dashboard' },
    { title: 'Residents', href: '/admin/residents' },
];

const fade = (delay = 0) => ({
    initial: { opacity: 0, y: 12 } as const,
    animate: { opacity: 1, y: 0 } as const,
    transition: { duration: 0.3, delay },
});

function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function ResidentModal({ item, mode, onClose }: { item: Item; mode: 'view' | 'edit'; onClose: () => void }) {
    const [form, setForm] = useState({ name: item.name, email: item.email, status: item.status, password: '' });
    const [saving, setSaving] = useState(false);

    const handleSave = () => {
        setSaving(true);
        router.put(`/admin/residents/${item.id}`, {
            name: form.name,
            email: form.email,
            status: form.status,
            password: form.password || null,
        }, {
            onFinish: () => setSaving(false),
            onSuccess: () => { onClose(); toast('success', 'Resident updated successfully'); },
            onError: (errs) => { errorAlert('Failed to update', Object.values(errs).join('\n')); },
            preserveScroll: true,
        });
    };

    const handleDelete = async () => {
        const yes = await confirm('Delete resident?', `This will permanently delete "${item.name}". This action cannot be undone.`, 'Yes, delete');
        if (!yes) return;
        router.delete(`/admin/residents/${item.id}`, {
            onSuccess: () => { onClose(); toast('success', 'Resident deleted successfully'); },
            onError: () => { errorAlert('Failed', 'Could not delete this resident.'); },
            preserveScroll: true,
        });
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={onClose}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                className="w-full max-w-lg overflow-hidden rounded-2xl border border-neutral-200/60 bg-white shadow-2xl dark:border-neutral-700/60 dark:bg-neutral-900"
                onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4 dark:border-neutral-800">
                    <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-sm shadow-violet-500/20">
                            {mode === 'view' ? <Eye size={14} className="text-white" /> : <Pencil size={14} className="text-white" />}
                        </div>
                        <h2 className="text-sm font-bold text-neutral-900 dark:text-white">
                            {mode === 'view' ? 'Resident Details' : 'Edit Resident'}
                        </h2>
                    </div>
                    <button onClick={onClose} className="rounded-full p-1.5 text-neutral-400 transition-all hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800">
                        <X size={16} />
                    </button>
                </div>

                <div className="space-y-4 p-6">
                    {mode === 'view' ? (
                        <>
                            <div className="flex items-center gap-4">
                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-100 to-purple-100 text-xl font-bold text-violet-600 dark:from-violet-900/40 dark:to-purple-900/40 dark:text-violet-400">
                                    {item.name.charAt(0)}
                                </div>
                                <div>
                                    <p className="text-lg font-bold text-neutral-900 dark:text-white">{item.name}</p>
                                    <p className="text-sm text-neutral-400">{item.email}</p>
                                </div>
                            </div>
                            <div className="space-y-3 rounded-xl bg-neutral-50 p-4 dark:bg-neutral-800/50">
                                <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">Status</p>
                                    <span className={`mt-1 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${item.status === 'active' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}>
                                        <span className={`h-1.5 w-1.5 rounded-full ${item.status === 'active' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                        {item.status}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">Zone</p>
                                    <p className="mt-0.5 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                        {item.zone ? `${item.zone.name} (${item.zone.barangay ?? '—'})` : '—'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">Address</p>
                                    <p className="mt-0.5 text-sm font-medium text-neutral-700 dark:text-neutral-300">{item.address ?? '—'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">Registered</p>
                                    <p className="mt-0.5 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                        {new Date(item.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                    </p>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-neutral-600 dark:text-neutral-400">Name</label>
                                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    className="w-full rounded-xl border border-neutral-200 bg-neutral-50/50 px-3.5 py-2.5 text-sm outline-none transition-all placeholder:text-neutral-400 focus:border-violet-400 focus:bg-white focus:ring-2 focus:ring-violet-500/10 dark:border-neutral-700 dark:bg-neutral-800/50 dark:text-neutral-100 dark:focus:border-violet-600" />
                            </div>
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-neutral-600 dark:text-neutral-400">Email</label>
                                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    className="w-full rounded-xl border border-neutral-200 bg-neutral-50/50 px-3.5 py-2.5 text-sm outline-none transition-all placeholder:text-neutral-400 focus:border-violet-400 focus:bg-white focus:ring-2 focus:ring-violet-500/10 dark:border-neutral-700 dark:bg-neutral-800/50 dark:text-neutral-100 dark:focus:border-violet-600" />
                            </div>
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-neutral-600 dark:text-neutral-400">Status</label>
                                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
                                    className="w-full rounded-xl border border-neutral-200 bg-neutral-50/50 px-3.5 py-2.5 text-sm outline-none transition-all focus:border-violet-400 focus:bg-white focus:ring-2 focus:ring-violet-500/10 dark:border-neutral-700 dark:bg-neutral-800/50 dark:text-neutral-100 dark:focus:border-violet-600">
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-neutral-600 dark:text-neutral-400">New Password <span className="text-neutral-400">(leave blank to keep)</span></label>
                                <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••"
                                    className="w-full rounded-xl border border-neutral-200 bg-neutral-50/50 px-3.5 py-2.5 text-sm outline-none transition-all placeholder:text-neutral-400 focus:border-violet-400 focus:bg-white focus:ring-2 focus:ring-violet-500/10 dark:border-neutral-700 dark:bg-neutral-800/50 dark:text-neutral-100 dark:focus:border-violet-600" />
                            </div>
                        </>
                    )}
                </div>

                <div className="flex items-center justify-between border-t border-neutral-100 px-6 py-4 dark:border-neutral-800">
                    {mode === 'edit' ? (
                        <button onClick={handleDelete} className="rounded-lg px-3 py-2 text-xs font-semibold text-red-600 transition-all hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20">
                            Delete
                        </button>
                    ) : <div />}
                    <div className="flex gap-2">
                        <button onClick={onClose} className="rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-600 transition-all hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                            Close
                        </button>
                        {mode === 'edit' && (
                            <button onClick={handleSave} disabled={saving}
                                className="rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-violet-600/20 transition-all hover:shadow-md disabled:opacity-50">
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        )}
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}

function AddResidentModal({ onClose }: { onClose: () => void }) {
    const [form, setForm] = useState({ name: '', email: '', password: '' });
    const [saving, setSaving] = useState(false);

    const handleSave = () => {
        setSaving(true);
        router.post('/admin/residents', form, {
            onFinish: () => setSaving(false),
            onSuccess: () => { onClose(); toast('success', 'Resident added successfully'); },
            onError: (errs) => { errorAlert('Failed to add', Object.values(errs).join('\n')); },
            preserveScroll: true,
        });
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={onClose}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                className="w-full max-w-lg overflow-hidden rounded-2xl border border-neutral-200/60 bg-white shadow-2xl dark:border-neutral-700/60 dark:bg-neutral-900"
                onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4 dark:border-neutral-800">
                    <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-sm shadow-violet-500/20">
                            <Plus size={14} className="text-white" />
                        </div>
                        <h2 className="text-sm font-bold text-neutral-900 dark:text-white">Add Resident</h2>
                    </div>
                    <button onClick={onClose} className="rounded-full p-1.5 text-neutral-400 transition-all hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800">
                        <X size={16} />
                    </button>
                </div>
                <div className="space-y-4 p-6">
                    <div>
                        <label className="mb-1.5 block text-xs font-semibold text-neutral-600 dark:text-neutral-400">Full Name</label>
                        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="John Doe"
                            className="w-full rounded-xl border border-neutral-200 bg-neutral-50/50 px-3.5 py-2.5 text-sm outline-none transition-all placeholder:text-neutral-400 focus:border-violet-400 focus:bg-white focus:ring-2 focus:ring-violet-500/10 dark:border-neutral-700 dark:bg-neutral-800/50 dark:text-neutral-100 dark:focus:border-violet-600" />
                    </div>
                    <div>
                        <label className="mb-1.5 block text-xs font-semibold text-neutral-600 dark:text-neutral-400">Email</label>
                        <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="resident@example.com"
                            className="w-full rounded-xl border border-neutral-200 bg-neutral-50/50 px-3.5 py-2.5 text-sm outline-none transition-all placeholder:text-neutral-400 focus:border-violet-400 focus:bg-white focus:ring-2 focus:ring-violet-500/10 dark:border-neutral-700 dark:bg-neutral-800/50 dark:text-neutral-100 dark:focus:border-violet-600" />
                    </div>
                    <div>
                        <label className="mb-1.5 block text-xs font-semibold text-neutral-600 dark:text-neutral-400">Password</label>
                        <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Min. 8 characters"
                            className="w-full rounded-xl border border-neutral-200 bg-neutral-50/50 px-3.5 py-2.5 text-sm outline-none transition-all placeholder:text-neutral-400 focus:border-violet-400 focus:bg-white focus:ring-2 focus:ring-violet-500/10 dark:border-neutral-700 dark:bg-neutral-800/50 dark:text-neutral-100 dark:focus:border-violet-600" />
                    </div>
                </div>
                <div className="flex items-center justify-end gap-2 border-t border-neutral-100 px-6 py-4 dark:border-neutral-800">
                    <button onClick={onClose} className="rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-600 transition-all hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                        Cancel
                    </button>
                    <button onClick={handleSave} disabled={saving}
                        className="rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-violet-600/20 transition-all hover:shadow-md disabled:opacity-50">
                        {saving ? 'Adding...' : 'Add Resident'}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}

export default function ResidentsIndex({ items, stats }: { items: Item[]; stats: Stats }) {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [timeFilter, setTimeFilter] = useState<'all' | 'today' | '7days' | '30days'>('all');
    const [modal, setModal] = useState<{ item: Item; mode: 'view' | 'edit' } | null>(null);
    const [showAdd, setShowAdd] = useState(false);
    const [page, setPage] = useState(1);
    const perPage = 10;

    const filtered = useMemo(() => {
        const now = Date.now();
        return items.filter((r) => {
            const matchesSearch = !search || r.name.toLowerCase().includes(search.toLowerCase()) || r.email.toLowerCase().includes(search.toLowerCase()) || (r.address?.toLowerCase().includes(search.toLowerCase()) ?? false);
            const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
            if (!matchesSearch || !matchesStatus) return false;
            if (timeFilter === 'all') return true;
            const created = new Date(r.created_at).getTime();
            const diffMs = now - created;
            if (timeFilter === 'today') return diffMs < 86400000;
            if (timeFilter === '7days') return diffMs < 604800000;
            if (timeFilter === '30days') return diffMs < 2592000000;
            return true;
        });
    }, [items, search, statusFilter, timeFilter]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
    const currentPage = Math.min(page, totalPages);
    const paginated = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

    useEffect(() => { setPage(1); }, [search, statusFilter, timeFilter]);

    const statCards = [
        { label: 'Total Residents', value: stats.total, icon: Users, bg: 'bg-violet-50 dark:bg-violet-950/40', text: 'text-violet-600 dark:text-violet-400', ring: 'ring-violet-500/20' },
        { label: 'Active', value: stats.active, icon: UserCheck, bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-600 dark:text-emerald-400', ring: 'ring-emerald-500/20' },
        { label: 'Inactive', value: stats.inactive, icon: UserX, bg: 'bg-red-50 dark:bg-red-950/40', text: 'text-red-600 dark:text-red-400', ring: 'ring-red-500/20' },
    ];

    const timeOptions = [
        { key: 'all' as const, label: 'All Time', count: stats.total },
        { key: 'today' as const, label: 'Today', count: stats.today },
        { key: '7days' as const, label: '7 Days', count: stats.this_week },
        { key: '30days' as const, label: '30 Days', count: stats.this_month },
    ];

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Residents" />
            <div className="space-y-4 p-4 sm:p-5">
                {/* Header */}
                <motion.div {...fade()}>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">Residents</h1>
                            <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">Manage registered households and residents</p>
                        </div>
                        <div className="flex items-center gap-2">
                            {/* Time filter pills in header */}
                            <div className="flex items-center gap-1 rounded-xl border border-neutral-200 bg-neutral-50/50 p-1 dark:border-neutral-700 dark:bg-neutral-800/50">
                                {timeOptions.map(({ key, label, count }) => (
                                    <button key={key} onClick={() => setTimeFilter(key)}
                                        className={`relative rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all ${timeFilter === key
                                            ? 'bg-white text-violet-700 shadow-sm dark:bg-neutral-700 dark:text-violet-400'
                                            : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300'}`}>
                                        {label}
                                        {count > 0 && timeFilter === key && (
                                            <span className="ml-1.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-violet-100 px-1 text-[9px] font-bold text-violet-600 dark:bg-violet-900/40 dark:text-violet-400">
                                                {count}
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>
                            <button onClick={() => setShowAdd(true)}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm shadow-violet-600/20 transition-all hover:shadow-md hover:shadow-violet-600/25">
                                <Plus size={14} />
                                Add Resident
                            </button>
                        </div>
                    </div>
                </motion.div>

                {/* Stat Cards */}
                <div className="grid grid-cols-3 gap-3">
                    {statCards.map(({ label, value, icon: Icon, bg, text, ring }, i) => (
                        <motion.div key={label} {...fade(0.04 + i * 0.03)}
                            className="group rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900">
                            <div className="flex items-center justify-between">
                                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${bg} ring-4 ${ring} transition-transform group-hover:scale-110`}>
                                    <Icon size={18} className={text} />
                                </div>
                                <p className="text-2xl font-bold text-neutral-900 dark:text-white">{value}</p>
                            </div>
                            <p className="mt-3 text-[11px] font-medium text-neutral-500 dark:text-neutral-400">{label}</p>
                        </motion.div>
                    ))}
                </div>

                {/* Table */}
                <motion.div {...fade(0.2)}>
                    <div className="overflow-hidden rounded-2xl border border-neutral-200/60 bg-white shadow-lg shadow-black/[0.03] dark:border-neutral-700/60 dark:bg-neutral-900">
                        {/* Table header */}
                        <div className="flex flex-col gap-3 border-b border-neutral-100 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between dark:border-neutral-800">
                            <div className="flex items-center gap-2.5">
                                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-sm shadow-violet-500/20">
                                    <Users size={14} className="text-white" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-bold text-neutral-900 dark:text-white">All Residents</h2>
                                    <p className="text-[11px] text-neutral-400">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {/* Status filter */}
                                <div className="relative">
                                    <Filter size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                                        className="appearance-none rounded-xl border border-neutral-200 bg-neutral-50/50 py-2 pl-8 pr-8 text-xs outline-none transition-all focus:border-violet-400 focus:bg-white focus:ring-2 focus:ring-violet-500/10 dark:border-neutral-700 dark:bg-neutral-800/50 dark:text-neutral-300 dark:focus:border-violet-600">
                                        <option value="all">All Status</option>
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </div>
                                {/* Search */}
                                <div className="relative">
                                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                                    <input type="text" placeholder="Search residents..." value={search} onChange={(e) => setSearch(e.target.value)}
                                        className="w-full rounded-xl border border-neutral-200 bg-neutral-50/50 py-2 pl-8 pr-3 text-xs outline-none transition-all placeholder:text-neutral-400 focus:border-violet-400 focus:bg-white focus:ring-2 focus:ring-violet-500/10 sm:w-52 dark:border-neutral-700 dark:bg-neutral-800/50 dark:text-neutral-300 dark:focus:border-violet-600" />
                                </div>
                            </div>
                        </div>

                        {/* Table body */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-neutral-50 text-left dark:border-neutral-800">
                                        <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">Resident</th>
                                        <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">Zone</th>
                                        <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">Address</th>
                                        <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">Status</th>
                                        <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">Joined</th>
                                        <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginated.length === 0 && (
                                        <tr><td colSpan={6} className="px-5 py-16 text-center">
                                            <Users size={28} className="mx-auto text-neutral-200 dark:text-neutral-700" />
                                            <p className="mt-2 text-sm text-neutral-400">No residents found.</p>
                                        </td></tr>
                                    )}
                                    {paginated.map((r) => (
                                        <tr key={r.id} className="border-t border-neutral-50 transition-colors hover:bg-neutral-50/50 dark:border-neutral-800/50 dark:hover:bg-neutral-800/30">
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-100 to-purple-100 text-xs font-bold text-violet-600 dark:from-violet-900/40 dark:to-purple-900/40 dark:text-violet-400">
                                                        {r.name.charAt(0)}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="truncate text-sm font-semibold text-neutral-900 dark:text-white">{r.name}</p>
                                                        <p className="truncate text-[11px] text-neutral-400">{r.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                {r.zone ? (
                                                    <div>
                                                        <p className="text-xs font-medium text-neutral-700 dark:text-neutral-300">{r.zone.name}</p>
                                                        {r.zone.barangay && <p className="text-[11px] text-neutral-400">{r.zone.barangay}</p>}
                                                    </div>
                                                ) : <span className="text-xs text-neutral-300 dark:text-neutral-600">—</span>}
                                            </td>
                                            <td className="max-w-[180px] truncate px-5 py-3.5 text-xs text-neutral-500">{r.address ?? '—'}</td>
                                            <td className="px-5 py-3.5">
                                                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${r.status === 'active' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}>
                                                    <span className={`h-1.5 w-1.5 rounded-full ${r.status === 'active' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                                    {r.status}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5 text-[11px] text-neutral-400">{timeAgo(r.created_at)}</td>
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-1">
                                                    <button onClick={() => setModal({ item: r, mode: 'view' })}
                                                        className="rounded-lg p-1.5 text-neutral-400 transition-all hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800" title="View">
                                                        <Eye size={14} />
                                                    </button>
                                                    <button onClick={() => setModal({ item: r, mode: 'edit' })}
                                                        className="rounded-lg p-1.5 text-neutral-400 transition-all hover:bg-violet-50 hover:text-violet-600 dark:hover:bg-violet-900/20" title="Edit">
                                                        <Pencil size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (() => {
                            const pages: (number | '...')[] = [];
                            if (totalPages <= 7) {
                                for (let i = 1; i <= totalPages; i++) pages.push(i);
                            } else {
                                pages.push(1);
                                if (currentPage > 3) pages.push('...');
                                for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i);
                                if (currentPage < totalPages - 2) pages.push('...');
                                pages.push(totalPages);
                            }
                            return (
                                <div className="flex items-center justify-between border-t border-neutral-100 px-5 py-3.5 dark:border-neutral-800">
                                    <p className="text-xs text-neutral-400">
                                        <span className="font-medium text-neutral-600 dark:text-neutral-300">{(currentPage - 1) * perPage + 1}–{Math.min(currentPage * perPage, filtered.length)}</span>
                                        {' '}of{' '}
                                        <span className="font-medium text-neutral-600 dark:text-neutral-300">{filtered.length}</span>
                                    </p>
                                    <div className="flex items-center gap-1">
                                        <button onClick={() => setPage(currentPage - 1)} disabled={currentPage <= 1}
                                            className="flex h-8 items-center gap-1 rounded-lg border border-neutral-200 px-2.5 text-xs font-medium text-neutral-500 transition-all hover:border-neutral-300 hover:bg-neutral-50 hover:text-neutral-700 disabled:cursor-not-allowed disabled:opacity-30 dark:border-neutral-700 dark:text-neutral-400 dark:hover:border-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-300">
                                            <ChevronLeft size={14} />
                                            <span className="hidden sm:inline">Prev</span>
                                        </button>
                                        <div className="flex items-center gap-0.5 rounded-lg border border-neutral-200 bg-neutral-50/50 p-0.5 dark:border-neutral-700 dark:bg-neutral-800/50">
                                            {pages.map((p, i) =>
                                                p === '...' ? (
                                                    <span key={`dots-${i}`} className="flex h-7 w-7 items-center justify-center text-[11px] text-neutral-300 dark:text-neutral-600">...</span>
                                                ) : (
                                                    <button key={p} onClick={() => setPage(p)}
                                                        className={`flex h-7 w-7 items-center justify-center rounded-md text-[11px] font-semibold transition-all ${p === currentPage
                                                            ? 'bg-violet-600 text-white shadow-sm shadow-violet-600/25'
                                                            : 'text-neutral-500 hover:bg-white hover:text-neutral-700 hover:shadow-sm dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-neutral-200'}`}>
                                                        {p}
                                                    </button>
                                                ),
                                            )}
                                        </div>
                                        <button onClick={() => setPage(currentPage + 1)} disabled={currentPage >= totalPages}
                                            className="flex h-8 items-center gap-1 rounded-lg border border-neutral-200 px-2.5 text-xs font-medium text-neutral-500 transition-all hover:border-neutral-300 hover:bg-neutral-50 hover:text-neutral-700 disabled:cursor-not-allowed disabled:opacity-30 dark:border-neutral-700 dark:text-neutral-400 dark:hover:border-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-300">
                                            <span className="hidden sm:inline">Next</span>
                                            <ChevronRight size={14} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                </motion.div>
            </div>

            <AnimatePresence>
                {modal && <ResidentModal item={modal.item} mode={modal.mode} onClose={() => setModal(null)} />}
                {showAdd && <AddResidentModal onClose={() => setShowAdd(false)} />}
            </AnimatePresence>
        </AdminLayout>
    );
}
