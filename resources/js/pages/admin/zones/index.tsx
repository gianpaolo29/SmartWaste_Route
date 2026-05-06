import { Head, router, useForm } from '@inertiajs/react';
import { useEffect, useState, useCallback } from 'react';
import { APIProvider, Map, useMap } from '@vis.gl/react-google-maps';
import { Plus, X, Pencil, Trash2, MapPin, Layers, Search, Users, ChevronLeft, ChevronRight, Filter, CheckCircle2, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminLayout from '@/layouts/admin-layout';
import { TuyBoundary } from '@/components/tuy-boundary';
import { confirm as swalConfirm, toast, successAlert, errorAlert } from '@/lib/notify';
import type { BreadcrumbItem } from '@/types';

type BarangayRef = { id: number; name: string };
type Item = {
    id: number;
    name: string;
    barangays: BarangayRef[];
    active: boolean;
    households_count: number;
    description: string;
};

type Boundary = {
    paths: { lat: number; lng: number }[][];
    center: { lat: number; lng: number } | null;
    radius_m?: number;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/admin/dashboard' },
    { title: 'Zones', href: '/admin/zones' },
];

const COLORS = [
    '#10b981', '#3b82f6', '#f43f5e', '#f59e0b', '#8b5cf6',
    '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#6366f1',
];

const fade = (delay = 0) => ({
    initial: { opacity: 0, y: 12 } as const,
    animate: { opacity: 1, y: 0 } as const,
    transition: { duration: 0.3, delay },
});

/* ─── Map component: renders barangay polygons with polyline borders ─── */
function BarangayPolygons({
    barangays,
    selectedIds,
    onToggle,
}: {
    barangays: BarangayRef[];
    selectedIds: number[];
    onToggle: (id: number) => void;
}) {
    const map = useMap();

    useEffect(() => {
        if (!map) return;
        const overlays: (google.maps.Polyline | google.maps.Polygon)[] = [];
        const labels: google.maps.marker.AdvancedMarkerElement[] = [];
        let cancelled = false;

        (async () => {
            const results = await Promise.all(
                barangays.map(async (b, idx) => {
                    try {
                        const res = await fetch(`/admin/barangays/${b.id}/boundary`, { headers: { Accept: 'application/json' } });
                        const data: Boundary = await res.json();
                        return { b, data, color: COLORS[idx % COLORS.length] };
                    } catch { return null; }
                }),
            );
            if (cancelled) return;

            for (const r of results) {
                if (!r || !r.data.paths?.length || !r.data.center) continue;
                const isSelected = selectedIds.includes(r.b.id);
                const path = r.data.paths[0];

                const bounds = new google.maps.LatLngBounds();
                path.forEach((p) => bounds.extend(p));

                // Polyline border
                const outline = new google.maps.Polyline({
                    path,
                    strokeColor: isSelected ? '#6366f1' : r.color,
                    strokeOpacity: isSelected ? 1 : 0.45,
                    strokeWeight: isSelected ? 3 : 1.5,
                    map,
                    zIndex: isSelected ? 11 : 2,
                });

                // Glow effect
                const glow = new google.maps.Polyline({
                    path,
                    strokeColor: isSelected ? '#6366f1' : r.color,
                    strokeOpacity: isSelected ? 0.25 : 0,
                    strokeWeight: isSelected ? 8 : 0,
                    map,
                    zIndex: isSelected ? 10 : 1,
                });

                // Fill polygon for interaction
                const fill = new google.maps.Polygon({
                    paths: path,
                    strokeOpacity: 0,
                    strokeWeight: 0,
                    fillColor: isSelected ? '#6366f1' : r.color,
                    fillOpacity: isSelected ? 0.2 : 0,
                    map,
                    clickable: true,
                    zIndex: isSelected ? 9 : 1,
                });

                fill.addListener('click', () => onToggle(r.b.id));
                fill.addListener('mouseover', () => {
                    if (!isSelected) {
                        fill.setOptions({ fillOpacity: 0.12 });
                        outline.setOptions({ strokeOpacity: 0.8, strokeWeight: 2.5 });
                        glow.setOptions({ strokeOpacity: 0.12, strokeWeight: 6 });
                    }
                    document.body.style.cursor = 'pointer';
                });
                fill.addListener('mouseout', () => {
                    if (!isSelected) {
                        fill.setOptions({ fillOpacity: 0 });
                        outline.setOptions({ strokeOpacity: 0.45, strokeWeight: 1.5 });
                        glow.setOptions({ strokeOpacity: 0, strokeWeight: 0 });
                    }
                    document.body.style.cursor = '';
                });

                overlays.push(outline, glow, fill);

                // Labels
                if (r.data.center && typeof google.maps.marker?.AdvancedMarkerElement !== 'undefined') {
                    const el = document.createElement('div');
                    const selectedStyle = `
                        font-size:11px;font-weight:700;letter-spacing:0.03em;
                        color:#fff;background:#6366f1;
                        padding:5px 12px;border-radius:20px;
                        border:2px solid rgba(255,255,255,0.3);
                        cursor:pointer;
                        box-shadow:0 4px 14px rgba(99,102,241,0.35), 0 0 0 3px rgba(99,102,241,0.15);
                        white-space:nowrap;user-select:none;
                        transition:all 0.25s cubic-bezier(0.4,0,0.2,1);
                        transform:scale(1.05);
                    `;
                    const defaultStyle = `
                        font-size:10px;font-weight:600;letter-spacing:0.02em;
                        color:#4b5563;
                        background:rgba(255,255,255,0.92);
                        backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);
                        padding:4px 10px;border-radius:20px;
                        border:1px solid rgba(0,0,0,0.06);
                        cursor:pointer;
                        box-shadow:0 2px 8px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04);
                        white-space:nowrap;user-select:none;
                        transition:all 0.25s cubic-bezier(0.4,0,0.2,1);
                        transform:scale(1);
                    `;
                    el.style.cssText = isSelected ? selectedStyle : defaultStyle;
                    el.textContent = r.b.name;
                    el.addEventListener('click', () => onToggle(r.b.id));
                    el.addEventListener('mouseenter', () => {
                        if (!isSelected) {
                            el.style.background = r.color;
                            el.style.color = '#fff';
                            el.style.borderColor = 'rgba(255,255,255,0.3)';
                            el.style.boxShadow = `0 4px 14px ${r.color}44, 0 1px 3px rgba(0,0,0,0.1)`;
                            el.style.transform = 'scale(1.08)';
                        }
                    });
                    el.addEventListener('mouseleave', () => {
                        if (!isSelected) {
                            el.style.background = 'rgba(255,255,255,0.92)';
                            el.style.color = '#4b5563';
                            el.style.borderColor = 'rgba(0,0,0,0.06)';
                            el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)';
                            el.style.transform = 'scale(1)';
                        }
                    });

                    labels.push(new google.maps.marker.AdvancedMarkerElement({ map, position: r.data.center, content: el }));
                }
            }
        })();

        return () => { cancelled = true; overlays.forEach((o) => o.setMap(null)); labels.forEach((m) => (m.map = null)); };
    }, [map, barangays, selectedIds, onToggle]);

    return null;
}

