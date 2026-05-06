import { Head, router, useForm } from '@inertiajs/react';
import { useEffect, useState, useCallback } from 'react';
import { Plus, X, Pencil, Trash2, Layers, Search, Users, ChevronDown, Check, CheckCircle2, XCircle, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminLayout from '@/layouts/admin-layout';
import { confirm as swalConfirm, toast, errorAlert } from '@/lib/notify';
import type { BreadcrumbItem } from '@/types';

type BarangayRef = { id: number; name: string };
type Item = { id: number; name: string; barangays: BarangayRef[]; active: boolean; households_count: number; description: string };

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/admin/dashboard' },
    { title: 'Zones', href: '/admin/zones' },
];

const inputCls = 'w-full rounded-xl border border-neutral-200 bg-neutral-50/50 px-3.5 py-2.5 text-sm outline-none transition-all placeholder:text-neutral-400 focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 dark:border-neutral-700 dark:bg-neutral-800/50 dark:text-white dark:focus:border-emerald-600';

/* ─── Multi-select ─── */
function BarangayMultiSelect({ barangays, selectedIds, onToggle }: { barangays: BarangayRef[]; selectedIds: number[]; onToggle: (id: number) => void }) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const filtered = barangays.filter((b) => b.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="relative">
            <button type="button" onClick={() => setOpen(!open)}
                className={`flex w-full items-center justify-between rounded-xl border px-3.5 py-2.5 text-left text-sm transition-all ${open ? 'border-emerald-400 ring-2 ring-emerald-500/10' : 'border-neutral-200 dark:border-neutral-700'} bg-neutral-50/50 dark:bg-neutral-800/50`}>
                <span className={selectedIds.length > 0 ? 'text-neutral-900 dark:text-white' : 'text-neutral-400'}>
                    {selectedIds.length > 0 ? `${selectedIds.length} barangay${selectedIds.length > 1 ? 's' : ''} selected` : 'Select barangays...'}
                </span>
                <ChevronDown size={14} className={`text-neutral-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {open && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => { setOpen(false); setSearch(''); }} />
                        <motion.div initial={{ opacity: 0, y: 6, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 6, scale: 0.98 }}
                            transition={{ duration: 0.15 }}
                            className="absolute bottom-full left-0 right-0 z-50 mb-1.5 overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-2xl shadow-black/10 dark:border-neutral-700 dark:bg-neutral-900 dark:shadow-black/40">
                            <div className="border-b border-neutral-100 p-2 dark:border-neutral-800">
                                <div className="relative">
                                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                                    <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..."
                                        className="w-full rounded-lg border-0 bg-neutral-50 py-2 pl-8 pr-3 text-xs outline-none dark:bg-neutral-800 dark:text-white" autoFocus />
                                </div>
                            </div>
                            <div className="max-h-52 overflow-y-auto p-1.5">
                                {filtered.map((b) => {
                                    const sel = selectedIds.includes(b.id);
                                    return (
                                        <button key={b.id} type="button" onClick={() => onToggle(b.id)}
                                            className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-medium transition-all ${sel ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' : 'text-neutral-600 hover:bg-neutral-50 dark:text-neutral-400 dark:hover:bg-neutral-800/50'}`}>
                                            <div className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-md border-2 transition-all ${sel ? 'border-emerald-500 bg-emerald-500' : 'border-neutral-300 dark:border-neutral-600'}`}>
                                                {sel && <Check size={10} className="text-white" />}
                                            </div>
                                            {b.name}
                                        </button>
                                    );
                                })}
                                {filtered.length === 0 && <p className="px-3 py-6 text-center text-xs text-neutral-400">No barangays found</p>}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {selectedIds.length > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {selectedIds.map((id) => {
                        const b = barangays.find((br) => br.id === id);
                        return (
                            <motion.span key={id} layout initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                                className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                                <MapPin size={9} /> {b?.name ?? id}
                                <button type="button" onClick={() => onToggle(id)} className="ml-0.5 rounded-full p-0.5 hover:bg-emerald-200 dark:hover:bg-emerald-800"><X size={9} /></button>
                            </motion.span>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

/* ─── Zone modal ─── */
function ZoneModal({ open, mode, zone, barangays, onClose }: {
    open: boolean; mode: 'create' | 'edit'; zone?: Item; barangays: BarangayRef[]; onClose: () => void;
}) {
    const [selectedIds, setSelectedIds] = useState<number[]>(zone?.barangays.map((b) => b.id) ?? []);
    const { data, setData, post, put, processing, errors, reset } = useForm({
        name: zone?.name ?? '',
        description: zone?.description ?? '',
        active: zone?.active ?? true,
        barangay_ids: [] as number[],
    });

    useEffect(() => {
        if (open) {
            setSelectedIds(zone?.barangays.map((b) => b.id) ?? []);
            setData({
                name: zone?.name ?? '',
                description: zone?.description ?? '',
                active: zone?.active ?? true,
                barangay_ids: zone?.barangays.map((b) => b.id) ?? [],
            });
        }
    }, [open, zone]);

    useEffect(() => { setData('barangay_ids', selectedIds); }, [selectedIds]);

    const toggle = useCallback((id: number) => {
        setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
    }, []);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (mode === 'create') {
            post('/admin/zones', { onSuccess: () => { onClose(); toast('success', 'Zone created'); }, onError: () => errorAlert('Failed', 'Please check the form.') });
        } else if (zone) {
            put(`/admin/zones/${zone.id}`, { onSuccess: () => { onClose(); toast('success', 'Zone updated'); }, onError: () => errorAlert('Failed', 'Please check the form.') });
        }
    };

    if (!open) return null;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={onClose}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                className="w-full max-w-lg overflow-visible rounded-2xl border border-neutral-200/60 bg-white shadow-2xl dark:border-neutral-700/60 dark:bg-neutral-900"
                onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4 dark:border-neutral-800">
                    <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-sm shadow-emerald-500/20">
                            <Layers size={14} className="text-white" />
                        </div>
                        <h2 className="text-sm font-bold text-neutral-900 dark:text-white">{mode === 'create' ? 'New Zone' : 'Edit Zone'}</h2>
                    </div>
                    <button onClick={onClose} className="rounded-full p-1.5 text-neutral-400 transition-all hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800">
                        <X size={16} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={submit} className="max-h-[65vh] overflow-y-auto">
                    <div className="space-y-4 p-6">
                        <div>
                            <label className="mb-1.5 block text-xs font-semibold text-neutral-600 dark:text-neutral-400">Zone Name</label>
                            <input value={data.name} onChange={(e) => setData('name', e.target.value)} className={inputCls} placeholder="e.g. Zone Bolbok" />
                            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
                        </div>

                        <div>
                            <label className="mb-1.5 block text-xs font-semibold text-neutral-600 dark:text-neutral-400">Description</label>
                            <input value={data.description} onChange={(e) => setData('description', e.target.value)} className={inputCls} placeholder="Brief description..." />
                        </div>

                        {mode === 'edit' && (
                            <label className="flex items-center gap-2.5 rounded-xl border border-neutral-200 bg-neutral-50/50 px-3.5 py-2.5 dark:border-neutral-700 dark:bg-neutral-800/50">
                                <input type="checkbox" checked={data.active} onChange={(e) => setData('active', e.target.checked)}
                                    className="h-4 w-4 rounded border-neutral-300 text-emerald-600 focus:ring-emerald-500" />
                                <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Active</span>
                            </label>
                        )}

                        <div>
                            <label className="mb-1.5 flex items-center justify-between text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                                Barangays
                                {selectedIds.length > 0 && <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">{selectedIds.length}</span>}
                            </label>
                            {errors.barangay_ids && <p className="mb-1.5 text-xs text-red-500">{errors.barangay_ids}</p>}
                            <BarangayMultiSelect barangays={barangays} selectedIds={selectedIds} onToggle={toggle} />
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-2 border-t border-neutral-100 px-6 py-4 dark:border-neutral-800">
                        <button type="button" onClick={onClose}
                            className="rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-600 transition-all hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                            Cancel
                        </button>
                        <button type="submit" disabled={processing}
                            className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-emerald-600/20 transition-all hover:shadow-md disabled:opacity-50">
                            {processing ? 'Saving...' : mode === 'create' ? 'Create Zone' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
}

/* ─── Main ─── */
export default function ZonesIndex({ items, barangays }: { items: Item[]; barangays: BarangayRef[] }) {
    const [search, setSearch] = useState('');
    const [modalMode, setModalMode] = useState<'closed' | 'create' | 'edit'>('closed');
    const [editingZone, setEditingZone] = useState<Item | undefined>();
    const [page, setPage] = useState(1);
    const perPage = 12;

    const filtered = items.filter((z) => z.name.toLowerCase().includes(search.toLowerCase()));
    const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
    const currentPage = Math.min(page, totalPages);
    const paginated = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);
    const activeCount = items.filter((z) => z.active).length;
    const totalHouseholds = items.reduce((s, z) => s + z.households_count, 0);

    useEffect(() => { setPage(1); }, [search]);

    const openCreate = () => { setEditingZone(undefined); setModalMode('create'); };
    const openEdit = (z: Item) => { setEditingZone(z); setModalMode('edit'); };
    const closeModal = () => { setModalMode('closed'); setEditingZone(undefined); };

    const deleteZone = async (zone: Item) => {
        const yes = await swalConfirm('Delete zone?', `"${zone.name}" will be permanently removed.`, 'Delete');
        if (yes) router.delete(`/admin/zones/${zone.id}`, { onSuccess: () => toast('success', 'Zone deleted'), onError: () => errorAlert('Failed', 'Something went wrong.') });
    };

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Zones" />
            <div className="space-y-5 p-4 sm:p-5">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/20">
                            <Layers size={20} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">Zones</h1>
                            <p className="text-xs text-neutral-400">{activeCount} active · {totalHouseholds} households</p>
                        </div>
                    </div>
                    <button onClick={openCreate}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-emerald-600/20 transition-all hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.97]">
                        <Plus size={14} /> New Zone
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { label: 'Total Zones', value: items.length, icon: Layers, gradient: 'from-emerald-500 to-teal-500', shadow: 'shadow-emerald-500/20' },
                        { label: 'Active', value: activeCount, icon: CheckCircle2, gradient: 'from-blue-500 to-cyan-500', shadow: 'shadow-blue-500/20' },
                        { label: 'Households', value: totalHouseholds, icon: Users, gradient: 'from-amber-500 to-orange-500', shadow: 'shadow-amber-500/20' },
                    ].map((s, i) => (
                        <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                            className="group overflow-hidden rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900">
                            <div className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${s.gradient} shadow-md ${s.shadow}`}>
                                <s.icon size={15} className="text-white" />
                            </div>
                            <p className="mt-3 text-2xl font-bold text-neutral-900 dark:text-white">{s.value}</p>
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">{s.label}</p>
                        </motion.div>
                    ))}
                </div>

                {/* Search */}
                <div className="relative">
                    <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search zones..."
                        className="w-full rounded-2xl border border-neutral-200/60 bg-white py-3 pl-11 pr-4 text-sm shadow-sm outline-none transition-all focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/10 dark:border-neutral-700/60 dark:bg-neutral-900 dark:text-white" />
                </div>

                {/* Zone grid */}
                {paginated.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-neutral-200 bg-white px-4 py-16 text-center shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                        <Layers size={32} className="mx-auto text-neutral-200 dark:text-neutral-700" />
                        <p className="mt-3 text-sm font-medium text-neutral-400">No zones found</p>
                    </div>
                ) : (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {paginated.map((z, i) => (
                            <motion.div key={z.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                                className="group overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg dark:border-neutral-800 dark:bg-neutral-900">
                                {/* Card header */}
                                <div className="flex items-start justify-between p-4 pb-2">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="truncate text-sm font-bold text-neutral-900 dark:text-white">{z.name}</h3>
                                            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${z.active ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800'}`}>
                                                {z.active ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                        {z.description && <p className="mt-0.5 truncate text-[11px] text-neutral-400">{z.description}</p>}
                                    </div>
                                    <div className="flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                                        <button onClick={() => openEdit(z)} className="rounded-lg p-1.5 text-neutral-400 transition-all hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-900/20">
                                            <Pencil size={13} />
                                        </button>
                                        <button onClick={() => deleteZone(z)} className="rounded-lg p-1.5 text-neutral-400 transition-all hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20">
                                            <Trash2 size={13} />
                                        </button>
                                    </div>
                                </div>

                                {/* Barangays */}
                                <div className="px-4 pb-2">
                                    {z.barangays.length > 0 ? (
                                        <div className="flex flex-wrap gap-1">
                                            {z.barangays.map((b) => (
                                                <span key={b.id} className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400">
                                                    {b.name}
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-[11px] italic text-neutral-300 dark:text-neutral-600">No barangays</p>
                                    )}
                                </div>

                                {/* Footer */}
                                <div className="flex items-center gap-2 border-t border-neutral-50 px-4 py-2.5 dark:border-neutral-800">
                                    <Users size={12} className="text-neutral-400" />
                                    <span className={`text-[11px] font-medium ${z.households_count > 0 ? 'text-neutral-500' : 'text-amber-500'}`}>
                                        {z.households_count > 0 ? `${z.households_count} household${z.households_count !== 1 ? 's' : ''}` : 'No households'}
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-neutral-400">Page {currentPage} of {totalPages}</span>
                        <div className="flex gap-2">
                            {currentPage > 1 && <button onClick={() => setPage(currentPage - 1)} className="rounded-xl border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-600 transition-all hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-400"><ChevronLeft size={13} className="mr-1 inline" />Prev</button>}
                            {currentPage < totalPages && <button onClick={() => setPage(currentPage + 1)} className="rounded-xl border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-600 transition-all hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-400">Next<ChevronRight size={13} className="ml-1 inline" /></button>}
                        </div>
                    </div>
                )}
            </div>

            {/* Modal */}
            <ZoneModal open={modalMode !== 'closed'} mode={modalMode === 'closed' ? 'create' : modalMode} zone={editingZone} barangays={barangays} onClose={closeModal} />
        </AdminLayout>
    );
}
