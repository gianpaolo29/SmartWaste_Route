import { Head, router } from '@inertiajs/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    APIProvider,
    Map,
    AdvancedMarker,
    useMap,
} from '@vis.gl/react-google-maps';
import { Truck, Navigation, MapPin, CheckCircle2, SkipForward, AlertTriangle, Clock, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TuyBoundary } from '@/components/tuy-boundary';
import CollectorLayout from '@/layouts/collector-layout';
import { confirm, errorAlert, promptText, toast } from '@/lib/notify';
import type { BreadcrumbItem } from '@/types';

type Stop = {
    id: number;
    stop_no: number;
    stop_address: string | null;
    lat: number;
    lng: number;
    collection_status: string | null;
};

type Plan = {
    id: number;
    route_date: string | null;
    status: string;
    zone: { name: string; barangay: string | null } | null;
    stops: Stop[];
};

function csrf() {
    return (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null)?.content ?? '';
}

const post = (path: string, body?: object) =>
    fetch(path, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': csrf(),
            Accept: 'application/json',
        },
        credentials: 'include',
        body: body ? JSON.stringify(body) : undefined,
    });

/* ── RouteLine: draws the full collection route (requested once) ── */
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

/* ── DirectionLine: road-following line from truck to next stop ── */
/* Throttled — only re-requests when truck moves >30m or target changes */
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

        // Check if target (next stop) changed — always re-request
        const targetChanged = !lastToRef.current || lastToRef.current.lat !== to.lat || lastToRef.current.lng !== to.lng;

        // Check if truck moved >30 meters
        let truckMovedEnough = false;
        if (lastFromRef.current) {
            const d = haversine(lastFromRef.current, from);
            truckMovedEnough = d > 30;
        } else {
            truckMovedEnough = true; // first time
        }

        if (targetChanged || truckMovedEnough) {
            // Debounce by 800ms to batch rapid GPS updates
            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = setTimeout(requestRoute, targetChanged ? 0 : 800);
        }

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [map, from.lat, from.lng, to.lat, to.lng, requestRoute]);

    // Cleanup renderer on unmount
    useEffect(() => {
        return () => {
            rendererRef.current?.setMap(null);
            rendererRef.current = null;
        };
    }, []);

    return null;
}

