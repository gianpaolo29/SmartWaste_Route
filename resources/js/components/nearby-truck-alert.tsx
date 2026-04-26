import { useEffect, useRef, useState } from 'react';
import { Truck, X } from 'lucide-react';

type Truck = {
    route_id: number;
    collector: string | null;
    lat: number;
    lng: number;
    distance_km: number;
    distance_m: number;
    updated_at: string | null;
};

const PROXIMITY_THRESHOLD_M = 500; // alert when truck is within 500 meters
const POLL_INTERVAL_MS = 8000;

export function NearbyTruckAlert() {
    const [truck, setTruck] = useState<Truck | null>(null);
    const [dismissed, setDismissed] = useState(false);
    const lastAlertedRouteRef = useRef<number | null>(null);

    useEffect(() => {
        let cancelled = false;

        const tick = async () => {
            try {
                const res = await fetch('/resident/nearby-truck', {
                    headers: { Accept: 'application/json' },
                    credentials: 'include',
                });
                if (!res.ok) return;
                const body = await res.json();
                if (cancelled) return;

                setTruck(body.truck ?? null);

                // Trigger sound + browser notification once per route when truck enters threshold
                if (
                    body.truck &&
                    body.truck.distance_m <= PROXIMITY_THRESHOLD_M &&
                    lastAlertedRouteRef.current !== body.truck.route_id
                ) {
                    lastAlertedRouteRef.current = body.truck.route_id;
                    setDismissed(false);
                    notify(body.truck);
                }

                // Reset dismissal once truck moves away again
                if (body.truck && body.truck.distance_m > PROXIMITY_THRESHOLD_M * 1.5) {
                    lastAlertedRouteRef.current = null;
                }
            } catch {
                /* ignore */
            }
        };

        tick();
        const id = setInterval(tick, POLL_INTERVAL_MS);
        return () => {
            cancelled = true;
            clearInterval(id);
        };
    }, []);

    if (!truck || truck.distance_m > PROXIMITY_THRESHOLD_M || dismissed) return null;

    return (
        <div className="pointer-events-none fixed inset-x-0 top-20 z-50 flex justify-center px-4">
            <div className="pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-xl border border-blue-300 bg-blue-50 p-4 shadow-xl">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
                    <Truck size={24} />
                </div>
                <div className="flex-1">
                    <p className="text-sm font-semibold text-blue-900">
                        Garbage truck nearby!
                    </p>
                    <p className="text-xs text-blue-800">
                        {truck.collector ? `${truck.collector} is ` : 'A collector is '}
                        about <b>{truck.distance_m} m</b> away. Please bring out your trash.
                    </p>
                </div>
                <button
                    onClick={() => setDismissed(true)}
                    className="text-blue-700 hover:text-blue-900"
                    aria-label="Dismiss"
                >
                    <X size={18} />
                </button>
            </div>
        </div>
    );
}

async function notify(truck: Truck) {
    // Beep
    try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g);
        g.connect(ctx.destination);
        o.frequency.value = 880;
        g.gain.value = 0.15;
        o.start();
        setTimeout(() => {
            o.stop();
            ctx.close();
        }, 350);
    } catch {
        /* ignore */
    }

    // Browser notification (requires permission)
    if ('Notification' in window) {
        if (Notification.permission === 'default') {
            try {
                await Notification.requestPermission();
            } catch {
                /* ignore */
            }
        }
        if (Notification.permission === 'granted') {
            try {
                new Notification('Garbage truck nearby', {
                    body: `${truck.collector ?? 'Collector'} is ~${truck.distance_m}m away.`,
                    icon: '/favicon.ico',
                });
            } catch {
                /* ignore */
            }
        }
    }
}
