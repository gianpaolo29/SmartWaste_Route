import { Head } from '@inertiajs/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    APIProvider,
    Map,
    AdvancedMarker,
    useMap,
} from '@vis.gl/react-google-maps';
import { Truck, MapPin, User, CalendarDays, Activity, Navigation, Clock, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TuyBoundary } from '@/components/tuy-boundary';
import AdminLayout from '@/layouts/admin-layout';
import type { BreadcrumbItem } from '@/types';

type Stop = {
    id: number;
    stop_no: number;
    stop_address: string | null;
    lat: number;
    lng: number;
    collection_status?: string | null;
};

type Plan = {
    id: number;
    route_date: string | null;
    status: string;
    zone: { id: number; name: string; barangay: string | null } | null;
    collector: { id: number; name: string } | null;
    stops: Stop[];
};

/* ── RouteLine: full collection route (requested once) ── */
function RouteLine({ stops }: { stops: Stop[] }) {
    const map = useMap();
    const rendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
    const requestedRef = useRef(false);

    useEffect(() => {
        if (!map || stops.length < 2 || requestedRef.current) return;

        rendererRef.current = new google.maps.DirectionsRenderer({
            map,
            suppressMarkers: true,
            preserveViewport: true,
            polylineOptions: { strokeColor: '#059669', strokeWeight: 5, strokeOpacity: 0.5 },
        });

        requestedRef.current = true;
        const service = new google.maps.DirectionsService();
        service.route(
            {
                origin: { lat: stops[0].lat, lng: stops[0].lng },
                destination: { lat: stops[stops.length - 1].lat, lng: stops[stops.length - 1].lng },
                waypoints: stops.slice(1, -1).map((s) => ({
                    location: { lat: s.lat, lng: s.lng },
                    stopover: true,
                })),
                travelMode: google.maps.TravelMode.DRIVING,
            },
            (result, status) => {
                if (status === 'OK' && result && rendererRef.current) {
                    rendererRef.current.setDirections(result);
                }
            },
        );

        return () => {
            rendererRef.current?.setMap(null);
            rendererRef.current = null;
            requestedRef.current = false;
        };
    }, [map, stops]);

    return null;
}

/* ── DirectionLine: road-following line from truck to next stop (throttled) ── */
function DirectionLine({ from, to, onRouteInfo }: {
    from: { lat: number; lng: number };
    to: { lat: number; lng: number };
    onRouteInfo?: (info: { distance: number; duration: number; summary: string }) => void;
}) {
    const map = useMap();
    const rendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
    const lastFromRef = useRef<{ lat: number; lng: number } | null>(null);
    const lastToRef = useRef<{ lat: number; lng: number } | null>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const requestRoute = useCallback(() => {
        if (!map) return;

        if (!rendererRef.current) {
            rendererRef.current = new google.maps.DirectionsRenderer({
                map,
                suppressMarkers: true,
                preserveViewport: true,
                polylineOptions: {
                    strokeColor: '#2563eb',
                    strokeWeight: 5,
                    strokeOpacity: 0.6,
                    zIndex: 5,
                },
            });
        }

        const service = new google.maps.DirectionsService();
        service.route(
            { origin: from, destination: to, travelMode: google.maps.TravelMode.DRIVING },
            (result, status) => {
                if (status === 'OK' && result && rendererRef.current) {
                    rendererRef.current.setDirections(result);
                    const leg = result.routes[0]?.legs[0];
                    if (leg && onRouteInfo) {
                        onRouteInfo({
                            distance: leg.distance?.value ?? 0,
                            duration: leg.duration?.value ?? 0,
                            summary: leg.duration?.text ?? '',
                        });
                    }
                }
            },
        );
        lastFromRef.current = from;
        lastToRef.current = to;
    }, [map, from, to, onRouteInfo]);

    useEffect(() => {
        if (!map) return;
        const targetChanged = !lastToRef.current || lastToRef.current.lat !== to.lat || lastToRef.current.lng !== to.lng;
        let truckMovedEnough = !lastFromRef.current;
        if (lastFromRef.current) {
            const d = haversine(lastFromRef.current, from);
            truckMovedEnough = d > 30;
        }
        if (targetChanged || truckMovedEnough) {
            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = setTimeout(requestRoute, targetChanged ? 0 : 800);
        }
        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }, [map, from.lat, from.lng, to.lat, to.lng, requestRoute]);

    useEffect(() => {
        return () => { rendererRef.current?.setMap(null); rendererRef.current = null; };
    }, []);

    return null;
}