/* ── MapFocus: smoothly pans map to follow truck ── */
function MapFocus({ target, nextStop }: { target: { lat: number; lng: number }; nextStop: { lat: number; lng: number } | null }) {
    const map = useMap();
    const lastPanRef = useRef<number>(0);

    useEffect(() => {
        if (!map) return;
        const now = Date.now();
        // Only pan every 5 seconds to keep it smooth and not jarring
        if (now - lastPanRef.current < 5000) return;
        lastPanRef.current = now;

        if (nextStop) {
            // Fit both truck and next stop in view
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

function getBearing(from: { lat: number; lng: number }, to: { lat: number; lng: number }) {
    const dLng = ((to.lng - from.lng) * Math.PI) / 180;
    const fromLat = (from.lat * Math.PI) / 180;
    const toLat = (to.lat * Math.PI) / 180;
    const y = Math.sin(dLng) * Math.cos(toLat);
    const x = Math.cos(fromLat) * Math.sin(toLat) - Math.sin(fromLat) * Math.cos(toLat) * Math.cos(dLng);
    return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

function getCompassDirection(bearing: number) {
    const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    return dirs[Math.round(bearing / 45) % 8];
}

const STATUS_BADGE: Record<string, { bg: string; text: string; icon: React.ElementType }> = {
    collected: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600 dark:text-emerald-400', icon: CheckCircle2 },
    skipped: { bg: 'bg-gray-100 dark:bg-gray-800/30', text: 'text-gray-500 dark:text-gray-400', icon: SkipForward },
    failed: { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-600 dark:text-red-400', icon: AlertTriangle },
};

/* ══════════════════════════════════════════════════ */
/*  Main component                                   */
/* ══════════════════════════════════════════════════ */
export default function CollectorRoute({
    plan,
    mapsApiKey,
}: {
    plan: Plan;
    mapsApiKey: string;
}) {
    const [status, setStatus] = useState(plan.status);
    const [stops, setStops] = useState<Stop[]>(plan.stops);
    const [me, setMe] = useState<{ lat: number; lng: number } | null>(null);
    const [heading, setHeading] = useState(0);
    const [roadInfo, setRoadInfo] = useState<{ distance: number; duration: number; summary: string } | null>(null);
    const prevPos = useRef<{ lat: number; lng: number } | null>(null);
    const watchRef = useRef<number | null>(null);
    const lastPingRef = useRef<number>(0);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/collector/dashboard' },
        { title: 'My Routes', href: '/collector/routes' },
        { title: `Route #${plan.id}`, href: `/collector/routes/${plan.id}` },
    ];

    const center = useMemo(() => {
        if (stops.length === 0) return { lat: 13.9333, lng: 120.7333 };
        const lat = stops.reduce((s, x) => s + x.lat, 0) / stops.length;
        const lng = stops.reduce((s, x) => s + x.lng, 0) / stops.length;
        return { lat, lng };
    }, [stops]);

    const nextStop = useMemo(() => {
        return stops.find((s) => !s.collection_status) ?? null;
    }, [stops]);

    const navInfo = useMemo(() => {
        if (!me || !nextStop) return null;
        const dist = haversine(me, nextStop);
        const bearing = getBearing(me, nextStop);
        const compass = getCompassDirection(bearing);
        return { distance: dist, bearing, compass, stop: nextStop };
    }, [me, nextStop]);

    const startTracking = async () => {
        if (!navigator.geolocation)
            return errorAlert('Not supported', 'Geolocation is not available on this device.');
        if (!(await confirm('Start route?', 'We will track your GPS location while the route is active.', 'Start')))
            return;

        try {
            const res = await post(`/collector/routes/${plan.id}/start`);
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                return errorAlert('Failed to start', body?.message ?? `Server returned ${res.status}`);
            }
        } catch {
            return errorAlert('Failed to start');
        }
        setStatus('in_progress');
        // Refresh Inertia props so status persists across navigation
        router.reload({ only: ['plan'] });
        toast('success', 'Route started');

        watchRef.current = navigator.geolocation.watchPosition(
            (pos) => {
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;
                const newPos = { lat, lng };

                if (prevPos.current) {
                    const dx = lng - prevPos.current.lng;
                    const dy = lat - prevPos.current.lat;
                    if (Math.abs(dx) + Math.abs(dy) > 1e-6) {
                        setHeading(Math.atan2(dx, dy));
                    }
                }
                prevPos.current = newPos;
                setMe(newPos);

                // Throttle server pings to every 3 seconds
                const now = Date.now();
                if (now - lastPingRef.current > 3000) {
                    lastPingRef.current = now;
                    post(`/collector/routes/${plan.id}/ping`, { lat, lng });
                }
            },
            (err) => {
                console.error('GPS error', err);
                toast('error', 'GPS error: ' + (err.message ?? 'unknown'));
            },
            { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 },
        );
    };

    const finishTracking = async () => {
        if (!(await confirm('Finish route?', 'This marks the route as completed.', 'Finish')))
            return;
        if (watchRef.current !== null) {
            navigator.geolocation.clearWatch(watchRef.current);
            watchRef.current = null;
        }
        try {
            const res = await post(`/collector/routes/${plan.id}/finish`);
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                return errorAlert('Failed to finish', body?.message ?? `Server returned ${res.status}`);
            }
        } catch {
            return errorAlert('Failed to finish');
        }
        setStatus('completed');
        // Refresh Inertia props so status persists across navigation
        router.reload({ only: ['plan'] });
        toast('success', 'Route completed');
    };

    const markStop = async (stop: Stop, statusValue: 'collected' | 'skipped') => {
        await post(`/collector/routes/${plan.id}/stops/${stop.id}/collect`, {
            status: statusValue,
            gps_lat: me?.lat,
            gps_lng: me?.lng,
        });
        setStops((prev) =>
            prev.map((s) => (s.id === stop.id ? { ...s, collection_status: statusValue } : s)),
        );
        setRoadInfo(null); // reset so it re-fetches for new next stop
        toast('success', `Stop #${stop.stop_no} marked ${statusValue}`);
    };

    const reportMissed = async (stop: Stop) => {
        const description = await promptText('Report missed pickup', 'Reason / details…');
        if (!description) return;
        await post(`/collector/routes/${plan.id}/stops/${stop.id}/missed`, { description });
        setStops((prev) =>
            prev.map((s) => (s.id === stop.id ? { ...s, collection_status: 'failed' } : s)),
        );
        setRoadInfo(null);
        toast('warning', `Stop #${stop.stop_no} reported missed`);
    };

    useEffect(() => {
        return () => {
            if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current);
        };
    }, []);

    const collectedCount = stops.filter((s) => s.collection_status === 'collected').length;
    const progress = stops.length > 0 ? (collectedCount / stops.length) * 100 : 0;

    return (
        <CollectorLayout breadcrumbs={breadcrumbs}>
            <Head title={`Route #${plan.id}`} />
            <div className="grid min-h-[calc(100vh-4rem)] grid-cols-1 lg:h-[calc(100vh-4rem)] lg:grid-cols-[380px_1fr]">
                {/* Sidebar */}
                <div className="flex flex-col border-b border-gray-100 bg-white lg:border-b-0 lg:border-r dark:border-white/5 dark:bg-[#0a0a0a]">
                    {/* Route header */}
                    <div className="border-b border-gray-50 p-5 dark:border-white/5">
                        <div className="flex items-center justify-between">
                            <h1 className="text-lg font-bold tracking-tight">Route #{plan.id}</h1>
                            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                                status === 'in_progress'
                                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                                    : status === 'completed'
                                    ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'
                                    : 'bg-gray-50 text-gray-600 dark:bg-gray-800/30 dark:text-gray-400'
                            }`}>
                                <span className={`h-1.5 w-1.5 rounded-full ${
                                    status === 'in_progress' ? 'bg-blue-500 animate-pulse' : status === 'completed' ? 'bg-emerald-500' : 'bg-gray-400'
                                }`} />
                                {status === 'in_progress' ? 'In Progress' : status === 'completed' ? 'Completed' : 'Planned'}
                            </span>
                        </div>
                        <div className="mt-3 space-y-1.5 text-sm text-gray-500">
                            <div className="flex items-center gap-2">
                                <Clock size={13} className="text-gray-300" />
                                {plan.route_date}
                            </div>
                            <div className="flex items-center gap-2">
                                <MapPin size={13} className="text-gray-300" />
                                {plan.zone?.name} ({plan.zone?.barangay})
                            </div>
                        </div>

                        {status === 'in_progress' && (
                            <div className="mt-4">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-medium text-gray-500">Progress</span>
                                    <span className="font-bold text-emerald-600">{collectedCount}/{stops.length}</span>
                                </div>
                                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-white/5">
                                    <motion.div
                                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progress}%` }}
                                        transition={{ duration: 0.5, ease: 'easeOut' }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Navigation card */}
                    <AnimatePresence>
                        {status === 'in_progress' && nextStop && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="border-b border-gray-50 dark:border-white/5"
                            >
                                <div className="mx-4 my-3 overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 p-4 text-white shadow-lg shadow-blue-600/20">
                                    <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-blue-200">
                                        <Navigation size={12} />
                                        Next Stop
                                    </div>
                                    <div className="mt-2 flex items-center justify-between">
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-bold">
                                                #{nextStop.stop_no} — {nextStop.stop_address ?? 'No address'}
                                            </p>
                                            {navInfo ? (
                                                <p className="mt-1 flex items-center gap-2 text-xs text-blue-200">
                                                    <span className="font-bold text-white">{roadInfo ? formatDistance(roadInfo.distance) : formatDistance(navInfo.distance)}</span>
                                                    {roadInfo && (
                                                        <>
                                                            <span className="h-1 w-1 rounded-full bg-blue-400" />
                                                            <span className="text-white">{roadInfo.summary}</span>
                                                        </>
                                                    )}
                                                    <span className="h-1 w-1 rounded-full bg-blue-400" />
                                                    <span>Head {navInfo.compass}</span>
                                                </p>
                                            ) : (
                                                <p className="mt-1 text-xs text-blue-200">Waiting for GPS...</p>
                                            )}
                                        </div>
                                        <div className="ml-3 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white/15">
                                            <span className="text-lg font-bold">{nextStop.stop_no}</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Action buttons */}
                    <div className="border-b border-gray-50 px-4 py-3 dark:border-white/5">
                        {status === 'planned' && (
                            <button
                                onClick={startTracking}
                                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#1b4332] to-[#2d6a4f] px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition-all hover:-translate-y-0.5 hover:shadow-xl"
                            >
                                <Truck size={18} />
                                Start Route
                                <ChevronRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                            </button>
                        )}
                        {status === 'in_progress' && (
                            <button
                                onClick={finishTracking}
                                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-red-600/20 transition-all hover:-translate-y-0.5 hover:shadow-xl"
                            >
                                <CheckCircle2 size={18} />
                                Finish Route
                            </button>
                        )}
                        {status === 'completed' && (
                            <div className="flex items-center justify-center gap-2 rounded-xl bg-emerald-50 px-4 py-3.5 text-sm font-semibold text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400">
                                <CheckCircle2 size={18} />
                                Route Completed
                            </div>
                        )}
                    </div>

                    {/* Stops list */}
                    <div className="flex items-center gap-2 border-b border-gray-50 px-5 py-3 dark:border-white/5">
                        <MapPin size={14} className="text-emerald-600 dark:text-emerald-400" />
                        <span className="text-xs font-semibold tracking-tight">Stops</span>
                        <span className="ml-auto rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400">
                            {collectedCount}/{stops.length}
                        </span>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        <ol className="p-2">
                            {stops.map((s, i) => {
                                const isDone = !!s.collection_status;
                                const isNext = nextStop?.id === s.id && status === 'in_progress';
                                const badge = s.collection_status ? STATUS_BADGE[s.collection_status] : null;
                                const BadgeIcon = badge?.icon;

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
                                                {i < stops.length - 1 && (
                                                    <div className={`mt-1 h-4 w-px ${isDone ? 'bg-gray-200 dark:bg-gray-700' : 'bg-emerald-200 dark:bg-emerald-800/30'}`} />
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center justify-between gap-2">
                                                    <p className={`truncate text-sm font-medium ${isDone ? 'text-gray-400 line-through' : ''}`}>
                                                        {s.stop_address ?? 'No address'}
                                                    </p>
                                                    {badge && BadgeIcon && (
                                                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${badge.bg} ${badge.text}`}>
                                                            <BadgeIcon size={10} />
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

                                                {status === 'in_progress' && !s.collection_status && (
                                                    <div className="mt-2 flex flex-wrap gap-1.5">
                                                        <button
                                                            onClick={() => markStop(s, 'collected')}
                                                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-sm transition-all hover:bg-emerald-700"
                                                        >
                                                            <CheckCircle2 size={11} />
                                                            Collected
                                                        </button>
                                                        <button
                                                            onClick={() => markStop(s, 'skipped')}
                                                            className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-2.5 py-1.5 text-[11px] font-semibold text-gray-600 transition-all hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
                                                        >
                                                            <SkipForward size={11} />
                                                            Skip
                                                        </button>
                                                        <button
                                                            onClick={() => reportMissed(s)}
                                                            className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1.5 text-[11px] font-semibold text-red-600 transition-all hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400"
                                                        >
                                                            <AlertTriangle size={11} />
                                                            Missed
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </li>
                                );
                            })}
                        </ol>
                    </div>
                </div>

                {/* Map */}
                <div className="relative h-[55vh] lg:h-auto">
                    <APIProvider apiKey={mapsApiKey}>
                        <Map
                            mapId="smartwaste-route-map"
                            defaultCenter={center}
                            defaultZoom={14}
                            gestureHandling="greedy"
                            style={{ width: '100%', height: '100%' }}
                        >
                            <TuyBoundary />

                            {/* Stop markers */}
                            {stops.map((s) => {
                                const isDone = !!s.collection_status;
                                const isNext = nextStop?.id === s.id && status === 'in_progress';
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

                            {/* Truck marker */}
                            {me && (
                                <AdvancedMarker position={me} zIndex={9999}>
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

                            {/* Road direction to next stop */}
                            {me && nextStop && status === 'in_progress' && (
                                <DirectionLine
                                    from={me}
                                    to={{ lat: nextStop.lat, lng: nextStop.lng }}
                                    onRouteInfo={setRoadInfo}
                                />
                            )}

                            {/* Auto-focus map on truck + next stop */}
                            {me && status === 'in_progress' && (
                                <MapFocus target={me} nextStop={nextStop ? { lat: nextStop.lat, lng: nextStop.lng } : null} />
                            )}

                            <RouteLine stops={stops} />
                        </Map>
                    </APIProvider>

                    {/* Navigation overlay */}
                    <AnimatePresence>
                        {status === 'in_progress' && navInfo && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="absolute bottom-4 left-3 right-3 z-10 sm:bottom-6 sm:left-4 sm:right-auto"
                            >
                                <div className="flex items-center gap-3 rounded-2xl border border-white/50 bg-white/95 px-4 py-3 shadow-xl backdrop-blur-xl sm:min-w-[280px] dark:border-white/10 dark:bg-[#111]/95">
                                    <div
                                        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 shadow-md shadow-blue-500/20"
                                    >
                                        <Navigation size={18} className="text-white" style={{ transform: `rotate(${navInfo.bearing}deg)` }} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-baseline gap-2">
                                            <p className="text-lg font-bold tracking-tight">{roadInfo ? formatDistance(roadInfo.distance) : formatDistance(navInfo.distance)}</p>
                                            {roadInfo && <span className="text-xs font-medium text-gray-400">{roadInfo.summary}</span>}
                                        </div>
                                        <p className="truncate text-xs text-gray-500">
                                            Head {navInfo.compass} to Stop #{navInfo.stop.stop_no}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Live indicator */}
                    {status === 'in_progress' && me && (
                        <div className="absolute left-3 top-3 z-10 sm:left-4 sm:top-4">
                            <div className="flex items-center gap-2 rounded-xl border border-blue-200/50 bg-white/90 px-3 py-2 shadow-lg backdrop-blur-xl dark:border-blue-800/30 dark:bg-[#111]/90">
                                <span className="relative flex h-2 w-2">
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-500 opacity-75" />
                                    <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-600" />
                                </span>
                                <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300">TRACKING</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </CollectorLayout>
    );
}
