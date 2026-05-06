import { Head, router } from '@inertiajs/react';
import { useState, useMemo, useEffect } from 'react';
import { Truck, Plus, Search, Eye, Pencil, X, ChevronLeft, ChevronRight, Filter, Wrench, CheckCircle2, XCircle, User, Route } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminLayout from '@/layouts/admin-layout';
import { confirm, errorAlert, toast } from '@/lib/notify';
import type { BreadcrumbItem } from '@/types';

type Collector = { id: number; name: string };
type Item = {
    id: number;
    plate_no: string;
    capacity_kg: number;
    status: string;
    collector: Collector | null;
    routes_count: number;
};
type Stats = { total: number; available: number; maintenance: number; inactive: number };

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/admin/dashboard' },
    { title: 'Trucks', href: '/admin/trucks' },
];

const fade = (delay = 0) => ({
    initial: { opacity: 0, y: 12 } as const,
    animate: { opacity: 1, y: 0 } as const,
    transition: { duration: 0.3, delay },
});

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
    available: { label: 'Available', bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500' },
    maintenance: { label: 'Maintenance', bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-400', dot: 'bg-amber-500' },
    inactive: { label: 'Inactive', bg: 'bg-neutral-100 dark:bg-neutral-800/30', text: 'text-neutral-500 dark:text-neutral-400', dot: 'bg-neutral-400' },
};

function TruckModal({ item, mode, collectors, onClose }: { item?: Item; mode: 'add' | 'edit' | 'view'; collectors: Collector[]; onClose: () => void }) {
    const [form, setForm] = useState({
        plate_no: item?.plate_no ?? '',
        capacity_kg: item?.capacity_kg ?? 2000,
        status: item?.status ?? 'available',
        collector_user_id: item?.collector?.id?.toString() ?? '',
    });
    const [saving, setSaving] = useState(false);

    const handleSave = () => {
        setSaving(true);
        const payload = { ...form, collector_user_id: form.collector_user_id || null };
        if (mode === 'add') {
            router.post('/admin/trucks', payload, {
                onFinish: () => setSaving(false),
                onSuccess: () => { onClose(); toast('success', 'Truck added successfully'); },
                onError: (errs) => errorAlert('Failed', Object.values(errs).join('\n')),
            });
        } else if (item) {
            router.put(`/admin/trucks/${item.id}`, payload, {
                onFinish: () => setSaving(false),
                onSuccess: () => { onClose(); toast('success', 'Truck updated successfully'); },
                onError: (errs) => errorAlert('Failed', Object.values(errs).join('\n')),
            });
        }
    };

    const handleDelete = async () => {
        if (!item) return;
        const yes = await confirm('Delete truck?', `This will permanently delete "${item.plate_no}". Routes using this truck must be removed first.`, 'Yes, delete');
        if (!yes) return;
        router.delete(`/admin/trucks/${item.id}`, {
            onSuccess: () => { onClose(); toast('success', 'Truck deleted successfully'); },
            onError: (errs) => errorAlert('Failed', Object.values(errs).flat().join('\n')),
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
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 shadow-sm shadow-teal-500/20">
                            {mode === 'view' ? <Eye size={14} className="text-white" /> : mode === 'add' ? <Plus size={14} className="text-white" /> : <Pencil size={14} className="text-white" />}
                        </div>
                        <h2 className="text-sm font-bold text-neutral-900 dark:text-white">
                            {mode === 'view' ? 'Truck Details' : mode === 'add' ? 'Add Truck' : 'Edit Truck'}
                        </h2>
                    </div>
                    <button onClick={onClose} className="rounded-full p-1.5 text-neutral-400 transition-all hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800">
                        <X size={16} />
                    </button>
                </div>

                <div className="space-y-4 p-6">
                    {mode === 'view' && item ? (
                        <>
                            <div className="flex items-center gap-4">
                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-100 to-emerald-100 dark:from-teal-900/40 dark:to-emerald-900/40">
                                    <Truck size={24} className="text-teal-600 dark:text-teal-400" />
                                </div>
                                <div>
                                    <p className="text-lg font-bold text-neutral-900 dark:text-white">{item.plate_no}</p>
                                    <p className="text-sm text-neutral-400">{item.capacity_kg} kg capacity</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3 rounded-xl bg-neutral-50 p-4 dark:bg-neutral-800/50">
                                <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">Status</p>
                                    <span className={`mt-1 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_CONFIG[item.status]?.bg} ${STATUS_CONFIG[item.status]?.text}`}>
                                        <span className={`h-1.5 w-1.5 rounded-full ${STATUS_CONFIG[item.status]?.dot}`} />
                                        {STATUS_CONFIG[item.status]?.label}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">Routes</p>
                                    <p className="mt-1 text-lg font-bold text-neutral-900 dark:text-white">{item.routes_count}</p>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">Assigned Collector</p>
                                    <p className="mt-1 text-sm font-medium text-neutral-700 dark:text-neutral-300">{item.collector?.name ?? 'Unassigned'}</p>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-neutral-600 dark:text-neutral-400">Plate Number</label>
                                <input value={form.plate_no} onChange={(e) => setForm({ ...form, plate_no: e.target.value })} placeholder="e.g. SWR-001"
                                    className="w-full rounded-xl border border-neutral-200 bg-neutral-50/50 px-3.5 py-2.5 text-sm outline-none transition-all placeholder:text-neutral-400 focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-500/10 dark:border-neutral-700 dark:bg-neutral-800/50 dark:text-neutral-100 dark:focus:border-teal-600" />
                            </div>
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-neutral-600 dark:text-neutral-400">Capacity (kg)</label>
                                <input type="number" value={form.capacity_kg} onChange={(e) => setForm({ ...form, capacity_kg: parseInt(e.target.value) || 0 })} placeholder="2000"
                                    className="w-full rounded-xl border border-neutral-200 bg-neutral-50/50 px-3.5 py-2.5 text-sm outline-none transition-all placeholder:text-neutral-400 focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-500/10 dark:border-neutral-700 dark:bg-neutral-800/50 dark:text-neutral-100 dark:focus:border-teal-600" />
                            </div>
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-neutral-600 dark:text-neutral-400">Status</label>
                                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
                                    className="w-full rounded-xl border border-neutral-200 bg-neutral-50/50 px-3.5 py-2.5 text-sm outline-none transition-all focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-500/10 dark:border-neutral-700 dark:bg-neutral-800/50 dark:text-neutral-100 dark:focus:border-teal-600">
                                    <option value="available">Available</option>
                                    <option value="maintenance">Maintenance</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-neutral-600 dark:text-neutral-400">Assign to Collector</label>
                                <select value={form.collector_user_id} onChange={(e) => setForm({ ...form, collector_user_id: e.target.value })}
                                    className="w-full rounded-xl border border-neutral-200 bg-neutral-50/50 px-3.5 py-2.5 text-sm outline-none transition-all focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-500/10 dark:border-neutral-700 dark:bg-neutral-800/50 dark:text-neutral-100 dark:focus:border-teal-600">
                                    <option value="">Unassigned</option>
                                    {collectors.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                                </select>
                            </div>
                        </>
                    )}
                </div>

                <div className="flex items-center justify-between border-t border-neutral-100 px-6 py-4 dark:border-neutral-800">
                    {mode === 'edit' ? (
                        <button onClick={handleDelete} className="rounded-lg px-3 py-2 text-xs font-semibold text-red-600 transition-all hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20">Delete</button>
                    ) : <div />}
                    <div className="flex gap-2">
                        <button onClick={onClose} className="rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-600 transition-all hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                            Close
                        </button>
                        {mode !== 'view' && (
                            <button onClick={handleSave} disabled={saving}
                                className="rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-teal-600/20 transition-all hover:shadow-md disabled:opacity-50">
                                {saving ? 'Saving...' : mode === 'add' ? 'Add Truck' : 'Save Changes'}
                            </button>
                        )}
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}

export default function TrucksIndex({ items, collectors, stats }: { items: Item[]; collectors: Collector[]; stats: Stats }) {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [modal, setModal] = useState<{ item?: Item; mode: 'add' | 'edit' | 'view' } | null>(null);
    const [page, setPage] = useState(1);
    const perPage = 10;

    const filtered = useMemo(() => {
        return items.filter((t) => {
            const matchesSearch = !search || t.plate_no.toLowerCase().includes(search.toLowerCase()) || (t.collector?.name.toLowerCase().includes(search.toLowerCase()) ?? false);
            const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [items, search, statusFilter]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
    const currentPage = Math.min(page, totalPages);
    const paginated = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

    useEffect(() => { setPage(1); }, [search, statusFilter]);

    const statCards = [
        { label: 'Total Trucks', value: stats.total, icon: Truck, bg: 'bg-teal-50 dark:bg-teal-950/40', text: 'text-teal-600 dark:text-teal-400', ring: 'ring-teal-500/20' },
        { label: 'Available', value: stats.available, icon: CheckCircle2, bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-600 dark:text-emerald-400', ring: 'ring-emerald-500/20' },
        { label: 'Maintenance', value: stats.maintenance, icon: Wrench, bg: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-600 dark:text-amber-400', ring: 'ring-amber-500/20' },
        { label: 'Inactive', value: stats.inactive, icon: XCircle, bg: 'bg-neutral-50 dark:bg-neutral-950/40', text: 'text-neutral-600 dark:text-neutral-400', ring: 'ring-neutral-500/20' },
    ];

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Trucks" />
            <div className="space-y-4 p-4 sm:p-5">
                {/* Header */}
                <motion.div {...fade()} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">Trucks</h1>
                        <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">Manage fleet and assign to collectors</p>
                    </div>
                    <button onClick={() => setModal({ mode: 'add' })}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm shadow-teal-600/20 transition-all hover:shadow-md hover:shadow-teal-600/25">
                        <Plus size={14} />
                        Add Truck
                    </button>
                </motion.div>

                {/* Stat Cards */}
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
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
                        <div className="flex flex-col gap-3 border-b border-neutral-100 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between dark:border-neutral-800">
                            <div className="flex items-center gap-2.5">
                                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 shadow-sm shadow-teal-500/20">
                                    <Truck size={14} className="text-white" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-bold text-neutral-900 dark:text-white">All Trucks</h2>
                                    <p className="text-[11px] text-neutral-400">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <Filter size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                                        className="appearance-none rounded-xl border border-neutral-200 bg-neutral-50/50 py-2 pl-8 pr-8 text-xs outline-none transition-all focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-500/10 dark:border-neutral-700 dark:bg-neutral-800/50 dark:text-neutral-300 dark:focus:border-teal-600">
                                        <option value="all">All Status</option>
                                        <option value="available">Available</option>
                                        <option value="maintenance">Maintenance</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </div>
                                <div className="relative">
                                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                                    <input type="text" placeholder="Search trucks..." value={search} onChange={(e) => setSearch(e.target.value)}
                                        className="w-full rounded-xl border border-neutral-200 bg-neutral-50/50 py-2 pl-8 pr-3 text-xs outline-none transition-all placeholder:text-neutral-400 focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-500/10 sm:w-52 dark:border-neutral-700 dark:bg-neutral-800/50 dark:text-neutral-300 dark:focus:border-teal-600" />
                                </div>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-neutral-50 text-left dark:border-neutral-800">
                                        <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">Truck</th>
                                        <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">Collector</th>
                                        <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">Capacity</th>
                                        <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">Routes</th>
                                        <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">Status</th>
                                        <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginated.length === 0 ? (
                                        <tr><td colSpan={6} className="px-5 py-16 text-center">
                                            <Truck size={28} className="mx-auto text-neutral-200 dark:text-neutral-700" />
                                            <p className="mt-2 text-sm text-neutral-400">No trucks found.</p>
                                        </td></tr>
                                    ) : paginated.map((t) => {
                                        const cfg = STATUS_CONFIG[t.status] ?? STATUS_CONFIG.available;
                                        return (
                                            <tr key={t.id} className="border-t border-neutral-50 transition-colors hover:bg-neutral-50/50 dark:border-neutral-800/50 dark:hover:bg-neutral-800/30">
                                                <td className="px-5 py-3.5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-100 to-emerald-100 dark:from-teal-900/40 dark:to-emerald-900/40">
                                                            <Truck size={16} className="text-teal-600 dark:text-teal-400" />
                                                        </div>
                                                        <span className="text-sm font-bold text-neutral-900 dark:text-white">{t.plate_no}</span>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    {t.collector ? (
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-100 to-purple-100 text-[10px] font-bold text-violet-600 dark:from-violet-900/40 dark:to-purple-900/40 dark:text-violet-400">
                                                                {t.collector.name.charAt(0)}
                                                            </div>
                                                            <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">{t.collector.name}</span>
                                                        </div>
                                                    ) : <span className="text-xs italic text-neutral-400">Unassigned</span>}
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">{t.capacity_kg.toLocaleString()} kg</span>
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                                                        <Route size={10} />{t.routes_count}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${cfg.bg} ${cfg.text}`}>
                                                        <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                                                        {cfg.label}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <div className="flex items-center gap-1">
                                                        <button onClick={() => setModal({ item: t, mode: 'view' })}
                                                            className="rounded-lg p-1.5 text-neutral-400 transition-all hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800" title="View">
                                                            <Eye size={14} />
                                                        </button>
                                                        <button onClick={() => setModal({ item: t, mode: 'edit' })}
                                                            className="rounded-lg p-1.5 text-neutral-400 transition-all hover:bg-teal-50 hover:text-teal-600 dark:hover:bg-teal-900/20" title="Edit">
                                                            <Pencil size={14} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
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
                                                            ? 'bg-teal-600 text-white shadow-sm shadow-teal-600/25'
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
                {modal && <TruckModal item={modal.item} mode={modal.mode} collectors={collectors} onClose={() => setModal(null)} />}
            </AnimatePresence>
        </AdminLayout>
    );
}
