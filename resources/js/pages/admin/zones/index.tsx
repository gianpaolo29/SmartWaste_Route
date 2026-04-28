import { Head, router, useForm } from '@inertiajs/react';
import { useEffect, useState, useCallback } from 'react';
import { APIProvider, Map, useMap } from '@vis.gl/react-google-maps';
import { Plus, X, Pencil, Trash2, MapPin, Layers, Search } from 'lucide-react';
import AdminLayout from '@/layouts/admin-layout';
import { TuyBoundary } from '@/components/tuy-boundary';
import { confirm as swalConfirm } from '@/lib/notify';
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
    '#059669', '#2563eb', '#dc2626', '#d97706', '#7c3aed',
    '#0891b2', '#db2777', '#65a30d', '#f59e0b', '#6366f1',
];

/* ─── Map component: renders barangay circles, highlights selected ─── */
function BarangayCircles({
    barangays,
    selectedIds,
    onToggle,
}: {
    barangays: BarangayRef[];
    selectedIds: number[];
    onToggle: (id: number) => void;
}) {
    const map = useMap();
    const [hoverInfo, setHoverInfo] = useState<{ x: number; y: number; name: string; color: string } | null>(null);

    useEffect(() => {
        if (!map) return;
        const circles: google.maps.Circle[] = [];
        let cancelled = false;

        (async () => {
            const results = await Promise.all(
                barangays.map(async (b, idx) => {
                    try {
                        const res = await fetch(`/admin/barangays/${b.id}/boundary`, {
                            headers: { Accept: 'application/json' },
                        });
                        const data: Boundary = await res.json();
                        return { b, data, color: COLORS[idx % COLORS.length] };
                    } catch {
                        return null;
                    }
                }),
            );
            if (cancelled) return;

            for (const r of results) {
                if (!r || !r.data.center) continue;

                const isSelected = selectedIds.includes(r.b.id);

                const circle = new google.maps.Circle({
                    center: r.data.center,
                    radius: r.data.radius_m ?? 500,
                    strokeColor: isSelected ? '#4f46e5' : r.color,
                    strokeOpacity: isSelected ? 1 : 0.6,
                    strokeWeight: isSelected ? 3 : 1.5,
                    fillColor: isSelected ? '#4f46e5' : r.color,
                    fillOpacity: isSelected ? 0.35 : 0.08,
                    map,
                    clickable: true,
                    zIndex: isSelected ? 10 : 1,
                });

                circle.addListener('mouseover', (e: google.maps.MapMouseEvent) => {
                    if (!selectedIds.includes(r.b.id)) {
                        circle.setOptions({ fillOpacity: 0.22, strokeWeight: 2.5 });
                    }
                    if (e.domEvent && 'clientX' in e.domEvent) {
                        const ev = e.domEvent as MouseEvent;
                        setHoverInfo({ x: ev.clientX, y: ev.clientY, name: r.b.name, color: r.color });
                    }
                });
                circle.addListener('mousemove', (e: google.maps.MapMouseEvent) => {
                    if (e.domEvent && 'clientX' in e.domEvent) {
                        const ev = e.domEvent as MouseEvent;
                        setHoverInfo({ x: ev.clientX, y: ev.clientY, name: r.b.name, color: r.color });
                    }
                });
                circle.addListener('mouseout', () => {
                    if (!selectedIds.includes(r.b.id)) {
                        circle.setOptions({ fillOpacity: 0.08, strokeWeight: 1.5 });
                    }
                    setHoverInfo(null);
                });
                circle.addListener('click', () => {
                    onToggle(r.b.id);
                });

                circles.push(circle);
            }
        })();

        return () => {
            cancelled = true;
            circles.forEach((c) => c.setMap(null));
        };
    }, [map, barangays, selectedIds, onToggle]);

    if (!hoverInfo) return null;

    return (
        <div
            className="pointer-events-none fixed z-50 rounded-lg border border-gray-200 bg-white/95 px-3 py-1.5 text-xs font-semibold shadow-lg backdrop-blur dark:border-gray-700 dark:bg-gray-800/95"
            style={{ left: hoverInfo.x + 14, top: hoverInfo.y + 14 }}
        >
            <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: hoverInfo.color }} />
                {hoverInfo.name}
            </div>
            <span className="text-[10px] font-normal text-gray-400">Click to select/deselect</span>
        </div>
    );
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

    // Sync selected barangays into form data
    useEffect(() => {
        setData('barangay_ids', selectedBarangayIds);
    }, [selectedBarangayIds]);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (mode === 'create') {
            post('/admin/zones', { onSuccess: () => onClose() });
        } else if (zone) {
            put(`/admin/zones/${zone.id}`, { onSuccess: () => onClose() });
        }
    };

    return (
        <form onSubmit={submit} className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{mode === 'create' ? 'Create Zone' : 'Edit Zone'}</h3>
                <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
                    <X className="h-5 w-5" />
                </button>
            </div>

            <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Zone Name</label>
                <input
                    value={data.name}
                    onChange={(e) => setData('name', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                    placeholder="e.g. Zone A"
                />
                {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
            </div>

            <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                <input
                    value={data.description}
                    onChange={(e) => setData('description', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                    placeholder="Brief description..."
                />
            </div>

            {mode === 'edit' && (
                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={data.active}
                        onChange={(e) => setData('active', e.target.checked)}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label className="text-sm text-gray-700 dark:text-gray-300">Active</label>
                </div>
            )}

            {/* Selected barangays */}
            <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Selected Barangays ({selectedBarangayIds.length})
                </label>
                {errors.barangay_ids && <p className="mb-1 text-xs text-red-500">{errors.barangay_ids}</p>}
                {selectedBarangayIds.length === 0 ? (
                    <p className="text-sm text-gray-400">Click barangays on the map to select them.</p>
                ) : (
                    <div className="flex flex-wrap gap-1.5">
                        {selectedBarangayIds.map((id) => {
                            const b = barangays.find((br) => br.id === id);
                            return (
                                <span
                                    key={id}
                                    className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
                                >
                                    {b?.name ?? id}
                                    <button
                                        type="button"
                                        onClick={() => onToggleBarangay(id)}
                                        className="ml-0.5 hover:text-indigo-900"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </span>
                            );
                        })}
                    </div>
                )}
            </div>

            <button
                type="submit"
                disabled={processing}
                className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-50"
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

    const filtered = items.filter(
        (z) =>
            z.name.toLowerCase().includes(search.toLowerCase()) ||
            z.barangays.some((b) => b.name.toLowerCase().includes(search.toLowerCase())),
    );

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
        if (yes) router.delete(`/admin/zones/${zone.id}`);
    };

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Zones" />
            <div className="flex h-[calc(100vh-4rem)] flex-col lg:flex-row">
                {/* Left panel: list */}
                <div className="flex w-full flex-col border-r border-gray-100 lg:w-[420px] dark:border-gray-800">
                    {/* Header */}
                    <div className="border-b border-gray-100 p-4 dark:border-gray-800">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Layers className="h-5 w-5 text-indigo-600" />
                                <h1 className="text-lg font-bold">Zones</h1>
                                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500 dark:bg-gray-800">
                                    {items.length}
                                </span>
                            </div>
                            <button
                                onClick={openCreate}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-indigo-700"
                            >
                                <Plus className="h-4 w-4" />
                                New
                            </button>
                        </div>
                        <div className="relative mt-3">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search zones or barangays..."
                                className="w-full rounded-lg border border-gray-200 bg-gray-50/50 py-2 pl-9 pr-3 text-sm outline-none placeholder:text-gray-400 focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:focus:border-indigo-500"
                            />
                        </div>
                    </div>

                    {/* Zone form (appears above list when open) */}
                    {formMode !== 'closed' && (
                        <div className="border-b border-gray-100 bg-gray-50/50 p-4 dark:border-gray-800 dark:bg-gray-900/50">
                            <ZoneForm
                                mode={formMode}
                                zone={editingZone}
                                barangays={barangays}
                                selectedBarangayIds={selectedBarangayIds}
                                onToggleBarangay={toggleBarangay}
                                onClose={closeForm}
                            />
                        </div>
                    )}

                    {/* Zone list */}
                    <div className="flex-1 overflow-y-auto">
                        {filtered.length === 0 ? (
                            <div className="px-4 py-12 text-center text-sm text-gray-400">No zones found.</div>
                        ) : (
                            <div className="divide-y divide-gray-50 dark:divide-gray-800">
                                {filtered.map((z) => (
                                    <div
                                        key={z.id}
                                        className={`group px-4 py-3 transition hover:bg-gray-50/80 dark:hover:bg-white/[0.02] ${
                                            editingZone?.id === z.id ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''
                                        }`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-gray-900 dark:text-white">{z.name}</span>
                                                    <span
                                                        className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                                                            z.active
                                                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                                                : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500'
                                                        }`}
                                                    >
                                                        {z.active ? 'active' : 'inactive'}
                                                    </span>
                                                </div>
                                                <div className="mt-1 flex flex-wrap gap-1">
                                                    {z.barangays.map((b) => (
                                                        <span
                                                            key={b.id}
                                                            className="rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-medium text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400"
                                                        >
                                                            {b.name}
                                                        </span>
                                                    ))}
                                                </div>
                                                <p className="mt-0.5 text-xs text-gray-400">
                                                    {z.households_count} household{z.households_count !== 1 ? 's' : ''}
                                                </p>
                                            </div>
                                            <div className="flex gap-1 opacity-0 transition group-hover:opacity-100">
                                                <button
                                                    onClick={() => openEdit(z)}
                                                    className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-indigo-600 dark:hover:bg-gray-800"
                                                >
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => deleteZone(z)}
                                                    className="rounded-lg p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right panel: map */}
                <div className="flex-1">
                    {mapsApiKey ? (
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
                                <BarangayCircles
                                    barangays={barangays}
                                    selectedIds={selectedBarangayIds}
                                    onToggle={toggleBarangay}
                                />
                            </Map>
                        </APIProvider>
                    ) : (
                        <div className="flex h-full items-center justify-center bg-gray-50 dark:bg-gray-900">
                            <div className="text-center">
                                <MapPin className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                                <p className="text-sm text-gray-400">Google Maps API key not configured.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
