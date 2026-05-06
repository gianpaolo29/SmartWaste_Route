import { Head } from '@inertiajs/react';
import { MapPin, AlertTriangle, Scale, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';
import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps';
import AdminLayout from '@/layouts/admin-layout';
import { TuyBoundary } from '@/components/tuy-boundary';
import type { BreadcrumbItem } from '@/types';

type ZoneData = {
    id: number;
    name: string;
    barangays: string;
    total_waste: number;
    report_count: number;
    missed_count: number;
    intensity: number; // 0-1
};

type MissedMarker = { id: number; lat: number; lng: number; description: string; status: string };

type Props = {
    zones: ZoneData[];
    missedMarkers: MissedMarker[];
    mapsApiKey: string;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/admin/dashboard' },
    { title: 'Zone Heatmap', href: '/admin/analytics/zone-heatmap' },
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

export default function ZoneHeatmap({ zones, missedMarkers, mapsApiKey }: Props) {
    const center = { lat: 13.9333, lng: 120.7333 };
    const sortedZones = [...zones].sort((a, b) => b.total_waste - a.total_waste);

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Zone Heatmap" />
            <div className="flex h-[calc(100vh-57px)] flex-col lg:flex-row">
                {/* Side panel */}
                <div className="w-full overflow-y-auto border-b border-neutral-200/50 bg-white p-4 lg:w-[380px] lg:border-b-0 lg:border-r dark:border-neutral-800 dark:bg-neutral-900">
                    <h1 className="text-lg font-bold tracking-tight text-neutral-900 dark:text-white">Zone Heatmap</h1>
                    <p className="mt-0.5 text-xs text-neutral-400">Waste density by zone</p>

                    {/* Legend */}
                    <div className="mt-4 flex items-center gap-2 text-[10px] font-medium text-neutral-400">
                        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Low</span>
                        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-yellow-500" /> Medium</span>
                        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-orange-500" /> High</span>
                        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-red-500" /> Critical</span>
                    </div>

                    {/* Zone cards */}
                    <div className="mt-4 space-y-2">
                        {sortedZones.map((z, i) => (
                            <motion.div key={z.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                                className={`overflow-hidden rounded-xl border border-neutral-100 dark:border-neutral-800 ${intensityBg(z.intensity)}`}>
                                <div className="p-3">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-semibold text-neutral-900 dark:text-white">{z.name}</p>
                                        <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">{z.total_waste} kg</span>
                                    </div>
                                    <p className="mt-0.5 text-[11px] text-neutral-400">{z.barangays || '—'}</p>
                                    <div className="mt-2 flex items-center gap-3 text-[10px] text-neutral-500">
                                        <span className="flex items-center gap-1"><Scale size={10} /> {z.report_count} reports</span>
                                        {z.missed_count > 0 && (
                                            <span className="flex items-center gap-1 text-red-500"><AlertTriangle size={10} /> {z.missed_count} missed</span>
                                        )}
                                    </div>
                                    {/* Intensity bar */}
                                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-neutral-200/50 dark:bg-neutral-700/50">
                                        <div className={`h-full rounded-full bg-gradient-to-r ${intensityColor(z.intensity)}`} style={{ width: `${Math.max(z.intensity * 100, 5)}%` }} />
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                        {zones.length === 0 && (
                            <div className="py-8 text-center text-xs text-neutral-400">No zone data available</div>
                        )}
                    </div>
                </div>

                {/* Map */}
                <div className="flex-1">
                    <APIProvider apiKey={mapsApiKey}>
                        <Map mapId="smartwaste-heatmap" defaultCenter={center} defaultZoom={13} gestureHandling="greedy" style={{ width: '100%', height: '100%' }}>
                            <TuyBoundary />

                            {/* Missed pickup markers */}
                            {missedMarkers.map((m) => (
                                <AdvancedMarker key={m.id} position={{ lat: m.lat, lng: m.lng }}>
                                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-white shadow-lg ring-2 ring-white">
                                        <AlertTriangle size={13} />
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
