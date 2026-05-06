import { Head } from '@inertiajs/react';
import { MapPin, AlertTriangle, Scale, Recycle, Leaf, Trash2, Package, Flame, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { APIProvider, Map, AdvancedMarker, useMap } from '@vis.gl/react-google-maps';
import AdminLayout from '@/layouts/admin-layout';
import { TuyBoundary } from '@/components/tuy-boundary';
import type { BreadcrumbItem } from '@/types';

type BreakdownItem = { name: string; value: number; color: string };

type ZoneData = {
    id: number;
    name: string;
    barangays: string;
    total_waste: number;
    report_count: number;
    missed_count: number;
    intensity: number;
    breakdown: BreakdownItem[];
};

type MissedMarker = { id: number; lat: number; lng: number; description: string; status: string };
type HeatmapPoint = { lat: number; lng: number; weight: number };

type Props = {
    zones: ZoneData[];
    missedMarkers: MissedMarker[];
    heatmapPoints: HeatmapPoint[];
    mapsApiKey: string;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/admin/dashboard' },
    { title: 'Waste Heatmap', href: '/admin/analytics/zone-heatmap' },
];

function intensityColor(intensity: number): string {
    if (intensity < 0.25) return 'from-emerald-500 to-emerald-600';
    if (intensity < 0.5) return 'from-yellow-500 to-amber-500';
    if (intensity < 0.75) return 'from-orange-500 to-orange-600';
    return 'from-red-500 to-red-600';
}

function intensityBg(intensity: number): string {
    if (intensity < 0.25) return 'bg-emerald-50 dark:bg-emerald-950/30';
    if (intensity < 0.5) return 'bg-yellow-50 dark:bg-yellow-950/30';
    if (intensity < 0.75) return 'bg-orange-50 dark:bg-orange-950/30';
    return 'bg-red-50 dark:bg-red-950/30';
}

function intensityHex(intensity: number): string {
    if (intensity < 0.25) return '#10b981';
    if (intensity < 0.5) return '#eab308';
    if (intensity < 0.75) return '#f97316';
    return '#ef4444';
}

/* Renders Google Maps HeatmapLayer from collection points */
function WasteHeatmapLayer({ points }: { points: HeatmapPoint[] }) {
    const map = useMap();

    useEffect(() => {
        if (!map || points.length === 0) return;

        const heatmap = new google.maps.visualization.HeatmapLayer({
            data: points.map((p) => ({
                location: new google.maps.LatLng(p.lat, p.lng),
                weight: p.weight,
            })),
            map,
            radius: 40,
            opacity: 0.7,
            gradient: [
                'rgba(0, 0, 0, 0)',
                'rgba(16, 185, 129, 0.4)',
                'rgba(16, 185, 129, 0.6)',
                'rgba(234, 179, 8, 0.7)',
                'rgba(249, 115, 22, 0.8)',
                'rgba(239, 68, 68, 0.9)',
                'rgba(220, 38, 38, 1)',
            ],
        });

        return () => heatmap.setMap(null);
    }, [map, points]);

    return null;
}

const wasteIcons = {
    Mixed: Package,
    Biodegradable: Leaf,
    Recyclable: Recycle,
    Residual: Trash2,
    Solid: Flame,
};

export default function WasteHeatmap({ zones, missedMarkers, heatmapPoints, mapsApiKey }: Props) {
    const center = { lat: 13.9333, lng: 120.7333 };
    const sortedZones = [...zones].sort((a, b) => b.total_waste - a.total_waste);
    const [selectedZone, setSelectedZone] = useState<ZoneData | null>(null);
    const [showMissed, setShowMissed] = useState(true);

    const totalWaste = zones.reduce((s, z) => s + z.total_waste, 0);
    const totalReports = zones.reduce((s, z) => s + z.report_count, 0);
    const totalMissed = zones.reduce((s, z) => s + z.missed_count, 0);

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Waste Heatmap" />
            <div className="flex h-[calc(100vh-57px)] flex-col lg:flex-row">
                {/* Side panel */}
                <div className="w-full overflow-y-auto border-b border-neutral-200/50 bg-white p-4 lg:w-[400px] lg:border-b-0 lg:border-r dark:border-neutral-800 dark:bg-neutral-900">
                    <h1 className="text-lg font-bold tracking-tight text-neutral-900 dark:text-white">Waste Heatmap</h1>
                    <p className="mt-0.5 text-xs text-neutral-400">Collection density and waste distribution</p>

                    {/* Summary stats */}
                    <div className="mt-4 grid grid-cols-3 gap-2">
                        <div className="rounded-xl bg-emerald-50 p-2.5 text-center dark:bg-emerald-950/30">
                            <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">{totalWaste.toFixed(0)}</p>
                            <p className="text-[9px] font-medium text-emerald-600/70 dark:text-emerald-400/70">kg total</p>
                        </div>
                        <div className="rounded-xl bg-blue-50 p-2.5 text-center dark:bg-blue-950/30">
                            <p className="text-lg font-bold text-blue-700 dark:text-blue-400">{totalReports}</p>
                            <p className="text-[9px] font-medium text-blue-600/70 dark:text-blue-400/70">collections</p>
                        </div>
                        <div className="rounded-xl bg-red-50 p-2.5 text-center dark:bg-red-950/30">
                            <p className="text-lg font-bold text-red-700 dark:text-red-400">{totalMissed}</p>
                            <p className="text-[9px] font-medium text-red-600/70 dark:text-red-400/70">missed</p>
                        </div>
                    </div>

                    {/* Toggle */}
                    <div className="mt-4 flex items-center gap-2">
                        <button onClick={() => setShowMissed(!showMissed)}
                            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all ${showMissed ? 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400' : 'bg-neutral-100 text-neutral-400 dark:bg-neutral-800'}`}>
                            <AlertTriangle size={11} /> Missed pickups {showMissed ? 'ON' : 'OFF'}
                        </button>
                    </div>

                    {/* Legend */}
                    <div className="mt-3 flex items-center gap-2 text-[10px] font-medium text-neutral-400">
                        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Low</span>
                        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-yellow-500" /> Medium</span>
                        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-orange-500" /> High</span>
                        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-red-500" /> Critical</span>
                    </div>

                    {/* Selected zone detail */}
                    <AnimatePresence>
                        {selectedZone && (
                            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                                className="mt-4 overflow-hidden rounded-2xl border border-emerald-200/60 bg-emerald-50/50 dark:border-emerald-800/30 dark:bg-emerald-950/20">
                                <div className="flex items-center justify-between border-b border-emerald-200/40 px-4 py-3 dark:border-emerald-800/20">
                                    <div>
                                        <p className="text-sm font-bold text-neutral-900 dark:text-white">{selectedZone.name}</p>
                                        <p className="text-[11px] text-neutral-400">{selectedZone.barangays}</p>
                                    </div>
                                    <button onClick={() => setSelectedZone(null)} className="text-xs font-medium text-neutral-400 hover:text-red-500">Close</button>
                                </div>
                                <div className="space-y-2 p-4">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-neutral-500">Total waste</span>
                                        <span className="font-bold text-neutral-900 dark:text-white">{selectedZone.total_waste} kg</span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-neutral-500">Collections</span>
                                        <span className="font-bold text-neutral-900 dark:text-white">{selectedZone.report_count}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-neutral-500">Missed pickups</span>
                                        <span className="font-bold text-red-600 dark:text-red-400">{selectedZone.missed_count}</span>
                                    </div>
                                    {/* Waste breakdown */}
                                    {selectedZone.breakdown.length > 0 && (
                                        <div className="mt-2 space-y-1.5 border-t border-emerald-200/40 pt-3 dark:border-emerald-800/20">
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Breakdown</p>
                                            {selectedZone.breakdown.map((b) => {
                                                const Icon = wasteIcons[b.name as keyof typeof wasteIcons] ?? Package;
                                                const total = selectedZone.breakdown.reduce((s, x) => s + x.value, 0) || 1;
                                                return (
                                                    <div key={b.name} className="flex items-center gap-2">
                                                        <Icon size={12} style={{ color: b.color }} />
                                                        <span className="flex-1 text-[11px] text-neutral-600 dark:text-neutral-400">{b.name}</span>
                                                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-neutral-200/50 dark:bg-neutral-700/50">
                                                            <div className="h-full rounded-full" style={{ width: `${(b.value / total) * 100}%`, backgroundColor: b.color }} />
                                                        </div>
                                                        <span className="w-14 text-right text-[11px] font-semibold text-neutral-700 dark:text-neutral-300">{b.value} kg</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Zone list */}
                    <div className="mt-4 space-y-2">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Zones by waste volume</p>
                        {sortedZones.map((z, i) => (
                            <motion.button key={z.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }}
                                onClick={() => setSelectedZone(selectedZone?.id === z.id ? null : z)}
                                className={`w-full overflow-hidden rounded-xl border text-left transition-all ${selectedZone?.id === z.id ? 'border-emerald-300 ring-1 ring-emerald-200 dark:border-emerald-700 dark:ring-emerald-800' : `border-neutral-100 dark:border-neutral-800 ${intensityBg(z.intensity)}`}`}>
                                <div className="flex items-center gap-3 p-3">
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: intensityHex(z.intensity) + '20' }}>
                                        <TrendingUp size={14} style={{ color: intensityHex(z.intensity) }} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center justify-between">
                                            <p className="truncate text-xs font-semibold text-neutral-900 dark:text-white">{z.name}</p>
                                            <span className="ml-2 shrink-0 text-xs font-bold" style={{ color: intensityHex(z.intensity) }}>{z.total_waste} kg</span>
                                        </div>
                                        <div className="mt-1 h-1 overflow-hidden rounded-full bg-neutral-200/50 dark:bg-neutral-700/50">
                                            <div className={`h-full rounded-full bg-gradient-to-r ${intensityColor(z.intensity)}`} style={{ width: `${Math.max(z.intensity * 100, 3)}%` }} />
                                        </div>
                                    </div>
                                </div>
                            </motion.button>
                        ))}
                        {zones.length === 0 && (
                            <div className="py-8 text-center text-xs text-neutral-400">No data available</div>
                        )}
                    </div>
                </div>

                {/* Map */}
                <div className="flex-1">
                    <APIProvider apiKey={mapsApiKey} libraries={['visualization']}>
                        <Map mapId="smartwaste-heatmap" defaultCenter={center} defaultZoom={13} gestureHandling="greedy" style={{ width: '100%', height: '100%' }}>
                            <TuyBoundary />

                            {/* Google Maps Heatmap Layer */}
                            <WasteHeatmapLayer points={heatmapPoints} />

                            {/* Missed pickup markers */}
                            {showMissed && missedMarkers.map((m) => (
                                <AdvancedMarker key={m.id} position={{ lat: m.lat, lng: m.lng }}>
                                    <div className="group relative">
                                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-white shadow-lg ring-2 ring-white transition-transform group-hover:scale-110">
                                            <AlertTriangle size={13} />
                                        </div>
                                    </div>
                                </AdvancedMarker>
                            ))}
                        </Map>
                    </APIProvider>
                </div>
            </div>
        </AdminLayout>
    );
}
