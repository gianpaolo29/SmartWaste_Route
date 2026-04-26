import { useEffect, useState } from 'react';
import {
    APIProvider,
    Map,
    AdvancedMarker,
    Pin,
} from '@vis.gl/react-google-maps';
import { Truck } from 'lucide-react';

type Truck = {
    route_id: number;
    collector: string | null;
    lat: number;
    lng: number;
    distance_m: number;
};

export function ResidentMap({
    apiKey,
    home,
}: {
    apiKey: string;
    home: { lat: number; lng: number; address: string | null };
}) {
    const [truck, setTruck] = useState<Truck | null>(null);

    useEffect(() => {
        let cancelled = false;
        const tick = async () => {
            try {
                const res = await fetch('/resident/nearby-truck', {
                    headers: { Accept: 'application/json' },
                });
                if (!res.ok) return;
                const body = await res.json();
                if (!cancelled) setTruck(body.truck ?? null);
            } catch {
                /* ignore */
            }
        };
        tick();
        const id = setInterval(tick, 6000);
        return () => {
            cancelled = true;
            clearInterval(id);
        };
    }, []);

    if (!apiKey) {
        return (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">
                Google Maps API key not configured.
            </div>
        );
    }

    return (
        <div className="h-[360px] overflow-hidden rounded-xl border border-sidebar-border/70">
            <APIProvider apiKey={apiKey}>
                <Map
                    mapId="smartwaste-route-map"
                    defaultCenter={home}
                    defaultZoom={16}
                    gestureHandling="greedy"
                    disableDefaultUI={false}
                >
                    <AdvancedMarker position={home} title={home.address ?? 'Your home'}>
                        <Pin background="#2d6a4f" borderColor="#1b4332" glyphColor="#fff">
                            🏠
                        </Pin>
                    </AdvancedMarker>

                    {truck && (
                        <AdvancedMarker
                            position={{ lat: truck.lat, lng: truck.lng }}
                            title={`${truck.collector ?? 'Collector'} — ${truck.distance_m}m away`}
                            zIndex={9999}
                        >
                            <div className="relative flex h-12 w-12 items-center justify-center">
                                <span className="absolute h-12 w-12 animate-ping rounded-full bg-blue-500/40" />
                                <div className="relative flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-blue-600 shadow-lg">
                                    <Truck className="h-5 w-5 text-white" />
                                </div>
                            </div>
                        </AdvancedMarker>
                    )}
                </Map>
            </APIProvider>
            {truck && (
                <div className="absolute left-4 top-4 rounded-lg bg-white px-3 py-1.5 text-xs font-medium shadow">
                    🚛 Truck ~{truck.distance_m}m away
                </div>
            )}
        </div>
    );
}
