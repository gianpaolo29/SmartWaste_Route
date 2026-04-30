import { Head, Link, router } from '@inertiajs/react';
import { CollectorBottombar } from '@/components/collector-bottombar';
import { useIsMobile } from '@/hooks/use-mobile';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    APIProvider,
    Map,
    AdvancedMarker,
    useMap,
} from '@vis.gl/react-google-maps';
import { Truck, Navigation, MapPin, CheckCircle2, SkipForward, AlertTriangle, Clock, ChevronRight, ChevronLeft, ClipboardList, Volume2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TuyBoundary } from '@/components/tuy-boundary';
import { confirm, errorAlert, promptText, toast } from '@/lib/notify';

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

/* ── RouteLine: draws the full collection route ── */
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

/* ── NavStep type ── */
type NavStep = {
    instruction: string;       // HTML stripped text like "Turn right onto Main St"
    distance: number;          // meters
    distanceText: string;      // "200 m"
    maneuver: string;          // "turn-right", "turn-left", etc.
    startLat: number;
    startLng: number;
};

/* ── Strip HTML tags from Google directions ── */
function stripHtml(html: string) {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent ?? div.innerText ?? '';
}

/* ── DirectionLine: road-following line from truck to next stop ── */
function DirectionLine({ from, to, onRouteInfo, onSteps }: {
    from: { lat: number; lng: number };
    to: { lat: number; lng: number };
    onRouteInfo?: (info: { distance: number; duration: number; summary: string }) => void;
    onSteps?: (steps: NavStep[]) => void;
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
                    if (leg) {
                        onRouteInfo?.({
                            distance: leg.distance?.value ?? 0,
                            duration: leg.duration?.value ?? 0,
                            summary: leg.duration?.text ?? '',
                        });
                        // Extract turn-by-turn steps
                        if (leg.steps && onSteps) {
                            const steps: NavStep[] = leg.steps.map((s) => ({
                                instruction: stripHtml(s.instructions ?? ''),
                                distance: s.distance?.value ?? 0,
                                distanceText: s.distance?.text ?? '',
                                maneuver: (s as unknown as { maneuver?: string }).maneuver ?? '',
                                startLat: s.start_location?.lat() ?? 0,
                                startLng: s.start_location?.lng() ?? 0,
                            }));
                            onSteps(steps);
                        }
                    }
                }
            },
        );
        lastFromRef.current = from;
        lastToRef.current = to;
    }, [map, from, to, onRouteInfo, onSteps]);

    useEffect(() => {
        if (!map) return;

        const targetChanged = !lastToRef.current || lastToRef.current.lat !== to.lat || lastToRef.current.lng !== to.lng;

        let truckMovedEnough = false;
        if (lastFromRef.current) {
            const d = haversine(lastFromRef.current, from);
            truckMovedEnough = d > 30;
        } else {
            truckMovedEnough = true;
        }

        if (targetChanged || truckMovedEnough) {
            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = setTimeout(requestRoute, targetChanged ? 0 : 800);
        }

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [map, from.lat, from.lng, to.lat, to.lng, requestRoute]);

    useEffect(() => {
        return () => {
            rendererRef.current?.setMap(null);
            rendererRef.current = null;
        };
    }, []);

    return null;
}

