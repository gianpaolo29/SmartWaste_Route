import { Head } from '@inertiajs/react';
import { AlertTriangle, Scale, Recycle, Leaf, Trash2, Package, Flame, TrendingUp, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useEffect } from 'react';
import { APIProvider, Map, AdvancedMarker, useMap } from '@vis.gl/react-google-maps';
import AdminLayout from '@/layouts/admin-layout';
import { TuyBoundary } from '@/components/tuy-boundary';
import type { BreadcrumbItem } from '@/types';

type BreakdownItem = { name: string; value: number; color: string };
type BarangayData = {
    id: number;
    name: string;
    total_waste: number;
    report_count: number;
    missed_count: number;
    intensity: number;
    breakdown: BreakdownItem[];
};
type MissedMarker = { id: number; lat: number; lng: number; description: string; status: string };
type HeatmapPoint = { lat: number; lng: number; weight: number };

type Props = {
    barangays: BarangayData[];
    missedMarkers: MissedMarker[];
    heatmapPoints: HeatmapPoint[];
    mapsApiKey: string;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/admin/dashboard' },
    { title: 'Waste Heatmap', href: '/admin/analytics/zone-heatmap' },
];

function intensityColor(i: number): string {
    if (i < 0.25) return 'from-emerald-500 to-emerald-600';
    if (i < 0.5) return 'from-yellow-500 to-amber-500';
    if (i < 0.75) return 'from-orange-500 to-orange-600';
    return 'from-red-500 to-red-600';
}
function intensityBg(i: number): string {
    if (i < 0.25) return 'bg-emerald-50 dark:bg-emerald-950/30';
    if (i < 0.5) return 'bg-yellow-50 dark:bg-yellow-950/30';
    if (i < 0.75) return 'bg-orange-50 dark:bg-orange-950/30';
    return 'bg-red-50 dark:bg-red-950/30';
}
function intensityHex(i: number): string {
    if (i < 0.25) return '#10b981';
    if (i < 0.5) return '#eab308';
    if (i < 0.75) return '#f97316';
    return '#ef4444';
}

/* Blurred dots heatmap */
function HeatmapDots({ points }: { points: HeatmapPoint[] }) {
    const maxWeight = Math.max(...points.map((p) => p.weight), 1);
    return (
        <>
            {points.filter((p) => p.weight > 0).map((p, i) => {
                const intensity = p.weight / maxWeight;
                const size = 40 + intensity * 60;
                const rgb = intensity < 0.25 ? '16,185,129' : intensity < 0.5 ? '234,179,8' : intensity < 0.75 ? '249,115,22' : '239,68,68';
                return (
                    <AdvancedMarker key={i} position={{ lat: p.lat, lng: p.lng }}>
                        <div style={{
                            width: size, height: size, borderRadius: '50%', pointerEvents: 'none',
                            background: `radial-gradient(circle, rgba(${rgb},${0.5 + intensity * 0.3}) 0%, rgba(${rgb},0.1) 55%, rgba(${rgb},0) 100%)`,
                            filter: `blur(${6 + intensity * 10}px)`,
                            transform: 'translate(-50%, -50%)',
                        }} />
                    </AdvancedMarker>
                );
            })}
        </>
    );
}

const wasteIcons: Record<string, typeof Package> = { Mixed: Package, Biodegradable: Leaf, Recyclable: Recycle, Residual: Trash2, Solid: Flame };

