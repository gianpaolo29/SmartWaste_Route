import { Head, router } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import {
    APIProvider,
    Map,
    AdvancedMarker,
    Pin,
    useMap,
} from '@vis.gl/react-google-maps';
import { Route, MapPin } from 'lucide-react';
import { TuyBoundary } from '@/components/tuy-boundary';
import AdminLayout from '@/layouts/admin-layout';
import { closeLoading, confirm, errorAlert, loading as showLoading, successAlert, toast } from '@/lib/notify';
import type { BreadcrumbItem } from '@/types';

type Zone = { id: number; name: string; barangay: string | null };
type CollectorWithTruck = { id: number; name: string; truck_id: number; truck_plate: string; truck_capacity: number };
type Household = { id: number; address_line: string | null; lat: number; lng: number };

type Props = {
    zones: Zone[];
    collectors: CollectorWithTruck[];
    mapsApiKey: string;
};

const TUY_CENTER = { lat: 13.9333, lng: 120.7333 };


const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/admin/dashboard' },
    { title: 'Routes', href: '/admin/routes' },
    { title: 'New', href: '/admin/routes/create' },
];

// Max waypoints per Directions API request (25 total including origin+destination = 23 waypoints)
const MAX_WAYPOINTS = 23;

// Optimizes a single batch via Directions API, returns reordered households
function optimizeBatch(
    service: google.maps.DirectionsService,
    batch: Household[],
): Promise<{ ordered: Household[]; result: google.maps.DirectionsResult }> {
    return new Promise((resolve, reject) => {
        const origin = batch[0];
        const destination = batch[batch.length - 1];
        const waypoints = batch.slice(1, -1).map((h) => ({
            location: { lat: h.lat, lng: h.lng },
            stopover: true,
        }));

        service.route(
            {
                origin: { lat: origin.lat, lng: origin.lng },
                destination: { lat: destination.lat, lng: destination.lng },
                waypoints,
                optimizeWaypoints: true,
                travelMode: google.maps.TravelMode.DRIVING,
            },
            (result, status) => {
                if (status !== 'OK' || !result) {
                    reject(status);
                    return;
                }
                const order = result.routes[0].waypoint_order;
                const middle = order.map((i) => batch[i + 1]);
                resolve({ ordered: [origin, ...middle, destination], result });
            },
        );
    });
}

