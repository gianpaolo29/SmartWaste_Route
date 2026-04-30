import { useEffect, useRef, useState } from 'react';
import { Truck, X, MapPin, Bell, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type TruckData = {
    route_id: number;
    collector: string | null;
    lat: number;
    lng: number;
    distance_km: number;
    distance_m: number;
    updated_at: string | null;
    is_next_stop: boolean;
    stops_away: number;
};

const PROXIMITY_THRESHOLD_M = 500;
const NEXT_STOP_THRESHOLD_M = 800;
const POLL_INTERVAL_MS = 6000;

export function NearbyTruckAlert() {
    const [truck, setTruck] = useState<TruckData | null>(null);
    const [dismissed, setDismissed] = useState(false);
    const [showFullAlert, setShowFullAlert] = useState(false);
    const lastAlertedRouteRef = useRef<number | null>(null);
    const lastNextStopAlertRef = useRef<number | null>(null);

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

                const t = body.truck as TruckData | null;
                setTruck(t);

                if (!t) return;

                // Full-screen alert when this house is the next stop
                if (
                    t.is_next_stop &&
                    t.distance_m <= NEXT_STOP_THRESHOLD_M &&
                    lastNextStopAlertRef.current !== t.route_id
                ) {
                    lastNextStopAlertRef.current = t.route_id;
                    setShowFullAlert(true);
                    setDismissed(false);
                    vibrate([200, 100, 200, 100, 300]);
                    playAlertSound();
                    sendNotification(
                        'Your house is next!',
                        `${t.collector ?? 'Collector'} is ${t.distance_m}m away. Please bring out your trash now!`,
                    );
                }
                // Banner alert when nearby
                else if (
                    t.distance_m <= PROXIMITY_THRESHOLD_M &&
                    lastAlertedRouteRef.current !== t.route_id
                ) {
                    lastAlertedRouteRef.current = t.route_id;
                    setDismissed(false);
                    vibrate([200, 100, 200]);
                    playNotifySound();
                    sendNotification(
                        'Garbage truck nearby!',
                        `${t.collector ?? 'Collector'} is ~${t.distance_m}m away.`,
                    );
                }

                // Reset when truck goes far
                if (t.distance_m > NEXT_STOP_THRESHOLD_M * 1.5) {
                    lastAlertedRouteRef.current = null;
                    lastNextStopAlertRef.current = null;
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

    // Request notification permission on mount
    useEffect(() => {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, []);

    const isNextStop = truck?.is_next_stop && truck.distance_m <= NEXT_STOP_THRESHOLD_M;
    const isNearby = truck && truck.distance_m <= PROXIMITY_THRESHOLD_M;

    return (
        <>
            {/* ===== Full-screen alert — house is next stop ===== */}
            <AnimatePresence>
                {showFullAlert && truck && isNextStop && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0, y: 30 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.8, opacity: 0, y: 30 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                            className="relative mx-4 w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-neutral-900"
                        >
                            {/* Green header */}
                            <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 px-6 pb-8 pt-8 text-center text-white">
                                <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10" />
                                <div className="absolute -left-4 bottom-2 h-16 w-16 rounded-full bg-white/[0.07]" />

                                {/* Pulsing truck icon */}
                                <div className="relative mx-auto mb-4 flex h-20 w-20 items-center justify-center">
                                    <span className="absolute h-20 w-20 animate-ping rounded-full bg-white/20" style={{ animationDuration: '1.5s' }} />
                                    <span className="absolute h-16 w-16 animate-ping rounded-full bg-white/15" style={{ animationDuration: '2s', animationDelay: '0.3s' }} />
                                    <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
                                        <Truck size={32} />
                                    </div>
                                </div>

                                <h2 className="text-xl font-bold">Your house is next!</h2>
                                <p className="mt-1 text-sm text-white/80">Please bring out your trash now</p>
                            </div>

                            {/* Details */}
                            <div className="space-y-3 px-6 py-5">
                                <div className="flex items-center gap-3 rounded-xl bg-neutral-50 p-3 dark:bg-neutral-800/50">
                                    <MapPin size={16} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
                                    <div>
                                        <p className="text-xs text-neutral-400">Distance</p>
                                        <p className="text-sm font-bold text-neutral-900 dark:text-white">{truck.distance_m} meters away</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 rounded-xl bg-neutral-50 p-3 dark:bg-neutral-800/50">
                                    <Truck size={16} className="shrink-0 text-blue-600 dark:text-blue-400" />
                                    <div>
                                        <p className="text-xs text-neutral-400">Collector</p>
                                        <p className="text-sm font-bold text-neutral-900 dark:text-white">{truck.collector ?? 'Unknown'}</p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setShowFullAlert(false)}
                                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition-all active:scale-[0.97]"
                                >
                                    <Bell size={16} />
                                    Got it, preparing trash!
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ===== Banner — truck nearby (not next stop) ===== */}
            <AnimatePresence>
                {isNearby && !dismissed && !showFullAlert && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="pointer-events-none fixed inset-x-0 top-20 z-50 flex justify-center px-4"
                    >
                        <div className="pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-2xl border border-emerald-200 bg-white p-4 shadow-xl shadow-emerald-600/10 dark:border-emerald-800/50 dark:bg-neutral-900">
                            <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-600/30">
                                <Truck size={20} />
                                {truck?.stops_away !== undefined && truck.stops_away <= 3 && (
                                    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-white ring-2 ring-white dark:ring-neutral-900">
                                        {truck.stops_away}
                                    </span>
                                )}
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                                    {truck?.is_next_stop ? 'You\'re next!' : 'Garbage truck nearby!'}
                                </p>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                    {truck?.collector ? `${truck.collector} is ` : 'A collector is '}
                                    <b className="text-emerald-700 dark:text-emerald-400">{truck?.distance_m}m</b> away
                                    {truck?.stops_away !== undefined && truck.stops_away > 0 && (
                                        <> · <b>{truck.stops_away}</b> stop{truck.stops_away > 1 ? 's' : ''} before you</>
                                    )}
                                </p>
                            </div>
                            <button
                                onClick={() => setDismissed(true)}
                                className="shrink-0 rounded-lg p-1.5 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

/* ── Vibration ── */
function vibrate(pattern: number[]) {
    try {
        if ('vibrate' in navigator) {
            navigator.vibrate(pattern);
        }
    } catch { /* not supported */ }
}

/* ── Alert sound (urgent — house is next) ── */
function playAlertSound() {
    try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new AudioCtx();
        const now = ctx.currentTime;

        // Three ascending tones
        [880, 1100, 1320].forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.value = freq;
            osc.type = 'sine';
            gain.gain.setValueAtTime(0.2, now + i * 0.2);
            gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.2 + 0.18);
            osc.start(now + i * 0.2);
            osc.stop(now + i * 0.2 + 0.2);
        });

        setTimeout(() => ctx.close(), 1000);
    } catch { /* ignore */ }
}

/* ── Notify sound (nearby — softer) ── */
function playNotifySound() {
    try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 880;
        osc.type = 'sine';
        gain.gain.value = 0.15;
        osc.start();
        setTimeout(() => { osc.stop(); ctx.close(); }, 300);
    } catch { /* ignore */ }
}

/* ── Browser notification ── */
async function sendNotification(title: string, body: string) {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'default') {
        try { await Notification.requestPermission(); } catch { /* ignore */ }
    }
    if (Notification.permission === 'granted') {
        try {
            new Notification(title, {
                body,
                icon: '/favicon.ico',
                tag: 'nearby-truck',
            } as NotificationOptions);
        } catch { /* ignore */ }
    }
}
