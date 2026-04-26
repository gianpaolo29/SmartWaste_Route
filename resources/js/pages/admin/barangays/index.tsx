import { Head } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { APIProvider, Map, useMap } from '@vis.gl/react-google-maps';
import { Building2, Users, MapPin, Layers, Search, Map as MapIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import AdminLayout from '@/layouts/admin-layout';
import { AdminTable } from '@/components/admin-table';
import { TuyBoundary } from '@/components/tuy-boundary';
import type { BreadcrumbItem } from '@/types';

type Item = { id: number; name: string; zones_count: number; residents_count: number };
type Stats = {
    total_barangays: number;
    total_zones: number;
    total_residents: number;
    active_zones: number;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/admin/dashboard' },
    { title: 'Barangays', href: '/admin/barangays' },
];

type Boundary = {
    paths: { lat: number; lng: number }[][];
    center: { lat: number; lng: number } | null;
    radius_m?: number;
};

const COLORS = [
    { stroke: '#059669', fill: '#059669' },
    { stroke: '#2563eb', fill: '#2563eb' },
    { stroke: '#dc2626', fill: '#dc2626' },
    { stroke: '#d97706', fill: '#d97706' },
    { stroke: '#7c3aed', fill: '#7c3aed' },
    { stroke: '#0891b2', fill: '#0891b2' },
    { stroke: '#db2777', fill: '#db2777' },
    { stroke: '#65a30d', fill: '#65a30d' },
];

function BarangayPolygons({ items, selected, onSelect }: { items: Item[]; selected: number | null; onSelect: (id: number | null) => void }) {
    const map = useMap();
    const [hoverInfo, setHoverInfo] = useState<{
        x: number;
        y: number;
        item: Item;
        color: string;
    } | null>(null);

    useEffect(() => {
        if (!map) return;
        const circles: google.maps.Circle[] = [];
        let cancelled = false;

        (async () => {
            const results = await Promise.all(
                items.map(async (item, idx) => {
                    try {
                        const res = await fetch(`/admin/barangays/${item.id}/boundary`, {
                            headers: { Accept: 'application/json' },
                        });
                        const data: Boundary = await res.json();
                        return { item, data, color: COLORS[idx % COLORS.length] };
                    } catch {
                        return null;
                    }
                }),
            );
            if (cancelled) return;

            for (const r of results) {
                if (!r || !r.data.center) continue;

                const isSelected = selected === r.item.id;

                const circle = new google.maps.Circle({
                    center: r.data.center,
                    radius: r.data.radius_m ?? 500,
                    strokeColor: r.color.stroke,
                    strokeOpacity: isSelected ? 1 : 0.8,
                    strokeWeight: isSelected ? 4 : 2,
                    fillColor: r.color.fill,
                    fillOpacity: isSelected ? 0.35 : 0.12,
                    map,
                    clickable: true,
                    zIndex: isSelected ? 10 : 1,
                });

                circle.addListener('mouseover', (e: google.maps.MapMouseEvent) => {
                    if (selected !== r.item.id) {
                        circle.setOptions({ fillOpacity: 0.28, strokeWeight: 3, strokeOpacity: 1 });
                    }
                    if (e.domEvent && 'clientX' in e.domEvent) {
                        const ev = e.domEvent as MouseEvent;
                        setHoverInfo({ x: ev.clientX, y: ev.clientY, item: r.item, color: r.color.stroke });
                    }
                });
                circle.addListener('mousemove', (e: google.maps.MapMouseEvent) => {
                    if (e.domEvent && 'clientX' in e.domEvent) {
                        const ev = e.domEvent as MouseEvent;
                        setHoverInfo({ x: ev.clientX, y: ev.clientY, item: r.item, color: r.color.stroke });
                    }
                });
                circle.addListener('mouseout', () => {
                    if (selected !== r.item.id) {
                        circle.setOptions({ fillOpacity: 0.12, strokeWeight: 2, strokeOpacity: 0.8 });
                    }
                    setHoverInfo(null);
                });
                circle.addListener('click', () => {
                    onSelect(selected === r.item.id ? null : r.item.id);
                    if (r.data.center) {
                        map.panTo(r.data.center);
                        map.setZoom(14);
                    }
                });

                circles.push(circle);
            }
        })();

        return () => {
            cancelled = true;
            circles.forEach((c) => c.setMap(null));
        };
    }, [map, items, selected, onSelect]);

    if (!hoverInfo) return null;

    return (
        <div
            className="pointer-events-none fixed z-50 overflow-hidden rounded-xl border border-gray-100 bg-white/95 shadow-2xl shadow-black/10 backdrop-blur-xl dark:border-white/10 dark:bg-[#1a1a1a]/95"
            style={{ left: hoverInfo.x + 14, top: hoverInfo.y + 14 }}
        >
            <div className="flex items-center gap-2 border-b border-gray-50 px-3.5 py-2 dark:border-white/5">
                <div
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: hoverInfo.color }}
                />
                <span className="text-xs font-bold text-[#1b4332] dark:text-emerald-300">{hoverInfo.item.name}</span>
            </div>
            <div className="flex gap-4 px-3.5 py-2">
                <div className="text-center">
                    <p className="text-xs font-bold">{hoverInfo.item.residents_count}</p>
                    <p className="text-[10px] text-gray-400">Residents</p>
                </div>
                <div className="text-center">
                    <p className="text-xs font-bold">{hoverInfo.item.zones_count}</p>
                    <p className="text-[10px] text-gray-400">Zones</p>
                </div>
            </div>
        </div>
    );
}