/* ── MapFocus ── */
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
    const isMobile = useIsMobile();
    const [status, setStatus] = useState(plan.status);
    const [gpsDenied, setGpsDenied] = useState(false);
    const [stops, setStops] = useState<Stop[]>(plan.stops);
    const [me, setMe] = useState<{ lat: number; lng: number } | null>(null);
    const [heading, setHeading] = useState(0);
    const [roadInfo, setRoadInfo] = useState<{ distance: number; duration: number; summary: string } | null>(null);
    const [navSteps, setNavSteps] = useState<NavStep[]>([]);
    const [voiceEnabled, setVoiceEnabled] = useState(true);
    const [currentInstruction, setCurrentInstruction] = useState<string | null>(null);
    const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
    const [selectedVoiceIdx, setSelectedVoiceIdx] = useState<number>(-1); // -1 = auto
    const [showVoicePicker, setShowVoicePicker] = useState(false);
    const lastSpokenRef = useRef<string>('');
    const prevPos = useRef<{ lat: number; lng: number } | null>(null);
    const watchRef = useRef<number | null>(null);
    const lastPingRef = useRef<number>(0);

    const center = useMemo(() => {
        if (stops.length === 0) return { lat: 13.9333, lng: 120.7333 };
        const lat = stops.reduce((s, x) => s + x.lat, 0) / stops.length;
        const lng = stops.reduce((s, x) => s + x.lng, 0) / stops.length;
        return { lat, lng };
    }, [stops]);

    // Sort uncollected stops by distance from current position
    const sortedStops = useMemo(() => {
        const done = stops.filter((s) => !!s.collection_status);
        const pending = stops.filter((s) => !s.collection_status);
        if (!me || pending.length === 0) return stops;

        // Sort pending by distance from truck (nearest first)
        const sorted = [...pending].sort((a, b) => haversine(me, a) - haversine(me, b));
        return [...done, ...sorted];
    }, [stops, me]);

    const nextStop = useMemo(() => {
        if (!me) return stops.find((s) => !s.collection_status) ?? null;
        const pending = stops.filter((s) => !s.collection_status);
        if (pending.length === 0) return null;
        // Nearest uncollected stop
        return pending.reduce((closest, s) =>
            haversine(me, s) < haversine(me, closest) ? s : closest
        , pending[0]);
    }, [stops, me]);

    const navInfo = useMemo(() => {
        if (!me || !nextStop) return null;
        const dist = haversine(me, nextStop);
        const bearing = getBearing(me, nextStop);
        const compass = getCompassDirection(bearing);
        return { distance: dist, bearing, compass, stop: nextStop };
    }, [me, nextStop]);

    // Total remaining distance: truck → next stop → remaining stops
    const remainingDistance = useMemo(() => {
        const pending = stops.filter((s) => !s.collection_status);
        if (pending.length === 0) return 0;
        let total = 0;
        const startPoint = me ?? (pending.length > 0 ? pending[0] : null);
        if (!startPoint) return 0;
        total += haversine(startPoint, pending[0]);
        for (let i = 1; i < pending.length; i++) {
            total += haversine(pending[i - 1], pending[i]);
        }
        return total;
    }, [me, stops]);

    const remainingStops = useMemo(() => stops.filter((s) => !s.collection_status).length, [stops]);

    // ── Voice navigation ──
    const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
    const lastSpokenStepRef = useRef<number>(-1); // track by step index, not text
    const lastSpokenStopRef = useRef<number>(-1); // track which stop was announced

    // Load voices (they load async on many browsers)
    useEffect(() => {
        if (!window.speechSynthesis) return;
        const loadVoices = () => {
            const all = window.speechSynthesis.getVoices();
            voicesRef.current = all;
            // Filter to English voices for the picker
            const english = all.filter((v) => v.lang.startsWith('en'));
            setAvailableVoices(english.length > 0 ? english : all);
        };
        loadVoices();
        window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
        return () => window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
    }, []);

    const speak = useCallback((text: string, force = false) => {
        if (!voiceEnabled || !window.speechSynthesis || !text) return;
        if (!force && text === lastSpokenRef.current) return;
        lastSpokenRef.current = text;

        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.95;
        utterance.pitch = 1;
        utterance.volume = 1;
        utterance.lang = 'en-US';

        // Use selected voice or default to Google UK English Female
        if (selectedVoiceIdx >= 0 && availableVoices[selectedVoiceIdx]) {
            utterance.voice = availableVoices[selectedVoiceIdx];
        } else {
            const voices = voicesRef.current;
            const preferred =
                voices.find((v) => v.name.toLowerCase().includes('google uk english female')) ??
                voices.find((v) => v.name.toLowerCase().includes('google uk english')) ??
                voices.find((v) => v.lang === 'en-GB' && v.localService) ??
                voices.find((v) => v.lang.startsWith('en') && v.localService) ??
                voices.find((v) => v.lang.startsWith('en'));
            if (preferred) utterance.voice = preferred;
        }

        window.speechSynthesis.speak(utterance);
    }, [voiceEnabled, selectedVoiceIdx, availableVoices]);

    const previewVoice = (idx: number) => {
        if (!window.speechSynthesis) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance('Turn right in 200 meters.');
        utterance.rate = 0.95;
        utterance.volume = 1;
        if (idx >= 0 && availableVoices[idx]) {
            utterance.voice = availableVoices[idx];
        }
        window.speechSynthesis.speak(utterance);
    };

    // Announce route started
    useEffect(() => {
        if (status === 'in_progress' && me && nextStop) {
            speak(`Route started. Head to stop ${nextStop.stop_no}. ${nextStop.stop_address ?? ''}`, true);
        }
        // Only run once when GPS first locks
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status === 'in_progress' && !!me]);

    // Find the upcoming step and speak turn-by-turn directions
    useEffect(() => {
        if (!me || navSteps.length === 0 || status !== 'in_progress') return;

        // Find the closest upcoming step
        let closestIdx = 0;
        let closestDist = Infinity;
        for (let i = 0; i < navSteps.length; i++) {
            const d = haversine(me, { lat: navSteps[i].startLat, lng: navSteps[i].startLng });
            if (d < closestDist) {
                closestDist = d;
                closestIdx = i;
            }
        }

        const step = navSteps[closestIdx];
        if (!step) return;

        // Always show the current instruction text
        setCurrentInstruction(step.instruction);

        // Only speak if this is a new step we haven't spoken yet
        if (closestIdx === lastSpokenStepRef.current) return;

        // Speak when within 80m of a turn that has a maneuver
        if (closestDist < 80 && step.maneuver) {
            lastSpokenStepRef.current = closestIdx;
            speak(`In ${step.distanceText}, ${step.instruction}`);
        }
        // Speak any instruction when very close
        else if (closestDist < 20) {
            lastSpokenStepRef.current = closestIdx;
            speak(step.instruction);
        }
    }, [me, navSteps, status, speak]);

    // Reset spoken step when next stop changes (new directions fetched)
    useEffect(() => {
        lastSpokenStepRef.current = -1;
    }, [nextStop?.id]);

    // Announce when arriving at a stop
    useEffect(() => {
        if (!me || !nextStop || status !== 'in_progress') return;
        if (lastSpokenStopRef.current === nextStop.id) return;
        const dist = haversine(me, nextStop);
        if (dist < 30) {
            lastSpokenStopRef.current = nextStop.id;
            speak(`Arriving at stop ${nextStop.stop_no}. ${nextStop.stop_address ?? ''}`);
        }
    }, [me, nextStop, status, speak]);

    // Announce when all stops are done
    useEffect(() => {
        if (status === 'in_progress' && remainingStops === 0) {
            speak('All stops collected. You can now submit your report.', true);
        }
    }, [remainingStops, status, speak]);

    // Cleanup speech on unmount
    useEffect(() => {
        return () => {
            window.speechSynthesis?.cancel();
        };
    }, []);

    const beginGpsWatch = () => {
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
                setGpsDenied(false);

                const now = Date.now();
                if (now - lastPingRef.current > 3000) {
                    lastPingRef.current = now;
                    post(`/collector/routes/${plan.id}/ping`, { lat, lng });
                }
            },
            (err) => {
                console.error('GPS error', err);
                if (err.code === err.PERMISSION_DENIED) {
                    setGpsDenied(true);
                } else {
                    toast('error', 'GPS error: ' + (err.message ?? 'unknown'));
                }
            },
            { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 },
        );
    };

    const retryGps = async () => {
        if (watchRef.current !== null) {
            navigator.geolocation.clearWatch(watchRef.current);
            watchRef.current = null;
        }
        setGpsDenied(false);
        beginGpsWatch();
    };

    const startTracking = async () => {
        if (!navigator.geolocation)
            return errorAlert('Not supported', 'Geolocation is not available on this device.');
        if (!(await confirm('Start route?', 'We will track your GPS location while the route is active.', 'Start')))
            return;

        // Check permission first
        try {
            const perm = await navigator.permissions.query({ name: 'geolocation' });
            if (perm.state === 'denied') {
                setGpsDenied(true);
                await errorAlert('Location Required', 'Please enable location access in your browser or device settings, then try again.');
                return;
            }
        } catch {
            // permissions API not supported, continue anyway
        }

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
        router.reload({ only: ['plan'] });
        toast('success', 'Route started');

        // Unlock speech synthesis on mobile (requires user gesture)
        if (window.speechSynthesis) {
            const unlock = new SpeechSynthesisUtterance('');
            unlock.volume = 0;
            window.speechSynthesis.speak(unlock);
        }

        beginGpsWatch();
    };

    const submitReport = async () => {
        if (!(await confirm('Submit report?', 'This marks the route as completed and opens the report form.', 'Submit')))
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
        toast('success', 'Route completed');
        router.visit(`/collector/reports/create?route_id=${plan.id}`);
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
        setRoadInfo(null);
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

    // Auto-resume GPS tracking if route is already in_progress (e.g. page reload)
    useEffect(() => {
        if (plan.status === 'in_progress' && navigator.geolocation && watchRef.current === null) {
            beginGpsWatch();
        }
        return () => {
            if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const collectedCount = stops.filter((s) => s.collection_status === 'collected').length;
    const progress = stops.length > 0 ? (collectedCount / stops.length) * 100 : 0;

    return (
        <>
            <Head title={`Route #${plan.id}`} />
            <div className="flex min-h-screen flex-col bg-neutral-50 dark:bg-neutral-950">

                {/* ===== Top bar ===== */}
                <div className="sticky top-0 z-40 flex items-center gap-3 border-b border-neutral-200/50 bg-white/80 px-4 py-3 backdrop-blur-xl dark:border-white/[0.06] dark:bg-neutral-950/80">
                    <Link href="/collector/routes" className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-neutral-600 transition-colors hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400">
                        <ChevronLeft size={20} />
                    </Link>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-base font-bold tracking-tight truncate">{plan.zone?.name} <span className="font-normal text-neutral-400">({plan.zone?.barangay})</span></h1>
                        <div className="flex items-center gap-2 text-xs text-neutral-400">
                            <Clock size={11} />
                            <span>{plan.route_date}</span>
                        </div>
                    </div>
                    {/* Voice controls */}
                    {status === 'in_progress' && (
                        <div className="relative flex items-center gap-1.5">
                            {/* Voice picker trigger */}
                            <button
                                onClick={() => setShowVoicePicker((v) => !v)}
                                className="flex h-9 items-center gap-1.5 rounded-full bg-neutral-100 px-3 text-neutral-600 transition-colors hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700"
                            >
                                <ChevronRight size={14} className={`transition-transform ${showVoicePicker ? 'rotate-90' : ''}`} />
                                <span className="text-[11px] font-semibold">
                                    {selectedVoiceIdx >= 0 && availableVoices[selectedVoiceIdx]
                                        ? availableVoices[selectedVoiceIdx].name.split(' ').slice(0, 2).join(' ')
                                        : 'Auto'}
                                </span>
                            </button>

                            {/* Voice picker dropdown (absolute) */}
                            <AnimatePresence>
                                {showVoicePicker && (
                                    <>
                                        {/* Backdrop to close */}
                                        <div className="fixed inset-0 z-40" onClick={() => setShowVoicePicker(false)} />
                                        <motion.div
                                            initial={{ opacity: 0, y: -8, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: -8, scale: 0.95 }}
                                            transition={{ duration: 0.15 }}
                                            className="absolute right-0 top-11 z-50 w-72 overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-xl shadow-black/10 dark:border-neutral-700 dark:bg-neutral-900 dark:shadow-black/40"
                                        >
                                            <div className="border-b border-neutral-100 px-4 py-2.5 dark:border-neutral-800">
                                                <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">Navigation Voice</p>
                                            </div>
                                            <div className="max-h-56 overflow-y-auto p-1.5">
                                                {/* Auto option */}
                                                <button
                                                    onClick={() => { setSelectedVoiceIdx(-1); previewVoice(-1); setShowVoicePicker(false); }}
                                                    className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                                                        selectedVoiceIdx === -1
                                                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                                                            : 'text-neutral-600 hover:bg-neutral-50 dark:text-neutral-400 dark:hover:bg-neutral-800/50'
                                                    }`}
                                                >
                                                    <Volume2 size={14} className="shrink-0" />
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-sm font-medium">Auto</p>
                                                    </div>
                                                    {selectedVoiceIdx === -1 && <CheckCircle2 size={14} className="shrink-0 text-emerald-600" />}
                                                </button>

                                                {availableVoices.map((voice, idx) => (
                                                    <button
                                                        key={`${voice.name}-${voice.lang}`}
                                                        onClick={() => { setSelectedVoiceIdx(idx); previewVoice(idx); setShowVoicePicker(false); }}
                                                        className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                                                            selectedVoiceIdx === idx
                                                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                                                                : 'text-neutral-600 hover:bg-neutral-50 dark:text-neutral-400 dark:hover:bg-neutral-800/50'
                                                        }`}
                                                    >
                                                        <Volume2 size={14} className="shrink-0" />
                                                        <div className="min-w-0 flex-1">
                                                            <p className="truncate text-sm font-medium">{voice.name}</p>
                                                            <p className="text-[10px] text-neutral-400">{voice.lang}</p>
                                                        </div>
                                                        {selectedVoiceIdx === idx && <CheckCircle2 size={14} className="shrink-0 text-emerald-600" />}
                                                    </button>
                                                ))}

                                                {availableVoices.length === 0 && (
                                                    <p className="px-3 py-4 text-center text-xs text-neutral-400">No voices available</p>
                                                )}
                                            </div>
                                        </motion.div>
                                    </>
                                )}
                            </AnimatePresence>

                            {/* Mute/unmute */}
                            <button
                                onClick={() => {
                                    setVoiceEnabled((v) => !v);
                                    if (voiceEnabled) window.speechSynthesis?.cancel();
                                }}
                                className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
                                    voiceEnabled
                                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400'
                                        : 'bg-neutral-100 text-neutral-400 dark:bg-neutral-800 dark:text-neutral-500'
                                }`}
                            >
                                {voiceEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                            </button>
                        </div>
                    )}
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                        status === 'in_progress'
                            ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                            : status === 'completed'
                            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'
                            : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
                    }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${
                            status === 'in_progress' ? 'bg-blue-500 animate-pulse' : status === 'completed' ? 'bg-emerald-500' : 'bg-neutral-400'
                        }`} />
                        {status === 'in_progress' ? 'Live' : status === 'completed' ? 'Done' : 'Planned'}
                    </span>
                </div>

                {/* ===== Desktop: side-by-side / Mobile: stacked ===== */}
                <div className="flex flex-1 flex-col lg:flex-row lg:h-[calc(100vh-57px)]">

                {/* ===== Map ===== */}
                <div className="relative h-[45vh] w-full shrink-0 lg:h-auto lg:flex-1 lg:order-2">
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

                            {me && nextStop && status === 'in_progress' && (
                                <DirectionLine
                                    from={me}
                                    to={{ lat: nextStop.lat, lng: nextStop.lng }}
                                    onRouteInfo={setRoadInfo}
                                    onSteps={setNavSteps}
                                />
                            )}

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
                                className="absolute bottom-3 left-3 right-3 z-10 lg:bottom-6 lg:left-6 lg:right-auto lg:min-w-[320px]"
                            >
                                <div className="flex items-center gap-3 rounded-2xl border border-white/50 bg-white/95 px-4 py-3 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-neutral-900/95">
                                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 shadow-md shadow-blue-500/20">
                                        <Navigation size={18} className="text-white" style={{ transform: `rotate(${navInfo.bearing}deg)` }} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-baseline gap-2">
                                            <p className="text-lg font-bold tracking-tight">{roadInfo ? formatDistance(roadInfo.distance) : formatDistance(navInfo.distance)}</p>
                                            {roadInfo && <span className="text-xs font-medium text-neutral-400">{roadInfo.summary}</span>}
                                        </div>
                                        <p className="truncate text-xs text-neutral-500">
                                            Head {navInfo.compass} to Stop #{navInfo.stop.stop_no}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Live indicator */}
                    {status === 'in_progress' && me && (
                        <div className="absolute left-3 top-3 z-10 lg:left-6 lg:top-6">
                            <div className="flex items-center gap-2 rounded-xl border border-blue-200/50 bg-white/90 px-3 py-2 shadow-lg backdrop-blur-xl dark:border-blue-800/30 dark:bg-neutral-900/90">
                                <span className="relative flex h-2 w-2">
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-500 opacity-75" />
                                    <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-600" />
                                </span>
                                <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300">TRACKING</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* ===== Sidebar (desktop) / Content below map (mobile) ===== */}
                <div className="flex-1 overflow-y-auto px-4 pb-28 pt-4 lg:order-1 lg:w-[420px] lg:max-w-[420px] lg:flex-none lg:border-r lg:border-neutral-200/50 lg:pb-6 lg:pt-5 lg:px-5 dark:lg:border-white/[0.06]">

                    {/* GPS denied banner */}
                    <AnimatePresence>
                        {gpsDenied && status === 'in_progress' && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="mb-4 overflow-hidden rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-800/40 dark:bg-red-950/30"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 dark:bg-red-900/40">
                                        <MapPin size={20} className="text-red-600 dark:text-red-400" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-semibold text-red-800 dark:text-red-300">Location access required</p>
                                        <p className="mt-0.5 text-xs text-red-600/80 dark:text-red-400/80">
                                            Please enable location in your browser/device settings to track your route.
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={retryGps}
                                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all active:scale-[0.97] hover:bg-red-700"
                                >
                                    <Navigation size={14} />
                                    Try Again
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Direction / Navigation panel — only when in_progress */}
                    <AnimatePresence>
                        {status === 'in_progress' && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="mb-4 space-y-3"
                            >
                                {/* GPS acquiring state */}
                                {!me && nextStop && (
                                    <div className="overflow-hidden rounded-2xl border border-blue-100 bg-white p-4 shadow-sm dark:border-blue-900/30 dark:bg-neutral-900">
                                        <div className="flex items-center gap-3">
                                            <div className="relative flex h-12 w-12 shrink-0 items-center justify-center">
                                                <span className="absolute h-12 w-12 animate-ping rounded-full bg-blue-500/20" style={{ animationDuration: '2s' }} />
                                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/50">
                                                    <Navigation size={20} className="animate-pulse text-blue-600 dark:text-blue-400" />
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-neutral-900 dark:text-white">Acquiring GPS signal...</p>
                                                <p className="mt-0.5 text-xs text-neutral-400">Make sure location is enabled on your device</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Main direction card — only when GPS is active */}
                                {me && nextStop && (
                                    <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 p-4 text-white shadow-xl shadow-blue-600/25">
                                        {/* Top: distance + ETA */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
                                                    <Navigation size={22} className="text-white" style={{ transform: `rotate(${navInfo?.bearing ?? 0}deg)` }} />
                                                </div>
                                                <div>
                                                    <p className="text-2xl font-bold tracking-tight">
                                                        {roadInfo ? formatDistance(roadInfo.distance) : navInfo ? formatDistance(navInfo.distance) : '—'}
                                                    </p>
                                                    <p className="text-xs text-blue-200">
                                                        {roadInfo ? roadInfo.summary : navInfo ? `Head ${navInfo.compass}` : ''}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 text-lg font-bold backdrop-blur-sm">
                                                {nextStop.stop_no}
                                            </div>
                                        </div>

                                        {/* Current turn instruction */}
                                        {currentInstruction && (
                                            <div className="mt-3 flex items-center gap-2.5 rounded-xl bg-white/15 px-3 py-2.5 backdrop-blur-sm">
                                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/20">
                                                    {voiceEnabled ? <Volume2 size={14} /> : <Navigation size={14} />}
                                                </div>
                                                <p className="text-sm font-medium leading-tight">{currentInstruction}</p>
                                            </div>
                                        )}

                                        {/* Destination */}
                                        <div className="mt-2 flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2.5 backdrop-blur-sm">
                                            <MapPin size={14} className="shrink-0 text-blue-200" />
                                            <div className="min-w-0 flex-1">
                                                <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-300">Next stop</p>
                                                <p className="truncate text-sm font-semibold">{nextStop.stop_address ?? 'No address'}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Route overview stats */}
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="flex flex-col items-center rounded-2xl border border-neutral-100 bg-white p-3 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                                        <p className="text-lg font-bold text-neutral-900 dark:text-white">{remainingStops}</p>
                                        <p className="text-[10px] font-medium text-neutral-400">Stops Left</p>
                                    </div>
                                    <div className="flex flex-col items-center rounded-2xl border border-neutral-100 bg-white p-3 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                                        <p className="text-lg font-bold text-neutral-900 dark:text-white">{formatDistance(remainingDistance)}</p>
                                        <p className="text-[10px] font-medium text-neutral-400">Total Left</p>
                                    </div>
                                    <div className="flex flex-col items-center rounded-2xl border border-neutral-100 bg-white p-3 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                                        <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{collectedCount}/{stops.length}</p>
                                        <p className="text-[10px] font-medium text-neutral-400">Collected</p>
                                    </div>
                                </div>

                                {/* Progress bar */}
                                <div>
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-medium text-neutral-500">Progress</span>
                                        <span className="font-bold text-emerald-600">{Math.round(progress)}%</span>
                                    </div>
                                    <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
                                        <motion.div
                                            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${progress}%` }}
                                            transition={{ duration: 0.5, ease: 'easeOut' }}
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Action button */}
                    <div className="mb-5">
                        {status === 'planned' && (
                            <button
                                onClick={startTracking}
                                className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#1b4332] to-[#2d6a4f] px-4 py-4 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition-all active:scale-[0.97]"
                            >
                                <Truck size={18} />
                                Start Route
                                <ChevronRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                            </button>
                        )}
                        {status === 'in_progress' && (
                            <button
                                onClick={submitReport}
                                className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-4 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition-all active:scale-[0.97]"
                            >
                                <ClipboardList size={18} />
                                Submit Report
                            </button>
                        )}
                        {status === 'completed' && (
                            <div className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-50 px-4 py-4 text-sm font-semibold text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400">
                                <CheckCircle2 size={18} />
                                Route Completed
                            </div>
                        )}
                    </div>

                    {/* Stops header */}
                    <div className="mb-3 flex items-center gap-2">
                        <MapPin size={15} className="text-emerald-600 dark:text-emerald-400" />
                        <span className="text-sm font-bold tracking-tight">Collection Stops</span>
                        <span className="ml-auto rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400">
                            {collectedCount}/{stops.length}
                        </span>
                    </div>

                    {/* Stops — one by one cards, sorted by nearest */}
                    <div className="space-y-3">
                        {sortedStops.map((s, idx) => {
                            const isDone = !!s.collection_status;
                            const isNext = nextStop?.id === s.id && status === 'in_progress';
                            const badge = s.collection_status ? STATUS_BADGE[s.collection_status] : null;
                            const BadgeIcon = badge?.icon;
                            const distFromMe = me && !isDone ? haversine(me, s) : null;

                            return (
                                <motion.div
                                    key={s.id}
                                    layout
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.03, layout: { type: 'spring', stiffness: 300, damping: 30 } }}
                                    className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition-all dark:bg-neutral-900 ${
                                        isNext
                                            ? 'border-blue-200 ring-2 ring-blue-100 dark:border-blue-800/40 dark:ring-blue-900/20'
                                            : isDone
                                            ? 'border-neutral-100 opacity-75 dark:border-neutral-800'
                                            : 'border-neutral-100 dark:border-neutral-800'
                                    }`}
                                >
                                    <div className="flex items-start gap-3 p-4">
                                        {/* Stop number */}
                                        <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-sm font-bold shadow-sm ${
                                            isDone
                                                ? 'bg-neutral-100 text-neutral-400 dark:bg-neutral-800 dark:text-neutral-500'
                                                : isNext
                                                ? 'bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-blue-500/30'
                                                : 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-emerald-500/20'
                                        }`}>
                                            {isDone ? <CheckCircle2 size={16} /> : s.stop_no}
                                        </div>

                                        {/* Info */}
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className={`text-sm font-semibold ${isDone ? 'text-neutral-400 line-through dark:text-neutral-500' : 'text-neutral-800 dark:text-neutral-200'}`}>
                                                    {s.stop_address ?? 'No address'}
                                                </p>
                                                {badge && BadgeIcon && (
                                                    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${badge.bg} ${badge.text}`}>
                                                        <BadgeIcon size={10} />
                                                        {s.collection_status}
                                                    </span>
                                                )}
                                                {isNext && (
                                                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                                                        <Navigation size={9} />
                                                        NEAREST
                                                    </span>
                                                )}
                                            </div>

                                            <div className="mt-0.5 flex items-center gap-2 text-xs text-neutral-400">
                                                <span>Stop #{s.stop_no}</span>
                                                {distFromMe !== null && (
                                                    <>
                                                        <span className="h-1 w-1 rounded-full bg-neutral-300 dark:bg-neutral-600" />
                                                        <span className="font-medium text-blue-600 dark:text-blue-400">{formatDistance(distFromMe)}</span>
                                                    </>
                                                )}
                                            </div>

                                            {/* Action buttons for uncollected stops */}
                                            {status === 'in_progress' && !s.collection_status && (
                                                <div className="mt-3 flex flex-wrap gap-2">
                                                    <button
                                                        onClick={() => markStop(s, 'collected')}
                                                        className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition-all active:scale-[0.96] hover:bg-emerald-700"
                                                    >
                                                        <CheckCircle2 size={13} />
                                                        Collected
                                                    </button>
                                                    <button
                                                        onClick={() => markStop(s, 'skipped')}
                                                        className="inline-flex items-center gap-1.5 rounded-xl bg-neutral-100 px-3.5 py-2 text-xs font-semibold text-neutral-600 transition-all active:scale-[0.96] hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300"
                                                    >
                                                        <SkipForward size={13} />
                                                        Skip
                                                    </button>
                                                    <button
                                                        onClick={() => reportMissed(s)}
                                                        className="inline-flex items-center gap-1.5 rounded-xl bg-red-50 px-3.5 py-2 text-xs font-semibold text-red-600 transition-all active:scale-[0.96] hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400"
                                                    >
                                                        <AlertTriangle size={13} />
                                                        Missed
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>

                </div>{/* end desktop flex row */}

                {isMobile && <CollectorBottombar />}
            </div>
        </>
    );
}
