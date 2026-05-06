/**
 * Google Maps Routes API helpers (replaces deprecated DirectionsService/DirectionsRenderer).
 * Uses google.maps.routes.Route.computeRoutes() + google.maps.Polyline for rendering.
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

let routeLib: any = null;

async function getRouteLib() {
    if (!routeLib) {
        routeLib = await google.maps.importLibrary('routes');
    }
    return routeLib;
}

function toRouteWaypoint(pos: LatLng) {
    return { location: { latLng: { latitude: pos.lat, longitude: pos.lng } } };
}

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

/**
 * Compute a driving route between two points with optional waypoints.
 */
export async function computeRoute(
    origin: LatLng,
    destination: LatLng,
    waypoints?: LatLng[],
    options?: { optimizeWaypoints?: boolean },
): Promise<RouteResult | null> {
    try {
        const lib = await getRouteLib();
        const Route = lib.Route;

        const request: any = {
            origin: toRouteWaypoint(origin),
            destination: toRouteWaypoint(destination),
            travelMode: (google.maps as any).routes.RouteTravelMode.DRIVE,
            polylineEncoding: 'ENCODED_POLYLINE',
        };

        if (waypoints && waypoints.length > 0) {
            request.intermediates = waypoints.map(toRouteWaypoint);
            if (options?.optimizeWaypoints) {
                request.optimizeWaypointOrder = true;
            }
        }

        // Request step-level details
        const fieldMask = 'routes.polyline,routes.legs.distanceMeters,routes.legs.duration,routes.legs.steps.navigationInstruction,routes.legs.steps.distanceMeters,routes.legs.steps.startLocation,routes.legs.steps.localizedValues,routes.optimizedIntermediateWaypointIndex';

        const response = await Route.computeRoutes(request, { fieldMask });

        if (!response?.routes?.[0]) return null;

        const route = response.routes[0];
        const encoded = route.polyline?.encodedPolyline;
        const polylinePath = encoded
            ? google.maps.geometry.encoding.decodePath(encoded)
            : [];

        // Aggregate leg data
        const legs = route.legs ?? [];
        let totalDistance = 0;
        let totalDuration = 0;
        const steps: RouteStep[] = [];

        for (const leg of legs) {
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

        return {
            polylinePath,
            distance: totalDistance,
            duration: totalDuration,
            durationText: formatDuration(totalDuration),
            steps,
        };
    } catch (err) {
        console.warn('computeRoute error:', err);
        return null;
    }
}

/**
 * Draw a polyline on the map. Returns the Polyline instance for cleanup.
 */
export function drawPolyline(
    map: google.maps.Map,
    path: google.maps.LatLng[],
    options?: { color?: string; weight?: number; opacity?: number; zIndex?: number },
): google.maps.Polyline {
    const polyline = new google.maps.Polyline({
        path,
        strokeColor: options?.color ?? '#059669',
        strokeWeight: options?.weight ?? 5,
        strokeOpacity: options?.opacity ?? 0.5,
        zIndex: options?.zIndex ?? 1,
        map,
    });
    return polyline;
}
