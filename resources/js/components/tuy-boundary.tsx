import { useEffect, useState } from 'react';
import { useMap } from '@vis.gl/react-google-maps';

type BoundaryData = {
    paths: { lat: number; lng: number }[][];
    bounds: { north: number; south: number; east: number; west: number } | null;
};

let cached: BoundaryData | null = null;
let inFlight: Promise<BoundaryData> | null = null;

async function loadBoundary(): Promise<BoundaryData> {
    if (cached) return cached;
    if (inFlight) return inFlight;
    inFlight = fetch('/tuy-boundary', { headers: { Accept: 'application/json' } })
        .then((r) => r.json())
        .then((data: BoundaryData) => {
            cached = data;
            return data;
        });
    return inFlight;
}

export function TuyBoundary() {
    const map = useMap();
    const [data, setData] = useState<BoundaryData | null>(cached);

    useEffect(() => {
        if (!data) loadBoundary().then(setData);
    }, [data]);

    useEffect(() => {
        if (!map || !data || data.paths.length === 0) return;

        const polygon = new google.maps.Polygon({
            paths: data.paths,
            strokeColor: '#059669',
            strokeOpacity: 0.8,
            strokeWeight: 3,
            fillColor: '#059669',
            fillOpacity: 0.03,
            clickable: false,
            zIndex: 0,
            map,
        });

        if (data.bounds) {
            const bounds = new google.maps.LatLngBounds(
                { lat: data.bounds.south, lng: data.bounds.west },
                { lat: data.bounds.north, lng: data.bounds.east },
            );
            map.fitBounds(bounds, 20);
            map.setOptions({
                restriction: { latLngBounds: bounds, strictBounds: false },
            });
        }

        return () => polygon.setMap(null);
    }, [map, data]);

    return null;
}