// Renders the optimized polyline. Splits into batches if > MAX_WAYPOINTS.
function RouteRenderer({
    households,
    onOptimized,
}: {
    households: Household[];
    onOptimized: (orderedHouseholds: Household[]) => void;
}) {
    const map = useMap();
    const [renderers, setRenderers] = useState<google.maps.DirectionsRenderer[]>([]);

    // Clean up renderers when component unmounts or households change
    useEffect(() => {
        return () => { renderers.forEach((r) => r.setMap(null)); };
    }, [renderers]);

    useEffect(() => {
        if (!map || households.length < 2) {
            renderers.forEach((r) => r.setMap(null));
            setRenderers([]);
            return;
        }

        // Clear old renderers
        renderers.forEach((r) => r.setMap(null));

        const service = new google.maps.DirectionsService();

        // Split households into batches of up to 25 points (origin + 23 waypoints + destination)
        const batchSize = MAX_WAYPOINTS + 2; // 25
        const batches: Household[][] = [];

        if (households.length <= batchSize) {
            batches.push(households);
        } else {
            let start = 0;
            while (start < households.length) {
                const end = Math.min(start + batchSize, households.length);
                batches.push(households.slice(start, end));
                // Next batch overlaps by 1 point (last point = next batch's origin)
                start = end - 1;
                if (start >= households.length - 1) break;
            }
        }

        (async () => {
            try {
                const newRenderers: google.maps.DirectionsRenderer[] = [];
                const allOrdered: Household[] = [];

                for (let b = 0; b < batches.length; b++) {
                    const { ordered, result } = await optimizeBatch(service, batches[b]);

                    const r = new google.maps.DirectionsRenderer({
                        map,
                        suppressMarkers: true,
                        polylineOptions: { strokeColor: '#2d6a4f', strokeWeight: 5 },
                        preserveViewport: b > 0,
                    });
                    r.setDirections(result);
                    newRenderers.push(r);

                    // Merge ordered results, skip first point of subsequent batches (it's the overlap)
                    if (b === 0) {
                        allOrdered.push(...ordered);
                    } else {
                        allOrdered.push(...ordered.slice(1));
                    }
                }

                setRenderers(newRenderers);
                onOptimized(allOrdered);
            } catch (status) {
                errorAlert('Directions API Error', `Directions API returned: ${String(status)}. Check that Directions API is enabled in Google Cloud Console for your key.`);
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [map, households]);

    return null;
}

export default function CreateRoute({ zones, collectors, mapsApiKey }: Props) {
    const [zoneId, setZoneId] = useState<string>('');
    const [collectorId, setCollectorId] = useState<string>('');
    const [truckId, setTruckId] = useState<string>('');
    const [routeDate, setRouteDate] = useState<string>(
        new Date().toISOString().slice(0, 10),
    );
    const [households, setHouseholds] = useState<Household[]>([]);
    const [orderedHouseholds, setOrderedHouseholds] = useState<Household[]>([]);
    const [loading, setLoading] = useState(false);
    const [optimized, setOptimized] = useState(false);

    const center = useMemo(() => {
        if (households.length === 0) return TUY_CENTER;
        const lat = households.reduce((s, h) => s + h.lat, 0) / households.length;
        const lng = households.reduce((s, h) => s + h.lng, 0) / households.length;
        return { lat, lng };
    }, [households]);

    const loadHouseholds = async (zid: string) => {
        if (!zid) {
            setHouseholds([]);
            setOrderedHouseholds([]);
            setOptimized(false);
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(`/admin/zones/${zid}/households`, {
                headers: { Accept: 'application/json' },
            });
            const body = await res.json();
            setHouseholds(body.households ?? []);
            setOrderedHouseholds(body.households ?? []);
            setOptimized(false);
        } finally {
            setLoading(false);
        }
    };

    const save = async () => {
        // Validation
        if (!routeDate) return errorAlert('Missing date', 'Please pick a route date.');
        const today = new Date().toISOString().slice(0, 10);
        if (routeDate < today) return errorAlert('Invalid date', 'Route date cannot be in the past. Please select today or a future date.');
        if (!zoneId) return errorAlert('Missing zone', 'Please select a zone.');
        if (!collectorId) return errorAlert('Missing collector', 'Please select a collector with an available truck.');
        if (orderedHouseholds.length === 0)
            return errorAlert('No stops', 'No households loaded for this zone.');
        if (!optimized && households.length >= 2) {
            const proceed = await confirm('Route not optimized', 'You haven\'t optimized the route order. The stops will be saved in their current order. Continue anyway?', 'Save without optimizing');
            if (!proceed) return;
        }

        showLoading('Saving route plan…');
        router.post(
            '/admin/routes',
            {
                route_date: routeDate,
                zone_id: zoneId,
                collector_user_id: collectorId || null,
                truck_id: truckId || null,
                stops: orderedHouseholds.map((h) => ({
                    household_id: h.id,
                    stop_address: h.address_line,
                    lat: h.lat,
                    lng: h.lng,
                })),
            },
            {
                onSuccess: () => {
                    closeLoading();
                    successAlert('Route saved', 'Route plan has been created successfully.');
                },
                onError: (errs) => {
                    closeLoading();
                    const msg = Object.values(errs).flat().join('\n');
                    errorAlert('Save failed', msg || 'Please check the form and try again.');
                },
            },
        );
    };

    const handleOptimize = () => {
        if (households.length < 2)
            return toast('warning', 'Need at least 2 households to optimize.');
        setOptimized(true);
        toast('info', 'Optimizing route…');
    };

    if (!mapsApiKey) {
        return (
            <AdminLayout breadcrumbs={breadcrumbs}>
                <Head title="New Route" />
                <div className="p-6">
                    <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                        Google Maps API key is not configured. Add{' '}
                        <code>VITE_GOOGLE_MAPS_API_KEY</code> to your <code>.env</code> and
                        restart the dev server.
                    </div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="New Route" />
            <div className="flex h-[calc(100vh-4rem)] flex-col lg:flex-row">
                {/* Sidebar form */}
                <div className="flex w-full flex-col border-r border-neutral-100 bg-white lg:w-[420px] dark:border-neutral-800 dark:bg-neutral-900">
                    {/* Header */}
                    <div className="border-b border-neutral-100 px-5 py-4 dark:border-neutral-800">
                        <div className="flex items-center gap-2.5">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-sm shadow-emerald-500/20">
                                <Route size={16} className="text-white" />
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-neutral-900 dark:text-white">New Route Plan</h1>
                                <p className="text-[11px] text-neutral-400">Configure and optimize collection route</p>
                            </div>
                        </div>
                    </div>

                    {/* Form content - scrollable */}
                    <div className="flex-1 space-y-4 overflow-y-auto p-5">
                        {/* Date */}
                        <div>
                            <label className="mb-1.5 block text-xs font-semibold text-neutral-600 dark:text-neutral-400">Route Date</label>
                            <input
                                type="date"
                                value={routeDate}
                                min={new Date().toISOString().slice(0, 10)}
                                onChange={(e) => setRouteDate(e.target.value)}
                                className="w-full rounded-xl border border-neutral-200 bg-neutral-50/50 px-3.5 py-2.5 text-sm outline-none transition-all focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 dark:border-neutral-700 dark:bg-neutral-800/50 dark:text-neutral-100 dark:focus:border-emerald-600"
                            />
                        </div>

                        {/* Zone */}
                        <div>
                            <label className="mb-1.5 block text-xs font-semibold text-neutral-600 dark:text-neutral-400">Zone</label>
                            <select
                                value={zoneId}
                                onChange={(e) => {
                                    setZoneId(e.target.value);
                                    loadHouseholds(e.target.value);
                                }}
                                className="w-full rounded-xl border border-neutral-200 bg-neutral-50/50 px-3.5 py-2.5 text-sm outline-none transition-all focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 dark:border-neutral-700 dark:bg-neutral-800/50 dark:text-neutral-100 dark:focus:border-emerald-600"
                            >
                                <option value="">Select zone...</option>
                                {zones.map((z) => (
                                    <option key={z.id} value={z.id}>
                                        {z.name} {z.barangay ? `(${z.barangay})` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Collector + Truck (combined) */}
                        <div>
                            <label className="mb-1.5 block text-xs font-semibold text-neutral-600 dark:text-neutral-400">Collector & Truck</label>
                            <select
                                value={collectorId}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setCollectorId(val);
                                    const selected = collectors.find((c) => c.id.toString() === val);
                                    setTruckId(selected ? selected.truck_id.toString() : '');
                                }}
                                className="w-full rounded-xl border border-neutral-200 bg-neutral-50/50 px-3.5 py-2.5 text-sm outline-none transition-all focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 dark:border-neutral-700 dark:bg-neutral-800/50 dark:text-neutral-100 dark:focus:border-emerald-600"
                            >
                                <option value="">Select collector...</option>
                                {collectors.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name} — {c.truck_plate} ({c.truck_capacity} kg)
                                    </option>
                                ))}
                            </select>
                            {collectors.length === 0 && (
                                <p className="mt-1.5 text-[11px] text-amber-600 dark:text-amber-400">No collectors with available trucks. Assign trucks to collectors first.</p>
                            )}
                        </div>

                        {/* Households count */}
                        <div className="flex items-center gap-3 rounded-xl border border-neutral-200/60 bg-neutral-50/50 px-4 py-3 dark:border-neutral-700 dark:bg-neutral-800/30">
                            <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${households.length > 0 ? 'bg-emerald-100 dark:bg-emerald-900/40' : 'bg-neutral-100 dark:bg-neutral-800'}`}>
                                <MapPin size={14} className={households.length > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-neutral-400'} />
                            </div>
                            <div>
                                {loading ? (
                                    <div className="flex items-center gap-2">
                                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                                        <span className="text-xs font-medium text-neutral-500">Loading households...</span>
                                    </div>
                                ) : (
                                    <>
                                        <p className="text-sm font-bold text-neutral-900 dark:text-white">{households.length}</p>
                                        <p className="text-[11px] text-neutral-400">household{households.length !== 1 ? 's' : ''} in this zone</p>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex flex-col gap-2">
                            <button
                                type="button"
                                disabled={households.length < 2}
                                onClick={handleOptimize}
                                className="flex items-center justify-center gap-2 rounded-xl border-2 border-emerald-200 bg-emerald-50/50 px-4 py-2.5 text-sm font-semibold text-emerald-700 transition-all hover:border-emerald-300 hover:bg-emerald-100/50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400 dark:hover:border-emerald-700 dark:hover:bg-emerald-950/50"
                            >
                                <Route size={14} />
                                {optimized ? 'Re-optimize Route' : 'Optimize Route'}
                            </button>
                            <button
                                type="button"
                                disabled={orderedHouseholds.length === 0}
                                onClick={save}
                                className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-emerald-600/20 transition-all hover:shadow-md hover:shadow-emerald-600/25 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                Save Route Plan
                            </button>
                        </div>

                        {/* Stops list */}
                        {orderedHouseholds.length > 0 && (
                            <div>
                                <div className="mb-2 flex items-center justify-between">
                                    <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">Stops Order</p>
                                    {optimized && (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                                            <Route size={9} /> Optimized
                                        </span>
                                    )}
                                </div>
                                <div className="max-h-64 overflow-y-auto rounded-xl border border-neutral-200/60 bg-neutral-50/30 dark:border-neutral-700 dark:bg-neutral-800/20">
                                    <ol className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                        {orderedHouseholds.map((h, i) => (
                                            <li key={h.id} className="flex items-center gap-3 px-3.5 py-2.5 transition-colors hover:bg-white dark:hover:bg-neutral-800/40">
                                                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-[10px] font-bold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
                                                    {i + 1}
                                                </span>
                                                <span className="truncate text-xs text-neutral-700 dark:text-neutral-300">{h.address_line ?? `${h.lat.toFixed(4)}, ${h.lng.toFixed(4)}`}</span>
                                            </li>
                                        ))}
                                    </ol>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Map */}
                <div className="relative flex-1">
                    <APIProvider apiKey={mapsApiKey}>
                        <Map
                            mapId="smartwaste-route-map"
                            defaultCenter={center}
                            defaultZoom={13}
                            gestureHandling="greedy"
                            disableDefaultUI={false}
                            style={{ width: '100%', height: '100%' }}
                        >
                            <TuyBoundary />
                            {households.map((h, i) => (
                                <AdvancedMarker key={h.id} position={{ lat: h.lat, lng: h.lng }}>
                                    <Pin
                                        background="#059669"
                                        borderColor="#047857"
                                        glyphColor="#fff"
                                    >
                                        {String(i + 1)}
                                    </Pin>
                                </AdvancedMarker>
                            ))}
                            {optimized && (
                                <RouteRenderer
                                    households={households}
                                    onOptimized={(o) => {
                                        setOrderedHouseholds(o);
                                    }}
                                />
                            )}
                        </Map>
                    </APIProvider>

                    {/* Map hint overlay */}
                    {zoneId && households.length > 0 && (
                        <div className="pointer-events-none absolute left-1/2 top-4 z-10 -translate-x-1/2">
                            <div className="rounded-full border border-white/30 bg-white/90 px-4 py-2 text-xs font-semibold text-neutral-600 shadow-lg backdrop-blur-xl dark:border-neutral-600/30 dark:bg-neutral-900/90 dark:text-neutral-300">
                                <span className="inline-flex items-center gap-1.5">
                                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                                    {households.length} stops loaded {optimized ? '(optimized)' : ''}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
