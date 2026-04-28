import { Head, router } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import {
    APIProvider,
    Map,
    AdvancedMarker,
    Pin,
    useMap,
} from '@vis.gl/react-google-maps';
import { TuyBoundary } from '@/components/tuy-boundary';
import AdminLayout from '@/layouts/admin-layout';
import { closeLoading, errorAlert, loading as showLoading, successAlert, toast } from '@/lib/notify';
import type { BreadcrumbItem } from '@/types';

type Zone = { id: number; name: string; barangay: string | null };
type Collector = { id: number; name: string };
type Household = { id: number; address_line: string | null; lat: number; lng: number };

type Props = {
    zones: Zone[];
    collectors: Collector[];
    mapsApiKey: string;
};

const TUY_CENTER = { lat: 13.9333, lng: 120.7333 };


const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/admin/dashboard' },
    { title: 'Routes', href: '/admin/routes' },
    { title: 'New', href: '/admin/routes/create' },
];

// Renders the optimized polyline. Uses Directions API on the client.
function RouteRenderer({
    households,
    onOptimized,
}: {
    households: Household[];
    onOptimized: (orderedHouseholds: Household[]) => void;
}) {
    const map = useMap();
    const [renderer, setRenderer] = useState<google.maps.DirectionsRenderer | null>(null);

    useEffect(() => {
        if (!map) return;
        const r = new google.maps.DirectionsRenderer({
            map,
            suppressMarkers: true,
            polylineOptions: { strokeColor: '#2d6a4f', strokeWeight: 5 },
        });
        setRenderer(r);
        return () => r.setMap(null);
    }, [map]);

    useEffect(() => {
        if (!map || !renderer || households.length < 2) {
            renderer?.set('directions', null);
            return;
        }

        const service = new google.maps.DirectionsService();
        const origin = households[0];
        const destination = households[households.length - 1];
        const waypoints = households.slice(1, -1).map((h) => ({
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
                console.log('[Optimize] Directions status:', status, result);
                if (status !== 'OK' || !result) {
                    errorAlert('Directions API Error', `Directions API returned: ${status}. Check that Directions API is enabled in Google Cloud Console for your key.`);
                    return;
                }
                renderer.setDirections(result);

                // Reorder households per Google's optimized order
                const order = result.routes[0].waypoint_order;
                const middle = order.map((i) => households[i + 1]);
                onOptimized([origin, ...middle, destination]);
            },
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [map, renderer, households]);

    return null;
}

export default function CreateRoute({ zones, collectors, mapsApiKey }: Props) {
    const [zoneId, setZoneId] = useState<string>('');
    const [collectorId, setCollectorId] = useState<string>('');
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

    const save = () => {
        if (!routeDate) return errorAlert('Missing date', 'Please pick a route date.');
        if (!zoneId) return errorAlert('Missing zone', 'Please select a zone.');
        if (orderedHouseholds.length === 0)
            return errorAlert('No stops', 'No households loaded for this zone.');

        showLoading('Saving route plan…');
        router.post(
            '/admin/routes',
            {
                route_date: routeDate,
                zone_id: zoneId,
                collector_user_id: collectorId || null,
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
                    successAlert('Route saved');
                },
                onError: () => {
                    closeLoading();
                    errorAlert('Save failed', 'Please try again.');
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
            <div className="grid min-h-[calc(100vh-4rem)] grid-cols-1 lg:h-[calc(100vh-4rem)] lg:grid-cols-[360px_1fr]">
                {/* Sidebar form */}
                <div className="space-y-4 overflow-y-auto border-b border-sidebar-border/70 bg-white p-4 lg:border-b-0 lg:border-r dark:border-sidebar-border dark:bg-[#0a0a0a]">
                    <h1 className="text-xl font-semibold">New Route Plan</h1>

                    <div>
                        <label className="mb-1 block text-sm font-medium">Date</label>
                        <input
                            type="date"
                            value={routeDate}
                            onChange={(e) => setRouteDate(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium">Zone</label>
                        <select
                            value={zoneId}
                            onChange={(e) => {
                                setZoneId(e.target.value);
                                loadHouseholds(e.target.value);
                            }}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        >
                            <option value="">Select zone…</option>
                            {zones.map((z) => (
                                <option key={z.id} value={z.id}>
                                    {z.name} {z.barangay ? `(${z.barangay})` : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium">Collector (optional)</label>
                        <select
                            value={collectorId}
                            onChange={(e) => setCollectorId(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        >
                            <option value="">Unassigned</option>
                            {collectors.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="rounded-lg bg-gray-50 p-3 text-sm dark:bg-[#1a1a1a]">
                        {loading
                            ? 'Loading households…'
                            : `${households.length} household${households.length === 1 ? '' : 's'} in this zone`}
                    </div>

                    <div className="flex flex-col gap-2">
                        <button
                            type="button"
                            disabled={households.length < 2}
                            onClick={handleOptimize}
                            className="rounded-lg border border-[#2d6a4f] px-4 py-2 text-sm font-semibold text-[#2d6a4f] disabled:opacity-50"
                        >
                            Optimize Route
                        </button>
                        <button
                            type="button"
                            disabled={orderedHouseholds.length === 0}
                            onClick={save}
                            className="rounded-lg bg-[#2d6a4f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1b4332] disabled:opacity-50"
                        >
                            Save Route Plan
                        </button>
                    </div>

                    {orderedHouseholds.length > 0 && (
                        <div className="max-h-64 overflow-y-auto rounded-lg border border-gray-200 text-sm">
                            <ol className="divide-y divide-gray-100">
                                {orderedHouseholds.map((h, i) => (
                                    <li key={h.id} className="flex gap-2 px-3 py-2">
                                        <span className="font-semibold text-[#2d6a4f]">{i + 1}.</span>
                                        <span className="truncate">{h.address_line ?? `${h.lat}, ${h.lng}`}</span>
                                    </li>
                                ))}
                            </ol>
                        </div>
                    )}
                </div>

                {/* Map */}
                <div className="relative h-[60vh] lg:h-auto">
                    <APIProvider apiKey={mapsApiKey}>
                        <Map
                            mapId="smartwaste-route-map"
                            defaultCenter={center}
                            defaultZoom={13}
                            gestureHandling="greedy"
                            disableDefaultUI={false}
                        >
                            <TuyBoundary />
                            {households.map((h, i) => (
                                <AdvancedMarker key={h.id} position={{ lat: h.lat, lng: h.lng }}>
                                    <Pin
                                        background="#2d6a4f"
                                        borderColor="#1b4332"
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
                </div>
            </div>
        </AdminLayout>
    );
}
