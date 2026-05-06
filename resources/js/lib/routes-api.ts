/**
 * Google Maps routing helpers.
 * Tries the new Routes API (computeRoutes) first, falls back to DirectionsService.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

type LatLng = { lat: number; lng: number };

type RouteStep = {
    instruction: string;
    distance: number;
    distanceText: string;
    maneuver: string;
    startLat: number;
    startLng: number;
};

type RouteResult = {
    polylinePath: google.maps.LatLng[];
    distance: number;       // meters
    duration: number;       // seconds
    durationText: string;
    steps: RouteStep[];
};

function formatDuration(seconds: number): string {
    if (seconds < 60) return `${seconds} sec`;
    const mins = Math.round(seconds / 60);
    if (mins < 60) return `${mins} min`;
    const hrs = Math.floor(mins / 60);
    const rem = mins % 60;
    return rem > 0 ? `${hrs} hr ${rem} min` : `${hrs} hr`;
}

function formatDistanceText(meters: number): string {
    if (meters < 1000) return `${Math.round(meters)} m`;
    return `${(meters / 1000).toFixed(1)} km`;
}

function stripHtml(html: string): string {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent ?? div.innerText ?? '';
}

/* ── Fallback: DirectionsService (deprecated but reliable) ── */
function computeRouteViaDirections(
    origin: LatLng,
    destination: LatLng,
    waypoints?: LatLng[],
    options?: { optimizeWaypoints?: boolean },
): Promise<RouteResult | null> {
    return new Promise((resolve) => {
        const service = new google.maps.DirectionsService();
        const request: google.maps.DirectionsRequest = {
            origin,
            destination,
            travelMode: google.maps.TravelMode.DRIVING,
        };

        if (waypoints && waypoints.length > 0) {
            request.waypoints = waypoints.map((w) => ({ location: w, stopover: true }));
            if (options?.optimizeWaypoints) {
                request.optimizeWaypoints = true;
            }
        }

        service.route(request, (result, status) => {
            if (status !== 'OK' || !result?.routes?.[0]) {
                resolve(null);
                return;
            }

            const route = result.routes[0];
            const path = route.overview_path ?? [];
            const polylinePath = path.map((p) => new google.maps.LatLng(p.lat(), p.lng()));

            let totalDistance = 0;
            let totalDuration = 0;
            const steps: RouteStep[] = [];

            for (const leg of route.legs ?? []) {
                totalDistance += leg.distance?.value ?? 0;
                totalDuration += leg.duration?.value ?? 0;

                for (const step of leg.steps ?? []) {
                    steps.push({
                        instruction: stripHtml(step.instructions ?? ''),
                        distance: step.distance?.value ?? 0,
                        distanceText: step.distance?.text ?? formatDistanceText(step.distance?.value ?? 0),
                        maneuver: (step as any).maneuver ?? '',
                        startLat: step.start_location?.lat() ?? 0,
                        startLng: step.start_location?.lng() ?? 0,
                    });
                }
            }

            resolve({
                polylinePath,
                distance: totalDistance,
                duration: totalDuration,
                durationText: formatDuration(totalDuration),
                steps,
            });
        });
    });
}

/* ── Primary: Routes API (new, non-deprecated) ── */
async function computeRouteViaRoutesAPI(
    origin: LatLng,
    destination: LatLng,
    waypoints?: LatLng[],
    options?: { optimizeWaypoints?: boolean },
): Promise<RouteResult | null> {
    const lib = await google.maps.importLibrary('routes') as any;
    const Route = lib.Route;
    if (!Route?.computeRoutes) throw new Error('Routes API not available');

    const toWaypoint = (pos: LatLng) => ({ location: { latLng: { latitude: pos.lat, longitude: pos.lng } } });

    const request: any = {
        origin: toWaypoint(origin),
        destination: toWaypoint(destination),
        travelMode: (google.maps as any).routes.RouteTravelMode.DRIVE,
        polylineEncoding: 'ENCODED_POLYLINE',
    };

    if (waypoints && waypoints.length > 0) {
        request.intermediates = waypoints.map(toWaypoint);
        if (options?.optimizeWaypoints) request.optimizeWaypointOrder = true;
    }

    const fieldMask = 'routes.polyline,routes.legs.distanceMeters,routes.legs.duration,routes.legs.steps.navigationInstruction,routes.legs.steps.distanceMeters,routes.legs.steps.startLocation,routes.legs.steps.localizedValues';
    const response = await Route.computeRoutes(request, { fieldMask });

    if (!response?.routes?.[0]) return null;

    const route = response.routes[0];
    const encoded = route.polyline?.encodedPolyline;
    const polylinePath = encoded ? google.maps.geometry.encoding.decodePath(encoded) : [];

    let totalDistance = 0;
    let totalDuration = 0;
    const steps: RouteStep[] = [];

    for (const leg of route.legs ?? []) {
        totalDistance += leg.distanceMeters ?? 0;
        const durStr: string = leg.duration ?? '0s';
        totalDuration += parseInt(durStr.replace('s', ''), 10) || 0;

        for (const step of (leg.steps ?? [])) {
            const nav = step.navigationInstruction;
            steps.push({
                instruction: nav?.instructions ?? '',
                distance: step.distanceMeters ?? 0,
                distanceText: step.localizedValues?.distance?.text ?? formatDistanceText(step.distanceMeters ?? 0),
                maneuver: nav?.maneuver ?? '',
                startLat: step.startLocation?.latLng?.latitude ?? 0,
                startLng: step.startLocation?.latLng?.longitude ?? 0,
            });
        }
    }

    return { polylinePath, distance: totalDistance, duration: totalDuration, durationText: formatDuration(totalDuration), steps };
}

/* ── Public API: tries Routes API first, falls back to DirectionsService ── */
let useDirectionsFallback = false;

export async function computeRoute(
    origin: LatLng,
    destination: LatLng,
    waypoints?: LatLng[],
    options?: { optimizeWaypoints?: boolean },
): Promise<RouteResult | null> {
    // If we already know Routes API doesn't work, skip straight to fallback
    if (!useDirectionsFallback) {
        try {
            const result = await computeRouteViaRoutesAPI(origin, destination, waypoints, options);
            if (result) return result;
        } catch (err) {
            console.warn('Routes API unavailable, falling back to DirectionsService:', err);
            useDirectionsFallback = true;
        }
    }

    // Fallback
    try {
        return await computeRouteViaDirections(origin, destination, waypoints, options);
    } catch (err) {
        console.warn('DirectionsService error:', err);
        return null;
    }
}

/**
 * Draw a polyline on the map.
 */
export function drawPolyline(
    map: google.maps.Map,
    path: google.maps.LatLng[],
    options?: { color?: string; weight?: number; opacity?: number; zIndex?: number },
): google.maps.Polyline {
    return new google.maps.Polyline({
        path,
        strokeColor: options?.color ?? '#059669',
        strokeWeight: options?.weight ?? 5,
        strokeOpacity: options?.opacity ?? 0.5,
        zIndex: options?.zIndex ?? 1,
        map,
    });
}