/* ─── Zone form (create / edit) ─── */
function ZoneForm({
    mode,
    zone,
    barangays,
    selectedBarangayIds,
    onToggleBarangay,
    onClose,
}: {
    mode: 'create' | 'edit';
    zone?: Item;
    barangays: BarangayRef[];
    selectedBarangayIds: number[];
    onToggleBarangay: (id: number) => void;
    onClose: () => void;
}) {
    const { data, setData, post, put, processing, errors } = useForm({
        name: zone?.name ?? '',
        description: zone?.description ?? '',
        active: zone?.active ?? true,
        barangay_ids: selectedBarangayIds,
    });

    useEffect(() => {
        setData('barangay_ids', selectedBarangayIds);
    }, [selectedBarangayIds]);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (mode === 'create') {
            post('/admin/zones', {
                onSuccess: () => { onClose(); toast('success', 'Zone created successfully'); },
                onError: () => errorAlert('Failed to create zone', 'Please check the form and try again.'),
            });
        } else if (zone) {
            put(`/admin/zones/${zone.id}`, {
                onSuccess: () => { onClose(); toast('success', 'Zone updated successfully'); },
                onError: () => errorAlert('Failed to update zone', 'Please check the form and try again.'),
            });
        }
    };

    return (
        <form onSubmit={submit} className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-sm shadow-indigo-500/20">
                        <Layers size={14} className="text-white" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-neutral-900 dark:text-white">{mode === 'create' ? 'Create Zone' : 'Edit Zone'}</h3>
                        <p className="text-[11px] text-neutral-400">Fill in details and select barangays on the map</p>
                    </div>
                </div>
                <button type="button" onClick={onClose} className="rounded-full p-1.5 text-neutral-400 transition-all hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800">
                    <X size={16} />
                </button>
            </div>

            <div>
                <label className="mb-1.5 block text-xs font-semibold text-neutral-600 dark:text-neutral-400">Zone Name</label>
                <input
                    value={data.name}
                    onChange={(e) => setData('name', e.target.value)}
                    className="w-full rounded-xl border border-neutral-200 bg-neutral-50/50 px-3.5 py-2.5 text-sm outline-none transition-all placeholder:text-neutral-400 focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/10 dark:border-neutral-700 dark:bg-neutral-800/50 dark:text-neutral-100 dark:focus:border-indigo-600"
                    placeholder="e.g. Zone A"
                />
                {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
            </div>

            <div>
                <label className="mb-1.5 block text-xs font-semibold text-neutral-600 dark:text-neutral-400">Description</label>
                <input
                    value={data.description}
                    onChange={(e) => setData('description', e.target.value)}
                    className="w-full rounded-xl border border-neutral-200 bg-neutral-50/50 px-3.5 py-2.5 text-sm outline-none transition-all placeholder:text-neutral-400 focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/10 dark:border-neutral-700 dark:bg-neutral-800/50 dark:text-neutral-100 dark:focus:border-indigo-600"
                    placeholder="Brief description..."
                />
            </div>

            {mode === 'edit' && (
                <div className="flex items-center gap-2.5 rounded-xl border border-neutral-200 bg-neutral-50/50 px-3.5 py-2.5 dark:border-neutral-700 dark:bg-neutral-800/50">
                    <input
                        type="checkbox"
                        checked={data.active}
                        onChange={(e) => setData('active', e.target.checked)}
                        className="h-4 w-4 rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Active</label>
                </div>
            )}

            {/* Selected barangays */}
            <div>
                <label className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                    Selected Barangays
                    <span className="rounded-full bg-indigo-100 px-1.5 py-0.5 text-[10px] font-bold text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">{selectedBarangayIds.length}</span>
                </label>
                {errors.barangay_ids && <p className="mb-1.5 text-xs text-red-500">{errors.barangay_ids}</p>}
                {selectedBarangayIds.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50/50 px-4 py-3 text-center dark:border-neutral-700 dark:bg-neutral-800/30">
                        <MapPin size={16} className="mx-auto mb-1 text-neutral-300 dark:text-neutral-600" />
                        <p className="text-xs text-neutral-400">Click barangays on the map to select them</p>
                    </div>
                ) : (
                    <div className="flex flex-wrap gap-1.5">
                        <AnimatePresence mode="popLayout">
                            {selectedBarangayIds.map((id) => {
                                const b = barangays.find((br) => br.id === id);
                                return (
                                    <motion.span key={id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                        className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 transition-colors hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-300 dark:hover:bg-indigo-900/50">
                                        {b?.name ?? id}
                                        <button type="button" onClick={() => onToggleBarangay(id)} className="ml-0.5 rounded-full p-0.5 transition-colors hover:bg-indigo-200 hover:text-indigo-900 dark:hover:bg-indigo-800">
                                            <X size={10} />
                                        </button>
                                    </motion.span>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            <button
                type="submit"
                disabled={processing}
                className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-indigo-600/20 transition-all hover:shadow-md hover:shadow-indigo-600/25 disabled:opacity-50"
            >
                {processing ? 'Saving...' : mode === 'create' ? 'Create Zone' : 'Save Changes'}
            </button>
        </form>
    );
}

/* ─── Main page ─── */
export default function ZonesIndex({
    items,
    barangays,
    mapsApiKey,
}: {
    items: Item[];
    barangays: BarangayRef[];
    mapsApiKey: string;
}) {
    const [search, setSearch] = useState('');
    const [formMode, setFormMode] = useState<'closed' | 'create' | 'edit'>('closed');
    const [editingZone, setEditingZone] = useState<Item | undefined>();
    const [selectedBarangayIds, setSelectedBarangayIds] = useState<number[]>([]);
    const [page, setPage] = useState(1);
    const [filterBy, setFilterBy] = useState<'all' | 'active' | 'inactive'>('all');
    const perPage = 10;

    const filtered = items.filter((z) => {
        if (!z.name.toLowerCase().includes(search.toLowerCase()) &&
            !z.barangays.some((b) => b.name.toLowerCase().includes(search.toLowerCase()))) return false;
        if (filterBy === 'active') return z.active;
        if (filterBy === 'inactive') return !z.active;
        return true;
    });
    const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
    const currentPage = Math.min(page, totalPages);
    const paginated = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

    useEffect(() => { setPage(1); }, [search, filterBy]);

    const toggleBarangay = useCallback((id: number) => {
        setSelectedBarangayIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
        );
    }, []);

    const openCreate = () => {
        setEditingZone(undefined);
        setSelectedBarangayIds([]);
        setFormMode('create');
    };

    const openEdit = (zone: Item) => {
        setEditingZone(zone);
        setSelectedBarangayIds(zone.barangays.map((b) => b.id));
        setFormMode('edit');
    };

    const closeForm = () => {
        setFormMode('closed');
        setEditingZone(undefined);
        setSelectedBarangayIds([]);
    };

    const deleteZone = async (zone: Item) => {
        const yes = await swalConfirm('Delete zone?', `This will permanently delete "${zone.name}". This cannot be undone.`, 'Yes, delete');
        if (yes) {
            router.delete(`/admin/zones/${zone.id}`, {
                onSuccess: () => toast('success', 'Zone deleted successfully'),
                onError: () => errorAlert('Failed to delete zone', 'Something went wrong. Please try again.'),
            });
        }
    };

    const activeCount = items.filter((z) => z.active).length;
    const totalHouseholds = items.reduce((sum, z) => sum + z.households_count, 0);

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Zones" />
            <div className="flex h-[calc(100vh-4rem)] flex-col lg:flex-row">
                {/* Left panel */}
                <div className="flex w-full flex-col border-r border-neutral-100 bg-white lg:w-[440px] dark:border-neutral-800 dark:bg-neutral-900">
                    {/* Header */}
                    <div className="border-b border-neutral-100 px-5 py-4 dark:border-neutral-800">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-sm shadow-indigo-500/20">
                                    <Layers size={16} className="text-white" />
                                </div>
                                <div>
                                    <h1 className="text-lg font-bold text-neutral-900 dark:text-white">Zones</h1>
                                    <p className="text-[11px] text-neutral-400">{activeCount} active of {items.length} total</p>
                                </div>
                            </div>
                            <button
                                onClick={openCreate}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm shadow-indigo-600/20 transition-all hover:shadow-md hover:shadow-indigo-600/25"
                            >
                                <Plus size={14} />
                                New Zone
                            </button>
                        </div>

                        {/* Stats row */}
                        <div className="mt-3 grid grid-cols-3 gap-2">
                            <div className="rounded-xl bg-indigo-50/80 px-3 py-2 text-center dark:bg-indigo-950/30">
                                <p className="text-lg font-extrabold text-indigo-700 dark:text-indigo-400">{items.length}</p>
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-indigo-500/60">Total</p>
                            </div>
                            <div className="rounded-xl bg-emerald-50/80 px-3 py-2 text-center dark:bg-emerald-950/30">
                                <p className="text-lg font-extrabold text-emerald-700 dark:text-emerald-400">{activeCount}</p>
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-500/60">Active</p>
                            </div>
                            <div className="rounded-xl bg-amber-50/80 px-3 py-2 text-center dark:bg-amber-950/30">
                                <p className="text-lg font-extrabold text-amber-700 dark:text-amber-400">{totalHouseholds}</p>
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-500/60">Households</p>
                            </div>
                        </div>

                        {/* Search & filter */}
                        <div className="mt-3 flex gap-2">
                            <div className="relative flex-1">
                                <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search zones..."
                                    className="w-full rounded-xl border border-neutral-200 bg-neutral-50/50 py-2 pl-9 pr-3 text-xs outline-none transition-all placeholder:text-neutral-400 focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/10 dark:border-neutral-700 dark:bg-neutral-800/50 dark:text-neutral-300 dark:focus:border-indigo-600"
                                />
                            </div>
                            <div className="relative">
                                <Filter size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                                <select value={filterBy} onChange={(e) => setFilterBy(e.target.value as typeof filterBy)}
                                    className="appearance-none rounded-xl border border-neutral-200 bg-neutral-50/50 py-2 pl-8 pr-7 text-xs outline-none transition-all focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/10 dark:border-neutral-700 dark:bg-neutral-800/50 dark:text-neutral-300 dark:focus:border-indigo-600">
                                    <option value="all">All</option>
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Scrollable content: form + zone list */}
                    <div className="flex-1 overflow-y-auto">
                    <AnimatePresence>
                        {formMode !== 'closed' && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}
                                className="overflow-hidden border-b border-neutral-100 dark:border-neutral-800">
                                <div className="bg-neutral-50/80 p-4 dark:bg-neutral-800/30">
                                    <ZoneForm
                                        mode={formMode}
                                        zone={editingZone}
                                        barangays={barangays}
                                        selectedBarangayIds={selectedBarangayIds}
                                        onToggleBarangay={toggleBarangay}
                                        onClose={closeForm}
                                    />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Zone list */}
                    <div>
                        {paginated.length === 0 ? (
                            <div className="px-4 py-16 text-center">
                                <Layers size={28} className="mx-auto mb-2 text-neutral-200 dark:text-neutral-700" />
                                <p className="text-sm text-neutral-400">No zones found.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-neutral-50 dark:divide-neutral-800">
                                {paginated.map((z, i) => (
                                    <motion.div key={z.id} {...fade(i * 0.03)}
                                        className={`group px-5 py-3.5 transition-all hover:bg-neutral-50/80 dark:hover:bg-white/[0.02] ${
                                            editingZone?.id === z.id ? 'bg-indigo-50/40 dark:bg-indigo-900/10' : ''
                                        }`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-bold text-neutral-900 dark:text-white">{z.name}</span>
                                                    {z.active ? (
                                                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                                                            <CheckCircle2 size={10} /> Active
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-semibold text-neutral-500 dark:bg-neutral-800 dark:text-neutral-500">
                                                            <XCircle size={10} /> Inactive
                                                        </span>
                                                    )}
                                                </div>
                                                {z.barangays.length > 0 ? (
                                                    <div className="mt-1.5 flex flex-wrap gap-1">
                                                        {z.barangays.map((b) => (
                                                            <span key={b.id}
                                                                className="rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400">
                                                                {b.name}
                                                            </span>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="mt-1 text-[11px] italic text-neutral-400">No barangays assigned</p>
                                                )}
                                                <div className={`mt-1 flex items-center gap-1 text-[11px] ${z.households_count === 0 ? 'text-amber-500' : 'text-neutral-400'}`}>
                                                    <Users size={11} />
                                                    {z.households_count === 0 ? (
                                                        <span className="font-medium">No households</span>
                                                    ) : (
                                                        <span>{z.households_count} household{z.households_count !== 1 ? 's' : ''}</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                                                <button onClick={() => openEdit(z)}
                                                    className="rounded-lg p-1.5 text-neutral-400 transition-all hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-900/20">
                                                    <Pencil size={13} />
                                                </button>
                                                <button onClick={() => deleteZone(z)}
                                                    className="rounded-lg p-1.5 text-neutral-400 transition-all hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20">
                                                    <Trash2 size={13} />
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
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
                                        className="flex h-7 items-center gap-1 rounded-lg border border-neutral-200 px-2 text-[11px] font-medium text-neutral-500 transition-all hover:border-neutral-300 hover:bg-neutral-50 hover:text-neutral-700 disabled:cursor-not-allowed disabled:opacity-30 dark:border-neutral-700 dark:text-neutral-400 dark:hover:border-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-300">
                                        <ChevronLeft size={13} />
                                        <span className="hidden sm:inline">Prev</span>
                                    </button>
                                    <div className="flex items-center gap-0.5 rounded-lg border border-neutral-200 bg-neutral-50/50 p-0.5 dark:border-neutral-700 dark:bg-neutral-800/50">
                                        {pages.map((p, i) =>
                                            p === '...' ? (
                                                <span key={`dots-${i}`} className="flex h-6 w-6 items-center justify-center text-[10px] text-neutral-300 dark:text-neutral-600">...</span>
                                            ) : (
                                                <button key={p} onClick={() => setPage(p)}
                                                    className={`flex h-6 w-6 items-center justify-center rounded-md text-[10px] font-semibold transition-all ${p === currentPage
                                                        ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/25'
                                                        : 'text-neutral-500 hover:bg-white hover:text-neutral-700 hover:shadow-sm dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-neutral-200'}`}>
                                                    {p}
                                                </button>
                                            ),
                                        )}
                                    </div>
                                    <button onClick={() => setPage(currentPage + 1)} disabled={currentPage >= totalPages}
                                        className="flex h-7 items-center gap-1 rounded-lg border border-neutral-200 px-2 text-[11px] font-medium text-neutral-500 transition-all hover:border-neutral-300 hover:bg-neutral-50 hover:text-neutral-700 disabled:cursor-not-allowed disabled:opacity-30 dark:border-neutral-700 dark:text-neutral-400 dark:hover:border-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-300">
                                        <span className="hidden sm:inline">Next</span>
                                        <ChevronRight size={13} />
                                    </button>
                                </div>
                            </div>
                        );
                    })()}
                    </div>
                </div>

                {/* Right panel: map */}
                <div className="relative flex-1">
                    {mapsApiKey ? (
                        <>
                            <APIProvider apiKey={mapsApiKey}>
                                <Map
                                    mapId="smartwaste-zones-map"
                                    defaultCenter={{ lat: 13.998, lng: 120.7297 }}
                                    defaultZoom={13}
                                    gestureHandling="greedy"
                                    disableDefaultUI={false}
                                    style={{ width: '100%', height: '100%' }}
                                >
                                    <TuyBoundary />
                                    <BarangayPolygons
                                        barangays={barangays}
                                        selectedIds={selectedBarangayIds}
                                        onToggle={toggleBarangay}
                                    />
                                </Map>
                            </APIProvider>

                            {/* Map overlay hint */}
                            {formMode !== 'closed' && (
                                <div className="pointer-events-none absolute left-1/2 top-4 z-10 -translate-x-1/2">
                                    <div className="rounded-full border border-white/30 bg-white/90 px-4 py-2 text-xs font-semibold text-neutral-600 shadow-lg backdrop-blur-xl dark:border-neutral-600/30 dark:bg-neutral-900/90 dark:text-neutral-300">
                                        <span className="inline-flex items-center gap-1.5">
                                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-500" />
                                            Click barangays to select/deselect
                                        </span>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="flex h-full items-center justify-center bg-neutral-50 dark:bg-neutral-900">
                            <div className="text-center">
                                <MapPin size={28} className="mx-auto mb-2 text-neutral-300 dark:text-neutral-600" />
                                <p className="text-sm text-neutral-400">Google Maps API key not configured.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
