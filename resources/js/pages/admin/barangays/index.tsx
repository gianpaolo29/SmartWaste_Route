import { Head } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { APIProvider, Map, useMap } from '@vis.gl/react-google-maps';
import { Building2, Users, MapPin, Layers, Search, Map as MapIcon, X, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminLayout from '@/layouts/admin-layout';
import { AdminTable } from '@/components/admin-table';
import { TuyBoundary } from '@/components/tuy-boundary';
import type { BreadcrumbItem } from '@/types';

type Item = { id: number; name: string; zones_count: number; residents_count: number };
type Stats = { total_barangays: number; total_zones: number; total_residents: number; active_zones: number };
type Boundary = { paths: { lat: number; lng: number }[][]; center: { lat: number; lng: number } | null; radius_m?: number };

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/admin/dashboard' },
    { title: 'Barangays', href: '/admin/barangays' },
];

const COLORS = ['#059669', '#2563eb', '#dc2626', '#d97706', '#7c3aed', '#0891b2', '#db2777', '#65a30d'];

const DASH_SYMBOL: google.maps.Symbol = { path: 'M 0,-1 0,1', strokeOpacity: 1, scale: 3 };

const fade = (delay = 0) => ({
    initial: { opacity: 0, y: 16 } as const,
    animate: { opacity: 1, y: 0 } as const,
    transition: { duration: 0.35, delay },
});

function BarangayPolygons({ items, selected, onSelect }: { items: Item[]; selected: number | null; onSelect: (id: number | null) => void }) {
    const map = useMap();

    useEffect(() => {
        if (!map) return;
        const overlays: (google.maps.Polyline | google.maps.Polygon)[] = [];
        const labels: google.maps.marker.AdvancedMarkerElement[] = [];
        let cancelled = false;

        (async () => {
            const results = await Promise.all(
                items.map(async (item, idx) => {
                    try {
                        const res = await fetch(`/admin/barangays/${item.id}/boundary`, { headers: { Accept: 'application/json' } });
                        const data: Boundary = await res.json();
                        return { item, data, color: COLORS[idx % COLORS.length] };
                    } catch { return null; }
                }),
            );
            if (cancelled) return;

            for (const r of results) {
                if (!r || !r.data.paths?.length || !r.data.center) continue;
                const isSelected = selected === r.item.id;
                const path = r.data.paths[0];

                const outline = new google.maps.Polyline({
                    path,
                    strokeOpacity: 0,
                    strokeWeight: 0,
                    icons: [{
                        icon: { ...DASH_SYMBOL, strokeColor: isSelected ? '#059669' : '#e53e3e', strokeWeight: isSelected ? 3 : 1.5 },
                        offset: '0',
                        repeat: isSelected ? '8px' : '10px',
                    }],
                    map,
                    zIndex: isSelected ? 10 : 1,
                });

                const fill = new google.maps.Polygon({
                    paths: path,
                    strokeOpacity: 0,
                    strokeWeight: 0,
                    fillColor: '#059669',
                    fillOpacity: isSelected ? 0.1 : 0,
                    map,
                    clickable: true,
                    zIndex: isSelected ? 9 : 0,
                });

                fill.addListener('click', () => {
                    onSelect(selected === r.item.id ? null : r.item.id);
                    if (r.data.center) { map.panTo(r.data.center); map.setZoom(15); }
                });
                fill.addListener('mouseover', () => { if (!isSelected) fill.setOptions({ fillColor: '#059669', fillOpacity: 0.06 }); });
                fill.addListener('mouseout', () => { if (!isSelected) fill.setOptions({ fillOpacity: 0 }); });

                overlays.push(outline, fill);

                if (r.data.center && typeof google.maps.marker?.AdvancedMarkerElement !== 'undefined') {
                    const el = document.createElement('div');
                    el.style.cssText = `font-size:10px;font-weight:700;letter-spacing:0.02em;color:${isSelected ? '#fff' : '#374151'};background:${isSelected ? r.color : 'rgba(255,255,255,0.95)'};padding:3px 8px;border-radius:10px;border:1.5px solid ${isSelected ? r.color : '#e5e7eb'};cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,0.1);white-space:nowrap;user-select:none;transition:all 0.15s ease;`;
                    el.textContent = r.item.name;
                    el.addEventListener('click', () => {
                        onSelect(selected === r.item.id ? null : r.item.id);
                        if (r.data.center) { map.panTo(r.data.center); map.setZoom(15); }
                    });
                    el.addEventListener('mouseenter', () => { if (!isSelected) { el.style.background = r.color; el.style.color = '#fff'; el.style.borderColor = r.color; } });
                    el.addEventListener('mouseleave', () => { if (!isSelected) { el.style.background = 'rgba(255,255,255,0.95)'; el.style.color = '#374151'; el.style.borderColor = '#e5e7eb'; } });

                    labels.push(new google.maps.marker.AdvancedMarkerElement({ map, position: r.data.center, content: el }));
                }
            }
        })();

        return () => { cancelled = true; overlays.forEach((o) => o.setMap(null)); labels.forEach((m) => (m.map = null)); };
    }, [map, items, selected, onSelect]);

    return null;
}

