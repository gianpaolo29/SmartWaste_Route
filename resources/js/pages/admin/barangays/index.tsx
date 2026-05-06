import { Head } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { APIProvider, Map, useMap } from '@vis.gl/react-google-maps';
import { Building2, Users, MapPin, Layers, Search, Map as MapIcon, X, Eye, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
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

const COLORS = ['#10b981', '#3b82f6', '#f43f5e', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'];

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

                // Compute bounds for this barangay
                const bounds = new google.maps.LatLngBounds();
                path.forEach((p) => bounds.extend(p));

                // Visible polyline border
                const outline = new google.maps.Polyline({
                    path,
                    strokeColor: r.color,
                    strokeOpacity: isSelected ? 1 : 0.45,
                    strokeWeight: isSelected ? 3.5 : 1.5,
                    map,
                    zIndex: isSelected ? 11 : 2,
                });

                // Glow effect polyline (visible only when selected)
                const glow = new google.maps.Polyline({
                    path,
                    strokeColor: r.color,
                    strokeOpacity: isSelected ? 0.25 : 0,
                    strokeWeight: isSelected ? 8 : 0,
                    map,
                    zIndex: isSelected ? 10 : 1,
                });

                // Invisible polygon for click/hover fill
                const fill = new google.maps.Polygon({
                    paths: path,
                    strokeOpacity: 0,
                    strokeWeight: 0,
                    fillColor: r.color,
                    fillOpacity: isSelected ? 0.18 : 0,
                    map,
                    clickable: true,
                    zIndex: isSelected ? 9 : 1,
                });

                fill.addListener('click', () => {
                    const deselecting = selected === r.item.id;
                    onSelect(deselecting ? null : r.item.id);
                    if (!deselecting) {
                        map.fitBounds(bounds, { top: 60, right: 60, bottom: 60, left: 60 });
                    }
                });
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

                if (r.data.center && typeof google.maps.marker?.AdvancedMarkerElement !== 'undefined') {
                    const el = document.createElement('div');
                    const selectedStyle = `
                        font-size:11px;font-weight:700;letter-spacing:0.03em;
                        color:#fff;background:${r.color};
                        padding:5px 12px;border-radius:20px;
                        border:2px solid rgba(255,255,255,0.3);
                        cursor:pointer;
                        box-shadow:0 4px 14px ${r.color}55, 0 0 0 3px ${r.color}20;
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
                    el.textContent = r.item.name;
                    el.addEventListener('click', () => {
                        const deselecting = selected === r.item.id;
                        onSelect(deselecting ? null : r.item.id);
                        if (!deselecting) {
                            map.fitBounds(bounds, { top: 60, right: 60, bottom: 60, left: 60 });
                        }
                    });
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
    }, [map, items, selected, onSelect]);

    return null;
}

export default function BarangaysIndex({ items, stats, mapsApiKey }: { items: Item[]; stats: Stats; mapsApiKey: string }) {
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState<number | null>(null);
    const [page, setPage] = useState(1);
    const [filterBy, setFilterBy] = useState<'all' | 'with_zones' | 'no_zones' | 'with_residents' | 'no_residents'>('all');
    const perPage = 10;

    const filtered = items.filter((b) => {
        if (!b.name.toLowerCase().includes(search.toLowerCase())) return false;
        if (filterBy === 'with_zones') return b.zones_count > 0;
        if (filterBy === 'no_zones') return b.zones_count === 0;
        if (filterBy === 'with_residents') return b.residents_count > 0;
        if (filterBy === 'no_residents') return b.residents_count === 0;
        return true;
    });
    const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
    const currentPage = Math.min(page, totalPages);
    const paginated = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);
    const selectedItem = items.find((i) => i.id === selected);

    // Reset page when search or filter changes
    useEffect(() => { setPage(1); }, [search, filterBy]);

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
                    {([
                        { label: 'Barangays', value: stats.total_barangays, icon: Building2, bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-600 dark:text-emerald-400', ring: 'ring-emerald-500/20' },
                        { label: 'Active Zones', value: stats.active_zones, icon: Layers, bg: 'bg-blue-50 dark:bg-blue-950/40', text: 'text-blue-600 dark:text-blue-400', ring: 'ring-blue-500/20' },
                        { label: 'Residents', value: stats.total_residents, icon: Users, bg: 'bg-violet-50 dark:bg-violet-950/40', text: 'text-violet-600 dark:text-violet-400', ring: 'ring-violet-500/20' },
                        { label: 'Total Zones', value: stats.total_zones, icon: MapPin, bg: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-600 dark:text-amber-400', ring: 'ring-amber-500/20' },
                    ] as const).map(({ label, value, icon: Icon, bg, text, ring }, i) => (
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
                        <div className="group/map relative overflow-hidden rounded-2xl border border-neutral-200/60 bg-white shadow-lg shadow-black/[0.03] dark:border-neutral-700/60 dark:bg-neutral-900">
                            {/* Map header */}
                            <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-3.5 dark:border-neutral-800">
                                <div className="flex items-center gap-2.5">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-sm shadow-emerald-500/20">
                                        <MapIcon size={14} className="text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-sm font-bold text-neutral-900 dark:text-white">Geographic Overview</h2>
                                        <p className="text-[11px] text-neutral-400 dark:text-neutral-500">Click a barangay to inspect</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="hidden items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-600 sm:flex dark:bg-emerald-950/40 dark:text-emerald-400">
                                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                                        {items.length} Areas
                                    </div>
                                    {selected && (
                                        <button onClick={() => setSelected(null)} className="flex items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1.5 text-[11px] font-semibold text-neutral-600 transition-all hover:bg-red-50 hover:text-red-600 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-red-950/30 dark:hover:text-red-400">
                                            <X size={12} /> Clear
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className="relative h-[380px] sm:h-[500px] lg:h-[580px]">
                                <APIProvider apiKey={mapsApiKey}>
                                    <Map mapId="smartwaste-route-map" defaultCenter={{ lat: 13.998, lng: 120.7297 }} defaultZoom={13} gestureHandling="greedy" disableDefaultUI={false} style={{ width: '100%', height: '100%' }}>
                                        <TuyBoundary />
                                        <BarangayPolygons items={items} selected={selected} onSelect={setSelected} />
                                    </Map>
                                </APIProvider>

                                {/* Subtle edge vignette */}
                                <div className="pointer-events-none absolute inset-0 rounded-b-2xl shadow-[inset_0_-1px_0_0_rgba(0,0,0,0.04)]" />

                                {/* Info panel */}
                                <AnimatePresence>
                                    {selectedItem && (
                                        <motion.div initial={{ opacity: 0, y: 16, scale: 0.94 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16, scale: 0.94 }} transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                                            className="absolute bottom-5 left-4 right-4 z-10 sm:left-auto sm:right-5 sm:w-[280px]">
                                            <div className="overflow-hidden rounded-2xl border border-white/40 bg-white/90 shadow-2xl shadow-black/15 backdrop-blur-2xl dark:border-neutral-600/40 dark:bg-neutral-900/90">
                                                {/* Header with color accent */}
                                                <div className="relative overflow-hidden">
                                                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-emerald-600 to-teal-500" />
                                                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_60%)]" />
                                                    <div className="relative flex items-center justify-between px-4 py-3.5">
                                                        <div>
                                                            <h3 className="text-[13px] font-bold tracking-tight text-white">{selectedItem.name}</h3>
                                                            <p className="mt-0.5 text-[10px] font-medium text-white/60">Barangay</p>
                                                        </div>
                                                        <button onClick={() => setSelected(null)} className="rounded-full bg-white/15 p-1.5 transition-all hover:bg-white/25 hover:scale-110">
                                                            <X size={13} className="text-white" />
                                                        </button>
                                                    </div>
                                                </div>
                                                {/* Stats */}
                                                <div className="grid grid-cols-2 gap-2.5 p-3.5">
                                                    <div className="group rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-50/50 p-3 text-center transition-all hover:shadow-sm dark:from-emerald-950/40 dark:to-emerald-950/20">
                                                        <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100/80 dark:bg-emerald-900/40">
                                                            <Users size={14} className="text-emerald-600 dark:text-emerald-400" />
                                                        </div>
                                                        <p className="mt-1.5 text-xl font-extrabold text-emerald-700 dark:text-emerald-400">{selectedItem.residents_count}</p>
                                                        <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-500/60">Residents</p>
                                                    </div>
                                                    <div className="group rounded-xl bg-gradient-to-br from-blue-50 to-blue-50/50 p-3 text-center transition-all hover:shadow-sm dark:from-blue-950/40 dark:to-blue-950/20">
                                                        <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100/80 dark:bg-blue-900/40">
                                                            <Layers size={14} className="text-blue-600 dark:text-blue-400" />
                                                        </div>
                                                        <p className="mt-1.5 text-xl font-extrabold text-blue-700 dark:text-blue-400">{selectedItem.zones_count}</p>
                                                        <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-500/60">Zones</p>
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
                        {/* Table header with search & filter */}
                        <div className="flex flex-col gap-3 border-b border-neutral-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-neutral-800">
                            <div className="flex items-center gap-2">
                                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/50">
                                    <Building2 size={14} className="text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">All Barangays</h2>
                                <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-bold text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">{filtered.length}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                {/* Filter */}
                                <div className="relative">
                                    <Filter size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                                    <select value={filterBy} onChange={(e) => setFilterBy(e.target.value as typeof filterBy)}
                                        className="appearance-none rounded-xl border border-neutral-200 bg-neutral-50/50 py-2 pl-8 pr-8 text-xs outline-none transition-all focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 dark:border-neutral-700 dark:bg-neutral-800/50 dark:text-neutral-300 dark:focus:border-emerald-700">
                                        <option value="all">All</option>
                                        <option value="with_zones">With Zones</option>
                                        <option value="no_zones">No Zones</option>
                                        <option value="with_residents">With Residents</option>
                                        <option value="no_residents">No Residents</option>
                                    </select>
                                </div>
                                {/* Search */}
                                <div className="relative">
                                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                                    <input type="text" placeholder="Search barangays..." value={search} onChange={(e) => setSearch(e.target.value)}
                                        className="w-full rounded-xl border border-neutral-200 bg-neutral-50/50 py-2 pl-8 pr-3 text-xs outline-none transition-all placeholder:text-neutral-400 focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 sm:w-56 dark:border-neutral-700 dark:bg-neutral-800/50 dark:text-neutral-300 dark:focus:border-emerald-700" />
                                </div>
                            </div>
                        </div>
                        <AdminTable
                            rows={paginated}
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
                                    header: 'Residents',
                                    cell: (b) => <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">{b.residents_count}</span>,
                                },
                            ]}
                            empty="No barangays found."
                        />
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
                                                            ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/25'
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
        </AdminLayout>
    );
}