export default function BarangaysIndex({
    items,
    stats,
    mapsApiKey,
}: {
    items: Item[];
    stats: Stats;
    mapsApiKey: string;
}) {
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState<number | null>(null);

    const filtered = items.filter((b) =>
        b.name.toLowerCase().includes(search.toLowerCase()),
    );

    const statCards = [
        { label: 'Barangays', value: stats.total_barangays, icon: Building2, gradient: 'from-emerald-500 to-teal-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600 dark:text-emerald-400' },
        { label: 'Active Zones', value: stats.active_zones, icon: Layers, gradient: 'from-blue-500 to-cyan-600', bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400' },
        { label: 'Residents', value: stats.total_residents, icon: Users, gradient: 'from-violet-500 to-purple-600', bg: 'bg-violet-50 dark:bg-violet-900/20', text: 'text-violet-600 dark:text-violet-400' },
        { label: 'Total Zones', value: stats.total_zones, icon: MapPin, gradient: 'from-amber-500 to-orange-600', bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-600 dark:text-amber-400' },
    ];

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Barangays" />
            <div className="space-y-5 p-5">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                >
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Barangays</h1>
                        <p className="mt-0.5 text-sm text-gray-400">Manage barangay areas and view geographic distribution</p>
                    </div>
                </motion.div>

                {/* Stat Cards */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                    {statCards.map(({ label, value, icon: Icon, bg, text }, i) => (
                        <motion.div
                            key={label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: i * 0.06 }}
                            className="premium-card group flex items-center gap-3 border border-gray-100 bg-white p-4 sm:gap-4 sm:p-5 dark:border-white/5 dark:bg-white/[0.02]"
                        >
                            <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl sm:h-12 sm:w-12 sm:rounded-2xl ${bg}`}>
                                <Icon size={18} className={`sm:hidden ${text}`} />
                                <Icon size={22} className={`hidden sm:block ${text}`} />
                            </div>
                            <div className="min-w-0">
                                <p className="truncate text-xs font-medium text-gray-400 sm:text-sm">{label}</p>
                                <p className="text-xl font-bold tracking-tight sm:text-2xl">{value}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Map */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.25 }}
                >
                    {mapsApiKey ? (
                        <div className="premium-card overflow-hidden border border-gray-100 bg-white dark:border-white/5 dark:bg-white/[0.02]">
                            <div className="flex items-center gap-2 border-b border-gray-50 px-5 py-3.5 dark:border-white/5">
                                <MapIcon size={16} className="text-emerald-600 dark:text-emerald-400" />
                                <h2 className="text-sm font-semibold tracking-tight">Geographic Overview</h2>
                                <span className="ml-auto text-[11px] text-gray-400">Click a zone to focus</span>
                            </div>
                            <div className="h-[350px] sm:h-[480px] lg:h-[540px]">
                                <APIProvider apiKey={mapsApiKey}>
                                    <Map
                                        mapId="smartwaste-route-map"
                                        defaultCenter={{ lat: 13.998, lng: 120.7297 }}
                                        defaultZoom={13}
                                        gestureHandling="greedy"
                                        disableDefaultUI={false}
                                        style={{ width: '100%', height: '100%' }}
                                    >
                                        <TuyBoundary />
                                        <BarangayPolygons items={items} selected={selected} onSelect={setSelected} />
                                    </Map>
                                </APIProvider>
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
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.35 }}
                >
                    <div className="premium-card overflow-hidden border border-gray-100 bg-white dark:border-white/5 dark:bg-white/[0.02]">
                        <div className="flex flex-col gap-3 border-b border-gray-50 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between dark:border-white/5">
                            <div className="flex items-center gap-2">
                                <Building2 size={16} className="text-emerald-600 dark:text-emerald-400" />
                                <h2 className="text-sm font-semibold tracking-tight">All Barangays</h2>
                                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-500 dark:bg-white/5 dark:text-gray-400">
                                    {items.length}
                                </span>
                            </div>
                            <div className="relative">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 dark:text-gray-600" />
                                <input
                                    type="text"
                                    placeholder="Search barangays..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full rounded-lg border border-gray-200 bg-gray-50/50 py-2 pl-8 pr-3 text-xs outline-none transition-all placeholder:text-gray-400 focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 sm:w-56 dark:border-white/10 dark:bg-white/5 dark:focus:border-emerald-600"
                                />
                            </div>
                        </div>
                        <AdminTable
                            rows={filtered}
                            columns={[
                                {
                                    header: 'Barangay',
                                    cell: (b) => (
                                        <button
                                            onClick={() => setSelected(selected === b.id ? null : b.id)}
                                            className="flex items-center gap-2 font-semibold text-gray-900 transition-colors hover:text-emerald-600 dark:text-white dark:hover:text-emerald-400"
                                        >
                                            <div
                                                className="h-2 w-2 rounded-full"
                                                style={{ backgroundColor: COLORS[(items.findIndex((i) => i.id === b.id)) % COLORS.length].stroke }}
                                            />
                                            {b.name}
                                        </button>
                                    ),
                                },
                                {
                                    header: 'Zones',
                                    cell: (b) => (
                                        <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                                            {b.zones_count}
                                        </span>
                                    ),
                                },
                                {
                                    header: 'Residents',
                                    cell: (b) => (
                                        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400">
                                            {b.residents_count}
                                        </span>
                                    ),
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