export default function BarangaysIndex({ items, stats, mapsApiKey }: { items: Item[]; stats: Stats; mapsApiKey: string }) {
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState<number | null>(null);
    const filtered = items.filter((b) => b.name.toLowerCase().includes(search.toLowerCase()));
    const selectedItem = items.find((i) => i.id === selected);

    const statCards = [
        { label: 'Barangays', value: stats.total_barangays, icon: Building2, bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-600 dark:text-emerald-400', ring: 'ring-emerald-500/20' },
        { label: 'Active Zones', value: stats.active_zones, icon: Layers, bg: 'bg-blue-50 dark:bg-blue-950/40', text: 'text-blue-600 dark:text-blue-400', ring: 'ring-blue-500/20' },
        { label: 'Residents', value: stats.total_residents, icon: Users, bg: 'bg-violet-50 dark:bg-violet-950/40', text: 'text-violet-600 dark:text-violet-400', ring: 'ring-violet-500/20' },
        { label: 'Total Zones', value: stats.total_zones, icon: MapPin, bg: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-600 dark:text-amber-400', ring: 'ring-amber-500/20' },
    ];

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Barangays" />
            <div className="space-y-4 p-4 sm:p-5">
                <motion.div {...fade()}>
                    <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">Barangays</h1>
                    <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">Geographic distribution and resident data</p>
                </motion.div>

                {/* Stat Cards */}
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    {statCards.map(({ label, value, icon: Icon, bg, text, ring }, i) => (
                        <motion.div key={label} {...fade(0.04 + i * 0.04)}
                            className="group rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900">
                            <div className="flex items-center justify-between">
                                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${bg} ring-4 ${ring} transition-transform group-hover:scale-110`}>
                                    <Icon size={18} className={text} />
                                </div>
                                <p className="text-2xl font-bold text-neutral-900 dark:text-white">{value}</p>
                            </div>
                            <p className="mt-3 text-xs font-medium text-neutral-500 dark:text-neutral-400">{label}</p>
                        </motion.div>
                    ))}
                </div>

                {/* Map */}
                <motion.div {...fade(0.2)}>
                    {mapsApiKey ? (
                        <div className="relative overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                            <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3 dark:border-neutral-800">
                                <div className="flex items-center gap-2">
                                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/50">
                                        <MapIcon size={14} className="text-emerald-600 dark:text-emerald-400" />
                                    </div>
                                    <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">Geographic Overview</h2>
                                </div>
                                <div className="flex items-center gap-2 text-[11px] text-neutral-400">
                                    <span className="hidden sm:inline">Click a barangay to inspect</span>
                                    {selected && (
                                        <button onClick={() => setSelected(null)} className="flex items-center gap-1 rounded-lg bg-neutral-100 px-2 py-1 font-medium text-neutral-600 transition-colors hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700">
                                            <X size={12} /> Clear
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className="relative h-[350px] sm:h-[480px] lg:h-[540px]">
                                <APIProvider apiKey={mapsApiKey}>
                                    <Map mapId="smartwaste-route-map" defaultCenter={{ lat: 13.998, lng: 120.7297 }} defaultZoom={13} gestureHandling="greedy" disableDefaultUI={false} style={{ width: '100%', height: '100%' }}>
                                        <TuyBoundary />
                                        <BarangayPolygons items={items} selected={selected} onSelect={setSelected} />
                                    </Map>
                                </APIProvider>

                                {/* Info panel */}
                                <AnimatePresence>
                                    {selectedItem && (
                                        <motion.div initial={{ opacity: 0, y: 12, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: 0.96 }} transition={{ duration: 0.2 }}
                                            className="absolute bottom-4 left-4 right-4 z-10 sm:left-auto sm:right-4 sm:w-72">
                                            <div className="overflow-hidden rounded-2xl border border-white/50 bg-white/95 shadow-2xl shadow-black/10 backdrop-blur-xl dark:border-neutral-700 dark:bg-neutral-900/95">
                                                {/* Header */}
                                                <div className="flex items-center justify-between bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3 text-white">
                                                    <div>
                                                        <h3 className="text-sm font-bold">{selectedItem.name}</h3>
                                                        <p className="text-[11px] text-white/70">Barangay</p>
                                                    </div>
                                                    <button onClick={() => setSelected(null)} className="rounded-lg bg-white/15 p-1 transition-colors hover:bg-white/25">
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                                {/* Stats */}
                                                <div className="grid grid-cols-2 gap-3 p-4">
                                                    <div className="rounded-xl bg-emerald-50 p-3 text-center dark:bg-emerald-950/40">
                                                        <Users size={16} className="mx-auto text-emerald-600 dark:text-emerald-400" />
                                                        <p className="mt-1 text-xl font-bold text-emerald-700 dark:text-emerald-400">{selectedItem.residents_count}</p>
                                                        <p className="text-[10px] font-medium text-emerald-600/60">Residents</p>
                                                    </div>
                                                    <div className="rounded-xl bg-blue-50 p-3 text-center dark:bg-blue-950/40">
                                                        <Layers size={16} className="mx-auto text-blue-600 dark:text-blue-400" />
                                                        <p className="mt-1 text-xl font-bold text-blue-700 dark:text-blue-400">{selectedItem.zones_count}</p>
                                                        <p className="text-[10px] font-medium text-blue-600/60">Zones</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    ) : (
                        <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-center text-sm text-red-600 dark:border-red-900/30 dark:bg-red-900/10 dark:text-red-400">
                            <MapPin size={24} className="mx-auto mb-2 text-red-400" />
                            Google Maps API key not configured.
                        </div>
                    )}
                </motion.div>

                {/* Table */}
                <motion.div {...fade(0.3)}>
                    <div className="overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                        <div className="flex flex-col gap-3 border-b border-neutral-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-neutral-800">
                            <div className="flex items-center gap-2">
                                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/50">
                                    <Building2 size={14} className="text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">All Barangays</h2>
                                <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-bold text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">{items.length}</span>
                            </div>
                            <div className="relative">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                                <input type="text" placeholder="Search barangays..." value={search} onChange={(e) => setSearch(e.target.value)}
                                    className="w-full rounded-xl border border-neutral-200 bg-neutral-50/50 py-2 pl-8 pr-3 text-xs outline-none transition-all placeholder:text-neutral-400 focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 sm:w-56 dark:border-neutral-700 dark:bg-neutral-800/50 dark:focus:border-emerald-700" />
                            </div>
                        </div>
                        <AdminTable
                            rows={filtered}
                            columns={[
                                {
                                    header: 'Barangay',
                                    cell: (b) => (
                                        <button onClick={() => setSelected(selected === b.id ? null : b.id)}
                                            className={`flex items-center gap-2.5 text-sm font-semibold transition-colors hover:text-emerald-600 dark:hover:text-emerald-400 ${selected === b.id ? 'text-emerald-600 dark:text-emerald-400' : 'text-neutral-900 dark:text-white'}`}>
                                            <div className="h-2.5 w-2.5 rounded-full ring-2 ring-offset-1" style={{ backgroundColor: COLORS[items.findIndex((i) => i.id === b.id) % COLORS.length], boxShadow: `0 0 0 1px ${COLORS[items.findIndex((i) => i.id === b.id) % COLORS.length]}33` }} />
                                            {b.name}
                                            {selected === b.id && <Eye size={13} className="text-emerald-500" />}
                                        </button>
                                    ),
                                },
                                {
                                    header: 'Zones',
                                    cell: (b) => <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">{b.zones_count}</span>,
                                },
                                {
                                    header: 'Residents',
                                    cell: (b) => <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">{b.residents_count}</span>,
                                },
                            ]}
                            empty="No barangays found."
                        />
                    </div>
                </motion.div>
            </div>
        </AdminLayout>
    );
}
