import { Head, router } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import { Users, UserCheck, UserX, Search, Eye, Pencil, X, MapPin, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminLayout from '@/layouts/admin-layout';
import { confirm, errorAlert, successAlert } from '@/lib/notify';
import type { BreadcrumbItem } from '@/types';

type Item = {
    id: number;
    name: string;
    email: string;
    status: string;
    address: string | null;
    zone: { name: string; barangay: string | null } | null;
};

type Stats = { total: number; active: number; inactive: number };

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/admin/dashboard' },
    { title: 'Residents', href: '/admin/residents' },
];

type ModalMode = 'view' | 'edit' | null;

function ResidentModal({ item, mode, onClose }: { item: Item; mode: ModalMode; onClose: () => void }) {
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
            onSuccess: () => { onClose(); successAlert('Updated', 'Resident updated successfully.'); },
            onError: (errs) => { errorAlert('Failed to update', Object.values(errs).join('\n')); },
            preserveScroll: true,
        });
    };

    const handleDelete = async () => {
        const yes = await confirm('Delete resident?', `This will permanently delete "${item.name}". This action cannot be undone.`, 'Yes, delete');
        if (!yes) return;
        router.delete(`/admin/residents/${item.id}`, {
            onSuccess: () => { onClose(); successAlert('Deleted', 'Resident has been removed.'); },
            onError: () => { errorAlert('Failed', 'Could not delete this resident.'); },
            preserveScroll: true,
        });
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
            onClick={onClose}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.2 }}
                className="w-full max-w-lg overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl dark:border-white/5 dark:bg-[#111]"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between border-b border-gray-50 px-6 py-4 dark:border-white/5">
                    <h2 className="text-lg font-bold tracking-tight">
                        {mode === 'view' ? 'Resident Details' : 'Edit Resident'}
                    </h2>
                    <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/5">
                        <X size={18} />
                    </button>
                </div>

                <div className="space-y-4 p-6">
                    {mode === 'view' ? (
                        <>
                            <div className="flex items-center gap-4">
                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 dark:bg-violet-900/20">
                                    <Users size={24} className="text-violet-600 dark:text-violet-400" />
                                </div>
                                <div>
                                    <p className="text-xl font-bold">{item.name}</p>
                                    <p className="text-sm text-gray-400">{item.email}</p>
                                </div>
                            </div>
                            <div className="space-y-3 rounded-xl bg-gray-50 p-4 dark:bg-white/[0.03]">
                                <div>
                                    <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400">Status</p>
                                    <span className={`mt-1 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${item.status === 'active' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' : 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'}`}>
                                        <span className={`h-1.5 w-1.5 rounded-full ${item.status === 'active' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                        {item.status}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400">Zone</p>
                                    <p className="mt-0.5 text-sm font-medium">
                                        {item.zone ? `${item.zone.name} (${item.zone.barangay ?? '—'})` : '—'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400">Address</p>
                                    <p className="mt-0.5 text-sm font-medium">{item.address ?? '—'}</p>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm outline-none transition-all focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-500/10 dark:border-white/10 dark:bg-white/5 dark:focus:border-violet-600" />
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm outline-none transition-all focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-500/10 dark:border-white/10 dark:bg-white/5 dark:focus:border-violet-600" />
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm outline-none transition-all focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-500/10 dark:border-white/10 dark:bg-white/5 dark:focus:border-violet-600">
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">New Password <span className="text-gray-400">(leave blank to keep)</span></label>
                                <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm outline-none transition-all focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-500/10 dark:border-white/10 dark:bg-white/5 dark:focus:border-violet-600" />
                            </div>
                        </>
                    )}
                </div>

                <div className="flex items-center justify-between border-t border-gray-50 px-6 py-4 dark:border-white/5">
                    {mode === 'edit' ? (
                        <button onClick={handleDelete} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/10">
                            Delete
                        </button>
                    ) : <div />}
                    <div className="flex gap-2">
                        <button onClick={onClose} className="rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10">
                            Close
                        </button>
                        {mode === 'edit' && (
                            <button onClick={handleSave} disabled={saving} className="rounded-xl bg-gradient-to-r from-[#1b4332] to-[#2d6a4f] px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:-translate-y-0.5 disabled:opacity-50">
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
            onSuccess: () => { onClose(); successAlert('Added', 'New resident has been created.'); },
            onError: (errs) => { errorAlert('Failed to add', Object.values(errs).join('\n')); },
            preserveScroll: true,
        });
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
            onClick={onClose}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.2 }}
                className="w-full max-w-lg overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl dark:border-white/5 dark:bg-[#111]"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between border-b border-gray-50 px-6 py-4 dark:border-white/5">
                    <h2 className="text-lg font-bold tracking-tight">Add Resident</h2>
                    <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/5">
                        <X size={18} />
                    </button>
                </div>
                <div className="space-y-4 p-6">
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
                        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="John Doe" className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm outline-none transition-all focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-500/10 dark:border-white/10 dark:bg-white/5 dark:focus:border-violet-600" />
                    </div>
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                        <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="resident@example.com" className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm outline-none transition-all focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-500/10 dark:border-white/10 dark:bg-white/5 dark:focus:border-violet-600" />
                    </div>
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                        <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Min. 8 characters" className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm outline-none transition-all focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-500/10 dark:border-white/10 dark:bg-white/5 dark:focus:border-violet-600" />
                    </div>
                </div>
                <div className="flex items-center justify-end gap-2 border-t border-gray-50 px-6 py-4 dark:border-white/5">
                    <button onClick={onClose} className="rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200 dark:bg-white/5 dark:text-gray-300">
                        Cancel
                    </button>
                    <button onClick={handleSave} disabled={saving} className="rounded-xl bg-gradient-to-r from-[#1b4332] to-[#2d6a4f] px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:-translate-y-0.5 disabled:opacity-50">
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
    const [modal, setModal] = useState<{ item: Item; mode: ModalMode } | null>(null);
    const [showAdd, setShowAdd] = useState(false);

    const filtered = useMemo(() => {
        return items.filter((r) => {
            const matchesSearch = !search || r.name.toLowerCase().includes(search.toLowerCase()) || r.email.toLowerCase().includes(search.toLowerCase()) || (r.address?.toLowerCase().includes(search.toLowerCase()) ?? false);
            const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [items, search, statusFilter]);

    const statCards = [
        { label: 'Total Residents', value: stats.total, icon: Users, bg: 'bg-violet-50 dark:bg-violet-900/20', text: 'text-violet-600 dark:text-violet-400' },
        { label: 'Active', value: stats.active, icon: UserCheck, bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600 dark:text-emerald-400' },
        { label: 'Inactive', value: stats.inactive, icon: UserX, bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-600 dark:text-amber-400' },
    ];

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Residents" />
            <div className="space-y-5 p-5">
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Residents</h1>
                        <p className="mt-0.5 text-sm text-gray-400">Manage registered households and residents</p>
                    </div>
                    <button onClick={() => setShowAdd(true)} className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#1b4332] to-[#2d6a4f] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/15 transition-all hover:-translate-y-0.5 hover:shadow-xl">
                        <Plus size={16} />
                        Add Resident
                    </button>
                </motion.div>

                <div className="grid grid-cols-3 gap-3 sm:gap-4">
                    {statCards.map(({ label, value, icon: Icon, bg, text }, i) => (
                        <motion.div key={label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.06 }} className="premium-card group flex items-center gap-3 border border-gray-100 bg-white p-4 sm:gap-4 sm:p-5 dark:border-white/5 dark:bg-white/[0.02]">
                            <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl sm:h-12 sm:w-12 sm:rounded-2xl ${bg}`}>
                                <Icon size={20} className={text} />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-gray-400 sm:text-sm">{label}</p>
                                <p className="text-xl font-bold tracking-tight sm:text-2xl">{value}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }} className="premium-card overflow-hidden border border-gray-100 bg-white dark:border-white/5 dark:bg-white/[0.02]">
                    <div className="flex flex-col gap-3 border-b border-gray-50 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between dark:border-white/5">
                        <div className="flex items-center gap-2">
                            <Users size={16} className="text-violet-600 dark:text-violet-400" />
                            <h2 className="text-sm font-semibold tracking-tight">All Residents</h2>
                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-500 dark:bg-white/5">{filtered.length}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            {['all', 'active', 'inactive'].map((f) => (
                                <button key={f} onClick={() => setStatusFilter(f)} className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${statusFilter === f ? 'bg-violet-50 text-violet-600 dark:bg-violet-900/20 dark:text-violet-400' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600 dark:hover:bg-white/5'}`}>
                                    {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
                                </button>
                            ))}
                            <div className="relative ml-1">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 dark:text-gray-600" />
                                <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-40 rounded-lg border border-gray-200 bg-gray-50/50 py-2 pl-8 pr-3 text-xs outline-none transition-all placeholder:text-gray-400 focus:border-violet-400 focus:bg-white focus:ring-2 focus:ring-violet-500/10 sm:w-48 dark:border-white/10 dark:bg-white/5 dark:focus:border-violet-600" />
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-50 text-left dark:border-white/5">
                                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Resident</th>
                                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Email</th>
                                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Zone</th>
                                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Address</th>
                                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Status</th>
                                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.length === 0 && (
                                    <tr><td colSpan={6} className="px-5 py-12 text-center">
                                        <Users size={32} className="mx-auto text-gray-200 dark:text-gray-700" />
                                        <p className="mt-3 text-sm text-gray-400">No residents found.</p>
                                    </td></tr>
                                )}
                                {filtered.map((r) => (
                                    <tr key={r.id} className="border-t border-gray-50 transition-colors hover:bg-gray-50/50 dark:border-white/[0.03] dark:hover:bg-white/[0.02]">
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-sm font-bold text-violet-600 dark:bg-violet-900/20 dark:text-violet-400">{r.name.charAt(0)}</div>
                                                <span className="font-semibold">{r.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5 text-gray-500">{r.email}</td>
                                        <td className="px-5 py-3.5">
                                            {r.zone ? (
                                                <div className="flex items-center gap-1.5">
                                                    <MapPin size={12} className="text-gray-300" />
                                                    <span className="text-xs">{r.zone.name}</span>
                                                    {r.zone.barangay && <span className="text-xs text-gray-400">({r.zone.barangay})</span>}
                                                </div>
                                            ) : <span className="text-xs text-gray-300">—</span>}
                                        </td>
                                        <td className="max-w-[200px] truncate px-5 py-3.5 text-xs text-gray-500">{r.address ?? '—'}</td>
                                        <td className="px-5 py-3.5">
                                            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${r.status === 'active' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' : 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'}`}>
                                                <span className={`h-1.5 w-1.5 rounded-full ${r.status === 'active' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                                {r.status}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-1">
                                                <button onClick={() => setModal({ item: r, mode: 'view' })} className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/5" title="View"><Eye size={15} /></button>
                                                <button onClick={() => setModal({ item: r, mode: 'edit' })} className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/10" title="Edit"><Pencil size={15} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
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