/* ── MapFocus: smoothly pans map to keep truck + next stop in view ── */
function MapFocus({ target, nextStop }: { target: { lat: number; lng: number }; nextStop: { lat: number; lng: number } | null }) {
    const map = useMap();
    const lastPanRef = useRef<number>(0);

    useEffect(() => {
        if (!map) return;
        const now = Date.now();
        if (now - lastPanRef.current < 5000) return;
        lastPanRef.current = now;

        if (nextStop) {
            const bounds = new google.maps.LatLngBounds();
            bounds.extend(target);
            bounds.extend(nextStop);
            map.fitBounds(bounds, { top: 80, bottom: 120, left: 40, right: 40 });
        } else {
            map.panTo(target);
        }
    }, [map, target.lat, target.lng, nextStop]);

    return null;
}

/* ── Helpers ── */
function haversine(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
    const R = 6371000;
    const dLat = ((b.lat - a.lat) * Math.PI) / 180;
    const dLng = ((b.lng - a.lng) * Math.PI) / 180;
    const sinLat = Math.sin(dLat / 2);
    const sinLng = Math.sin(dLng / 2);
    const h = sinLat * sinLat + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * sinLng * sinLng;
    return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function formatDistance(meters: number) {
    if (meters < 1000) return `${Math.round(meters)}m`;
    return `${(meters / 1000).toFixed(1)}km`;
}

/* ── Smooth position tween for truck animation ── */
function useSmoothPosition(target: { lat: number; lng: number } | null) {
    const [pos, setPos] = useState<{ lat: number; lng: number } | null>(null);
    const [heading, setHeading] = useState(0);
    const fromRef = useRef<{ lat: number; lng: number } | null>(null);
    const toRef = useRef<{ lat: number; lng: number } | null>(null);
    const startRef = useRef<number>(0);
    const rafRef = useRef<number | null>(null);

    useEffect(() => {
        if (!target) return;
        if (!pos) {
            setPos(target);
            fromRef.current = target;
            toRef.current = target;
            return;
        }
        fromRef.current = pos;
        toRef.current = target;
        startRef.current = performance.now();

        const dx = target.lng - pos.lng;
        const dy = target.lat - pos.lat;
        if (Math.abs(dx) + Math.abs(dy) > 1e-7) {
            setHeading(Math.atan2(dx, dy));
        }

        const duration = 3500;
        const step = (now: number) => {
            const elapsed = now - startRef.current;
            const t = Math.min(1, elapsed / duration);
            const e = 1 - Math.pow(1 - t, 3);
            const from = fromRef.current!;
            const to = toRef.current!;
            setPos({
                lat: from.lat + (to.lat - from.lat) * e,
                lng: from.lng + (to.lng - from.lng) * e,
            });
            if (t < 1) rafRef.current = requestAnimationFrame(step);
        };

        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(step);

        return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [target?.lat, target?.lng]);

    return { pos, heading };
}

/* ── Live location polling ── */
function useLiveLocation(routeId: number) {
    const [loc, setLoc] = useState<{ lat: number | null; lng: number | null; updated_at: string | null; status: string } | null>(null);

    useEffect(() => {
        let cancelled = false;
        const tick = async () => {
            try {
                const res = await fetch(`/admin/routes/${routeId}/location`, {
                    headers: { Accept: 'application/json' },
                });
                if (!res.ok) return;
                const body = await res.json();
                if (!cancelled) {
                    setLoc({
                        lat: body.lat ?? null,
                        lng: body.lng ?? null,
                        updated_at: body.updated_at,
                        status: body.status,
                    });
                }
            } catch { /* ignore */ }
        };
        tick();
        const id = setInterval(tick, 4000);
        return () => { cancelled = true; clearInterval(id); };
    }, [routeId]);

    return loc;
}

const statusConfig: Record<string, { label: string; color: string; bg: string; dot: string }> = {
    planned: { label: 'Planned', color: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-50 dark:bg-gray-800/30', dot: 'bg-gray-400' },
    in_progress: { label: 'In Progress', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20', dot: 'bg-blue-500 animate-pulse' },
    completed: { label: 'Completed', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20', dot: 'bg-emerald-500' },
};

/* ══════════════════════════════════════════════════ */
/*  Main component                                   */
/* ══════════════════════════════════════════════════ */
export default function ShowRoute({
    plan,
    mapsApiKey,
}: {
    plan: Plan;
    mapsApiKey: string;
}) {
    const live = useLiveLocation(plan.id);
    const hasGps = !!(live?.lat && live?.lng);
    const { pos: animatedPos, heading } = useSmoothPosition(
        hasGps ? { lat: live!.lat!, lng: live!.lng! } : null,
    );
    const currentStatus = live?.status ?? plan.status;
    const st = statusConfig[currentStatus] ?? statusConfig.planned;
    const isLive = currentStatus === 'in_progress';
    const [roadInfo, setRoadInfo] = useState<{ distance: number; duration: number; summary: string } | null>(null);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/admin/dashboard' },
        { title: 'Routes', href: '/admin/routes' },
        { title: `Route #${plan.id}`, href: `/admin/routes/${plan.id}` },
    ];

    const center = useMemo(() => {
        if (plan.stops.length === 0) return { lat: 13.9333, lng: 120.7333 };
        const lat = plan.stops.reduce((s, x) => s + x.lat, 0) / plan.stops.length;
        const lng = plan.stops.reduce((s, x) => s + x.lng, 0) / plan.stops.length;
        return { lat, lng };
    }, [plan.stops]);

    // Find next uncollected stop (mirrors collector logic)
    const nextStop = useMemo(() => {
        return plan.stops.find((s) => !s.collection_status) ?? null;
    }, [plan.stops]);

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title={`Route #${plan.id}`} />
            <div className="grid min-h-[calc(100vh-4rem)] grid-cols-1 lg:h-[calc(100vh-4rem)] lg:grid-cols-[380px_1fr]">
                {/* Sidebar */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4 }}
                    className="flex flex-col border-b border-gray-100 bg-white lg:border-b-0 lg:border-r dark:border-white/5 dark:bg-[#0a0a0a]"
                >
                    {/* Route header */}
                    <div className="border-b border-gray-50 p-5 dark:border-white/5">
                        <div className="flex items-center justify-between">
                            <h1 className="text-lg font-bold tracking-tight">Route #{plan.id}</h1>
                            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${st.bg} ${st.color}`}>
                                <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                                {st.label}
                            </span>
                        </div>

                        <div className="mt-4 space-y-2.5">
                            <div className="flex items-center gap-3 text-sm">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-50 dark:bg-white/5">
                                    <CalendarDays size={14} className="text-gray-400" />
                                </div>
                                <div>
                                    <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400">Date</p>
                                    <p className="font-medium">{plan.route_date ?? '—'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-50 dark:bg-white/5">
                                    <MapPin size={14} className="text-gray-400" />
                                </div>
                                <div>
                                    <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400">Zone</p>
                                    <p className="font-medium">
                                        {plan.zone ? `${plan.zone.name}` : '—'}
                                        {plan.zone?.barangay && <span className="ml-1 text-gray-400">({plan.zone.barangay})</span>}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-50 dark:bg-white/5">
                                    <User size={14} className="text-gray-400" />
                                </div>
                                <div>
                                    <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400">Collector</p>
                                    <p className="font-medium">{plan.collector?.name ?? 'Unassigned'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Live tracking indicator */}
                    <AnimatePresence>
                        {isLive && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="border-b border-gray-50 dark:border-white/5"
                            >
                                <div className="mx-5 my-3 overflow-hidden rounded-xl bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/15 dark:to-cyan-900/10">
                                    <div className="flex items-center gap-2 border-b border-blue-100/50 px-4 py-2.5 dark:border-blue-800/20">
                                        <span className="relative flex h-2 w-2">
                                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-500 opacity-75" />
                                            <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-600" />
                                        </span>
                                        <span className="text-xs font-bold text-blue-700 dark:text-blue-300">LIVE TRACKING</span>
                                    </div>
                                    <div className="px-4 py-2.5">
                                        {hasGps ? (
                                            <div className="space-y-1.5">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <Navigation size={12} className="text-blue-500" />
                                                        <span className="font-mono text-xs text-blue-700 dark:text-blue-300">
                                                            {live!.lat!.toFixed(5)}, {live!.lng!.toFixed(5)}
                                                        </span>
                                                    </div>
                                                    {live!.updated_at && (
                                                        <span className="flex items-center gap-1 text-[11px] text-blue-400">
                                                            <Clock size={10} />
                                                            {new Date(live!.updated_at).toLocaleTimeString()}
                                                        </span>
                                                    )}
                                                </div>
                                                {roadInfo && nextStop && (
                                                    <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-300">
                                                        <MapPin size={10} />
                                                        <span className="font-semibold">{formatDistance(roadInfo.distance)}</span>
                                                        <span className="text-blue-400">to Stop #{nextStop.stop_no}</span>
                                                        <span className="text-blue-400">· {roadInfo.summary}</span>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <span className="h-3 w-3 animate-spin rounded-full border-2 border-blue-200 border-t-blue-500" />
                                                <span className="text-xs text-blue-600 dark:text-blue-300">Waiting for GPS signal...</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Stops list */}
                    <div className="flex items-center gap-2 border-b border-gray-50 px-5 py-3 dark:border-white/5">
                        <Activity size={14} className="text-emerald-600 dark:text-emerald-400" />
                        <span className="text-xs font-semibold tracking-tight">Collection Stops</span>
                        <span className="ml-auto rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400">
                            {plan.stops.length}
                        </span>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        <ol className="p-2">
                            {plan.stops.map((s, i) => {
                                const isDone = !!s.collection_status;
                                const isNext = nextStop?.id === s.id && isLive;

                                return (
                                    <li
                                        key={s.id}
                                        className={`group rounded-xl px-3 py-2.5 transition-colors ${
                                            isNext
                                                ? 'bg-blue-50 ring-1 ring-blue-200 dark:bg-blue-900/10 dark:ring-blue-800/30'
                                                : 'hover:bg-gray-50 dark:hover:bg-white/[0.02]'
                                        }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="relative flex flex-col items-center">
                                                <div className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-[11px] font-bold shadow-sm ${
                                                    isDone
                                                        ? 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                                                        : isNext
                                                        ? 'bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-blue-500/30'
                                                        : 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white'
                                                }`}>
                                                    {isDone ? <CheckCircle2 size={13} /> : s.stop_no}
                                                </div>
                                                {i < plan.stops.length - 1 && (
                                                    <div className={`mt-1 h-4 w-px ${isDone ? 'bg-gray-200 dark:bg-gray-700' : 'bg-emerald-200 dark:bg-emerald-800/30'}`} />
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1 pt-0.5">
                                                <div className="flex items-center justify-between gap-2">
                                                    <p className={`truncate text-sm font-medium ${isDone ? 'text-gray-400 line-through' : ''}`}>
                                                        {s.stop_address ?? 'No address'}
                                                    </p>
                                                    {isDone && s.collection_status && (
                                                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                                            s.collection_status === 'collected'
                                                                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'
                                                                : s.collection_status === 'failed'
                                                                ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                                                                : 'bg-gray-100 text-gray-500 dark:bg-gray-800/30 dark:text-gray-400'
                                                        }`}>
                                                            {s.collection_status}
                                                        </span>
                                                    )}
                                                    {isNext && (
                                                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                                                            <Navigation size={9} />
                                                            NEXT
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="mt-0.5 text-[11px] text-gray-400">
                                                    {s.lat.toFixed(5)}, {s.lng.toFixed(5)}
                                                </p>
                                            </div>
                                        </div>
                                    </li>
                                );
                            })}
                        </ol>
                    </div>
                </motion.div>

                {/* Map */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="relative h-[55vh] lg:h-auto"
                >
                    {mapsApiKey ? (
                        <APIProvider apiKey={mapsApiKey}>
                            <Map
                                mapId="smartwaste-route-map"
                                defaultCenter={center}
                                defaultZoom={14}
                                gestureHandling="greedy"
                                style={{ width: '100%', height: '100%' }}
                            >
                                <TuyBoundary />

                                {/* Stop markers — same as collector */}
                                {plan.stops.map((s) => {
                                    const isDone = !!s.collection_status;
                                    const isNext = nextStop?.id === s.id && isLive;
                                    return (
                                        <AdvancedMarker key={s.id} position={{ lat: s.lat, lng: s.lng }}>
                                            <div className="relative">
                                                <div className={`flex h-8 w-8 items-center justify-center rounded-xl text-xs font-bold shadow-lg ring-2 ring-white ${
                                                    isDone
                                                        ? s.collection_status === 'collected'
                                                            ? 'bg-emerald-500 text-white'
                                                            : s.collection_status === 'failed'
                                                            ? 'bg-red-500 text-white'
                                                            : 'bg-gray-400 text-white'
                                                        : isNext
                                                        ? 'bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-blue-500/40'
                                                        : 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-emerald-500/30'
                                                }`}>
                                                    {isDone ? <CheckCircle2 size={14} /> : s.stop_no}
                                                </div>
                                                <div className={`absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 ${
                                                    isDone
                                                        ? s.collection_status === 'collected' ? 'bg-emerald-500' : s.collection_status === 'failed' ? 'bg-red-500' : 'bg-gray-400'
                                                        : isNext ? 'bg-blue-700' : 'bg-teal-600'
                                                }`} />
                                                {isNext && (
                                                    <span className="absolute -right-1 -top-1 flex h-3 w-3">
                                                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-500 opacity-75" />
                                                        <span className="relative inline-flex h-3 w-3 rounded-full bg-blue-600" />
                                                    </span>
                                                )}
                                            </div>
                                        </AdvancedMarker>
                                    );
                                })}

                                {/* Truck marker — same as collector */}
                                {animatedPos && (
                                    <AdvancedMarker position={animatedPos} zIndex={9999} title="Collector">
                                        <div className="relative flex h-14 w-14 items-center justify-center">
                                            <span className="absolute h-14 w-14 animate-ping rounded-full bg-blue-500/15" style={{ animationDuration: '2s' }} />
                                            <div
                                                className="relative flex h-10 w-10 items-center justify-center rounded-full border-[3px] border-white bg-gradient-to-br from-blue-500 to-blue-700 shadow-xl shadow-blue-600/30"
                                                style={{ transform: `rotate(${heading}rad)` }}
                                            >
                                                <Truck size={16} className="text-white" style={{ transform: `rotate(${-heading}rad)` }} />
                                            </div>
                                        </div>
                                    </AdvancedMarker>
                                )}

                                {/* Road direction from truck to next stop */}
                                {animatedPos && nextStop && isLive && (
                                    <DirectionLine
                                        from={animatedPos}
                                        to={{ lat: nextStop.lat, lng: nextStop.lng }}
                                        onRouteInfo={setRoadInfo}
                                    />
                                )}

                                {/* Auto-focus map on truck + next stop */}
                                {animatedPos && isLive && (
                                    <MapFocus target={animatedPos} nextStop={nextStop ? { lat: nextStop.lat, lng: nextStop.lng } : null} />
                                )}

                                <RouteLine stops={plan.stops} />
                            </Map>
                        </APIProvider>
                    ) : (
                        <div className="flex h-full items-center justify-center">
                            <div className="text-center">
                                <MapPin size={36} className="mx-auto text-gray-200 dark:text-gray-700" />
                                <p className="mt-3 text-sm text-red-500">Google Maps API key not configured.</p>
                            </div>
                        </div>
                    )}

                    {/* Navigation overlay — same as collector */}
                    <AnimatePresence>
                        {isLive && hasGps && roadInfo && nextStop && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="absolute bottom-4 left-3 right-3 z-10 sm:bottom-6 sm:left-4 sm:right-auto"
                            >
                                <div className="flex items-center gap-3 rounded-2xl border border-white/50 bg-white/95 px-4 py-3 shadow-xl backdrop-blur-xl sm:min-w-[280px] dark:border-white/10 dark:bg-[#111]/95">
                                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 shadow-md shadow-blue-500/20">
                                        <Navigation size={18} className="text-white" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-baseline gap-2">
                                            <p className="text-lg font-bold tracking-tight">{formatDistance(roadInfo.distance)}</p>
                                            <span className="text-xs font-medium text-gray-400">{roadInfo.summary}</span>
                                        </div>
                                        <p className="truncate text-xs text-gray-500">
                                            To Stop #{nextStop.stop_no} — {nextStop.stop_address ?? 'No address'}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Live status overlay */}
                    <AnimatePresence>
                        {isLive && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="absolute left-3 top-3 z-10 sm:left-4 sm:top-4"
                            >
                                <div className="flex items-center gap-2 rounded-xl border border-blue-200/50 bg-white/90 px-3 py-2 shadow-lg backdrop-blur-xl dark:border-blue-800/30 dark:bg-[#111]/90">
                                    <span className="relative flex h-2 w-2">
                                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-500 opacity-75" />
                                        <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-600" />
                                    </span>
                                    <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300">
                                        <Truck size={11} className="mr-1 inline" />
                                        TRACKING
                                    </span>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>
        </AdminLayout>
    );
}
