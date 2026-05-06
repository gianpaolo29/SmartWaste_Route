import { Head } from '@inertiajs/react';
import { Truck, Radio, MapPin, Clock, CheckCircle2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { APIProvider, Map, AdvancedMarker, useMap } from '@vis.gl/react-google-maps';
import AdminLayout from '@/layouts/admin-layout';
import { TuyBoundary } from '@/components/tuy-boundary';
import type { BreadcrumbItem } from '@/types';

type ActiveRoute = {
    id: number;
    collector: string;
    zone: string;
    truck_plate: string;
    lat: number | null;
    lng: number | null;
    location_updated_at: string | null;
    started_at: string | null;
    total_stops: number;
    completed_stops: number;
};

type Props = {
    mapsApiKey: string;
    initialData: { routes: ActiveRoute[] };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/admin/dashboard' },
    { title: 'Live Fleet', href: '/admin/analytics/fleet' },
];

function timeAgo(iso: string | null): string {
    if (!iso) return 'No signal';
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (diff < 10) return 'Just now';
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
}

function TruckMarker({ route, selected, onClick }: { route: ActiveRoute; selected: boolean; onClick: () => void }) {
    if (!route.lat || !route.lng) return null;
    const progress = route.total_stops > 0 ? Math.round((route.completed_stops / route.total_stops) * 100) : 0;

    return (
        <AdvancedMarker position={{ lat: route.lat, lng: route.lng }} zIndex={selected ? 999 : 1} onClick={onClick}>
            <div className="relative flex flex-col items-center">
                {/* Label */}
                <div className={`mb-1 whitespace-nowrap rounded-lg px-2 py-1 text-[10px] font-bold shadow-lg ${selected ? 'bg-blue-600 text-white' : 'bg-white text-neutral-800 dark:bg-neutral-800 dark:text-white'}`}>
                    {route.collector} · {progress}%
                </div>
                {/* Marker */}
                <div className="relative">
                    {selected && <span className="absolute -inset-2 animate-ping rounded-full bg-blue-500/20" style={{ animationDuration: '2s' }} />}
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full border-[3px] border-white shadow-xl ${selected ? 'bg-blue-600' : 'bg-emerald-600'}`}>
                        <Truck size={16} className="text-white" />
                    </div>
                </div>
            </div>
        </AdvancedMarker>
    );
}

function MapFitter({ routes, selectedId }: { routes: ActiveRoute[]; selectedId: number | null }) {
    const map = useMap();
    const fittedRef = useRef(false);

    useEffect(() => {
        if (!map || fittedRef.current) return;
        const withGps = routes.filter((r) => r.lat && r.lng);
        if (withGps.length === 0) return;
        fittedRef.current = true;

        if (withGps.length === 1) {
            map.panTo({ lat: withGps[0].lat!, lng: withGps[0].lng! });
            map.setZoom(15);
        } else {
            const bounds = new google.maps.LatLngBounds();
            withGps.forEach((r) => bounds.extend({ lat: r.lat!, lng: r.lng! }));
            map.fitBounds(bounds, { top: 60, bottom: 60, left: 40, right: 40 });
        }
    }, [map, routes]);

    // Pan to selected
    useEffect(() => {
        if (!map || !selectedId) return;
        const r = routes.find((r) => r.id === selectedId);
        if (r?.lat && r.lng) {
            map.panTo({ lat: r.lat, lng: r.lng });
            map.setZoom(16);
        }
    }, [map, selectedId, routes]);

    return null;
}

export default function LiveFleet({ mapsApiKey, initialData }: Props) {
    const [routes, setRoutes] = useState<ActiveRoute[]>(initialData.routes);
    const [selectedId, setSelectedId] = useState<number | null>(null);

    // Poll every 4 seconds
    useEffect(() => {
        const tick = async () => {
            try {
                const res = await fetch('/admin/analytics/fleet/data', { headers: { Accept: 'application/json' }, credentials: 'include' });
                if (res.ok) {
                    const data = await res.json();
                    setRoutes(data.routes ?? []);
                }
            } catch { /* ignore */ }
        };
        const id = setInterval(tick, 4000);
        return () => clearInterval(id);
    }, []);

    const activeCount = routes.filter((r) => r.lat && r.lng).length;

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Live Fleet" />
            <div className="flex h-[calc(100vh-57px)] flex-col lg:flex-row">
                {/* Side panel */}
                <div className="w-full overflow-y-auto border-b border-neutral-200/50 bg-white p-4 lg:w-[380px] lg:border-b-0 lg:border-r dark:border-neutral-800 dark:bg-neutral-900">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-lg font-bold tracking-tight text-neutral-900 dark:text-white">Live Fleet</h1>
                            <p className="mt-0.5 text-xs text-neutral-400">Real-time collector tracking</p>
                        </div>
                        <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 dark:bg-emerald-950/40">
                            <span className="relative flex h-2 w-2">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-600" />
                            </span>
                            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">{activeCount} active</span>
                        </div>
                    </div>

                    <div className="mt-4 space-y-2">
                        {routes.length === 0 ? (
                            <div className="py-10 text-center">
                                <Radio size={28} className="mx-auto text-neutral-300 dark:text-neutral-600" />
                                <p className="mt-3 text-sm font-medium text-neutral-400">No active routes</p>
                                <p className="mt-1 text-xs text-neutral-300 dark:text-neutral-600">Routes will appear here when collectors start tracking</p>
                            </div>
                        ) : (
                            routes.map((r, i) => {
                                const progress = r.total_stops > 0 ? Math.round((r.completed_stops / r.total_stops) * 100) : 0;
                                const isSelected = selectedId === r.id;
                                return (
                                    <motion.button
                                        key={r.id}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.03 }}
                                        onClick={() => setSelectedId(isSelected ? null : r.id)}
                                        className={`w-full overflow-hidden rounded-2xl border text-left transition-all ${isSelected ? 'border-blue-300 bg-blue-50 ring-1 ring-blue-200 dark:border-blue-700 dark:bg-blue-950/30 dark:ring-blue-800' : 'border-neutral-100 bg-white hover:border-neutral-200 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700'}`}
                                    >
                                        <div className="p-3.5">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2.5">
                                                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${isSelected ? 'bg-blue-500' : 'bg-emerald-500'} text-white shadow-md`}>
                                                        <Truck size={15} />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-neutral-900 dark:text-white">{r.collector}</p>
                                                        <p className="text-[11px] text-neutral-400">{r.zone} · {r.truck_plate}</p>
                                                    </div>
                                                </div>
                                                <span className="text-[10px] font-medium text-neutral-400">{timeAgo(r.location_updated_at)}</span>
                                            </div>

                                            {/* Progress */}
                                            <div className="mt-3">
                                                <div className="flex items-center justify-between text-[11px]">
                                                    <span className="flex items-center gap-1 text-neutral-400">
                                                        <CheckCircle2 size={11} /> {r.completed_stops}/{r.total_stops} stops
                                                    </span>
                                                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{progress}%</span>
                                                </div>
                                                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-neutral-200/50 dark:bg-neutral-700">
                                                    <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500" style={{ width: `${progress}%` }} />
                                                </div>
                                            </div>

                                            {r.started_at && (
                                                <div className="mt-2 flex items-center gap-1 text-[10px] text-neutral-400">
                                                    <Clock size={10} /> Started {r.started_at}
                                                </div>
                                            )}

                                            {!r.lat && (
                                                <div className="mt-2 flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-1 text-[10px] font-medium text-amber-600 dark:bg-amber-950/30 dark:text-amber-400">
                                                    <MapPin size={10} /> No GPS signal
                                                </div>
                                            )}
                                        </div>
                                    </motion.button>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Map */}
                <div className="flex-1">
                    <APIProvider apiKey={mapsApiKey}>
                        <Map mapId="smartwaste-fleet" defaultCenter={{ lat: 13.9333, lng: 120.7333 }} defaultZoom={13} gestureHandling="greedy" style={{ width: '100%', height: '100%' }}>
                            <TuyBoundary />
                            <MapFitter routes={routes} selectedId={selectedId} />
                            {routes.map((r) => (
                                <TruckMarker key={r.id} route={r} selected={selectedId === r.id} onClick={() => setSelectedId(selectedId === r.id ? null : r.id)} />
                            ))}
                        </Map>
                    </APIProvider>
                </div>
            </div>
        </AdminLayout>
    );
}
