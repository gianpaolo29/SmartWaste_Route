import { useEffect, useRef, useState } from 'react';
import { Truck, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type TruckData = {
    route_id: number;
    collector: string | null;
    lat: number;
    lng: number;
    distance_km: number;
    distance_m: number;
    updated_at: string | null;
};

const PROXIMITY_THRESHOLD_M = 500;
const POLL_INTERVAL_MS = 8000;

export function NearbyTruckAlert() {
    const [truck, setTruck] = useState<TruckData | null>(null);
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

                if (
                    body.truck &&
                    body.truck.distance_m <= PROXIMITY_THRESHOLD_M &&
                    lastAlertedRouteRef.current !== body.truck.route_id
                ) {
                    lastAlertedRouteRef.current = body.truck.route_id;
                    setDismissed(false);
                    notify(body.truck);
                }

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
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="pointer-events-none fixed inset-x-0 top-20 z-50 flex justify-center px-4"
            >
                <div className="pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-2xl border border-emerald-200 bg-white p-4 shadow-xl shadow-emerald-600/10 dark:border-emerald-800/50 dark:bg-neutral-900 dark:shadow-emerald-900/20">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-600/30">
                        <Truck size={22} />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                            Garbage truck nearby!
                        </p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                            {truck.collector ? `${truck.collector} is ` : 'A collector is '}
                            about <b className="text-emerald-700 dark:text-emerald-400">{truck.distance_m} m</b> away. Please bring out your trash.
                        </p>
                    </div>
                    <button
                        onClick={() => setDismissed(true)}
                        className="shrink-0 rounded-lg p-1.5 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
                        aria-label="Dismiss"
                    >
                        <X size={16} />
                    </button>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}

async function notify(truck: TruckData) {
    try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new AudioCtx();
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g);
        g.connect(ctx.destination);
        o.frequency.value = 880;
        g.gain.value = 0.15;
        o.start();
        setTimeout(() => { o.stop(); ctx.close(); }, 350);
    } catch { /* ignore */ }

    if ('Notification' in window) {
        if (Notification.permission === 'default') {
            try { await Notification.requestPermission(); } catch { /* ignore */ }
        }
        if (Notification.permission === 'granted') {
            try {
                new Notification('Garbage truck nearby', {
                    body: `${truck.collector ?? 'Collector'} is ~${truck.distance_m}m away.`,
                    icon: '/favicon.ico',
                });
            } catch { /* ignore */ }
        }
    }
}
