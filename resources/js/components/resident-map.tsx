import { useEffect, useState } from 'react';
import {
    APIProvider,
    Map,
    AdvancedMarker,
} from '@vis.gl/react-google-maps';
import { Home, Truck } from 'lucide-react';

type TruckData = {
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
    const [truck, setTruck] = useState<TruckData | null>(null);

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
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800 dark:border-red-800/50 dark:bg-red-950/30 dark:text-red-400">
                Google Maps API key not configured.
            </div>
        );
    }

    return (
        <div className="relative h-[360px] overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800">
            <APIProvider apiKey={apiKey}>
                <Map
                    mapId="smartwaste-route-map"
                    defaultCenter={home}
                    defaultZoom={16}
                    gestureHandling="greedy"
                    disableDefaultUI={false}
                >
                    {/* Home marker */}
                    <AdvancedMarker position={home}>
                        <div className="flex flex-col items-center" style={{ transform: 'translateY(-50%)' }}>
                            <div className="flex h-11 w-11 items-center justify-center rounded-full border-[3px] border-white bg-emerald-600 shadow-lg shadow-emerald-600/30">
                                <Home size={20} className="text-white" strokeWidth={2.5} />
                            </div>
                            <div className="-mt-[3px] h-0 w-0 border-l-[7px] border-r-[7px] border-t-[10px] border-l-transparent border-r-transparent border-t-emerald-600" style={{ filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.15))' }} />
                        </div>
                    </AdvancedMarker>

                    {/* Truck marker */}
                    {truck && (
                        <AdvancedMarker
                            position={{ lat: truck.lat, lng: truck.lng }}
                            zIndex={9999}
                        >
                            <div className="relative flex h-12 w-12 items-center justify-center">
                                <span className="absolute h-12 w-12 animate-ping rounded-full bg-blue-500/30" />
                                <div className="relative flex h-10 w-10 items-center justify-center rounded-full border-[3px] border-white bg-blue-600 shadow-lg shadow-blue-600/30">
                                    <Truck size={18} className="text-white" strokeWidth={2.5} />
                                </div>
                            </div>
                        </AdvancedMarker>
                    )}
                </Map>
            </APIProvider>

            {/* Truck distance badge */}
            {truck && (
                <div className="absolute left-3 top-3 flex items-center gap-2 rounded-xl bg-white/90 px-3 py-2 text-xs font-semibold shadow-md backdrop-blur-sm dark:bg-neutral-900/90">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white">
                        <Truck size={12} />
                    </div>
                    <span className="text-neutral-700 dark:text-neutral-300">~{truck.distance_m}m away</span>
                </div>
            )}
        </div>
    );
}