export default function WasteHeatmap({ barangays, missedMarkers, heatmapPoints, mapsApiKey }: Props) {
    const center = { lat: 13.9333, lng: 120.7333 };
    const sorted = [...barangays].sort((a, b) => b.total_waste - a.total_waste);
    const [selected, setSelected] = useState<BarangayData | null>(null);
    const [showMissed, setShowMissed] = useState(true);

    const totalWaste = barangays.reduce((s, b) => s + b.total_waste, 0);
    const totalReports = barangays.reduce((s, b) => s + b.report_count, 0);
    const totalMissed = barangays.reduce((s, b) => s + b.missed_count, 0);

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Waste Heatmap" />
            <div className="flex h-[calc(100vh-57px)] flex-col lg:flex-row">
                {/* Side panel */}
                <div className="w-full overflow-y-auto border-b border-neutral-200/50 bg-white p-4 lg:w-[400px] lg:border-b-0 lg:border-r dark:border-neutral-800 dark:bg-neutral-900">
                    <h1 className="text-lg font-bold tracking-tight text-neutral-900 dark:text-white">Waste Heatmap</h1>
                    <p className="mt-0.5 text-xs text-neutral-400">Waste volume by barangay</p>

                    {/* Summary */}
                    <div className="mt-4 grid grid-cols-3 gap-2">
                        <div className="rounded-xl bg-emerald-50 p-2.5 text-center dark:bg-emerald-950/30">
                            <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">{totalWaste.toFixed(0)}</p>
                            <p className="text-[9px] font-medium text-emerald-600/70">kg total</p>
                        </div>
                        <div className="rounded-xl bg-blue-50 p-2.5 text-center dark:bg-blue-950/30">
                            <p className="text-lg font-bold text-blue-700 dark:text-blue-400">{totalReports}</p>
                            <p className="text-[9px] font-medium text-blue-600/70">collections</p>
                        </div>
                        <div className="rounded-xl bg-red-50 p-2.5 text-center dark:bg-red-950/30">
                            <p className="text-lg font-bold text-red-700 dark:text-red-400">{totalMissed}</p>
                            <p className="text-[9px] font-medium text-red-600/70">missed</p>
                        </div>
                    </div>

                    {/* Toggle + Legend */}
                    <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-[10px] font-medium text-neutral-400">
                            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" />Low</span>
                            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-yellow-500" />Med</span>
                            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-orange-500" />High</span>
                            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500" />Critical</span>
                        </div>
                        <button onClick={() => setShowMissed(!showMissed)}
                            className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-semibold transition-all ${showMissed ? 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400' : 'bg-neutral-100 text-neutral-400 dark:bg-neutral-800'}`}>
                            <AlertTriangle size={10} /> {showMissed ? 'ON' : 'OFF'}
                        </button>
                    </div>

                    {/* Selected detail */}
                    <AnimatePresence>
                        {selected && (
                            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                                className="mt-4 overflow-hidden rounded-2xl border border-emerald-200/60 bg-emerald-50/50 dark:border-emerald-800/30 dark:bg-emerald-950/20">
                                <div className="flex items-center justify-between border-b border-emerald-200/40 px-4 py-3 dark:border-emerald-800/20">
                                    <p className="text-sm font-bold text-neutral-900 dark:text-white">{selected.name}</p>
                                    <button onClick={() => setSelected(null)} className="text-xs text-neutral-400 hover:text-red-500">Close</button>
                                </div>
                                <div className="space-y-2 p-4">
                                    <div className="flex justify-between text-xs"><span className="text-neutral-500">Total waste</span><span className="font-bold text-neutral-900 dark:text-white">{selected.total_waste} kg</span></div>
                                    <div className="flex justify-between text-xs"><span className="text-neutral-500">Collections</span><span className="font-bold">{selected.report_count}</span></div>
                                    <div className="flex justify-between text-xs"><span className="text-neutral-500">Missed</span><span className="font-bold text-red-600 dark:text-red-400">{selected.missed_count}</span></div>
                                    {selected.breakdown.length > 0 && (
                                        <div className="space-y-1.5 border-t border-emerald-200/40 pt-3 dark:border-emerald-800/20">
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Breakdown</p>
                                            {selected.breakdown.map((b) => {
                                                const Icon = wasteIcons[b.name] ?? Package;
                                                const total = selected.breakdown.reduce((s, x) => s + x.value, 0) || 1;
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

                    {/* Barangay list */}
                    <div className="mt-4 space-y-1.5">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Barangays by waste volume</p>
                        {sorted.map((b, i) => (
                            <motion.button key={b.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }}
                                onClick={() => setSelected(selected?.id === b.id ? null : b)}
                                className={`w-full rounded-xl border p-2.5 text-left transition-all ${selected?.id === b.id ? 'border-emerald-300 ring-1 ring-emerald-200 dark:border-emerald-700' : `border-neutral-100 dark:border-neutral-800 ${intensityBg(b.intensity)}`}`}>
                                <div className="flex items-center gap-2.5">
                                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: intensityHex(b.intensity) + '20' }}>
                                        <MapPin size={12} style={{ color: intensityHex(b.intensity) }} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center justify-between">
                                            <p className="truncate text-xs font-semibold text-neutral-900 dark:text-white">{b.name}</p>
                                            <span className="ml-1 shrink-0 text-[11px] font-bold" style={{ color: intensityHex(b.intensity) }}>{b.total_waste} kg</span>
                                        </div>
                                        <div className="mt-1 h-1 overflow-hidden rounded-full bg-neutral-200/50 dark:bg-neutral-700/50">
                                            <div className={`h-full rounded-full bg-gradient-to-r ${intensityColor(b.intensity)}`} style={{ width: `${Math.max(b.intensity * 100, 3)}%` }} />
                                        </div>
                                    </div>
                                </div>
                            </motion.button>
                        ))}
                        {barangays.length === 0 && <div className="py-8 text-center text-xs text-neutral-400">No data</div>}
                    </div>
                </div>

                {/* Map */}
                <div className="flex-1">
                    <APIProvider apiKey={mapsApiKey}>
                        <Map mapId="smartwaste-heatmap" defaultCenter={center} defaultZoom={13} gestureHandling="greedy" style={{ width: '100%', height: '100%' }}>
                            <TuyBoundary />
                            <HeatmapDots points={heatmapPoints} />
                            {showMissed && missedMarkers.map((m) => (
                                <AdvancedMarker key={m.id} position={{ lat: m.lat, lng: m.lng }}>
                                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white shadow-lg ring-2 ring-white">
                                        <AlertTriangle size={11} />
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
