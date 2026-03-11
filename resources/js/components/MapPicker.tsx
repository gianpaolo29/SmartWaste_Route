import React from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';

type LatLng = { lat: number; lng: number };
type LatLngTuple = [number, number];

function ClickToPick({ onPick }: { onPick: (p: LatLng) => void }) {
    useMapEvents({
        click(e) {
            onPick({ lat: e.latlng.lat, lng: e.latlng.lng });
        },
    });
    return null;
}

export default function MapPicker({
    value,
    onChange,
    center = { lat: 13.9575, lng: 120.72 },
    zoom = 14,
    height = 320,
}: {
    value?: LatLng | null;
    onChange: (p: LatLng) => void;
    center?: LatLng;
    zoom?: number;
    height?: number;
}) {
    const markerPos: LatLngTuple | null = value ? [value.lat, value.lng] : null;
    const mapCenter: LatLngTuple = markerPos ?? [center.lat, center.lng];

    return (
        <div className="overflow-hidden rounded border bg-white">
            <MapContainer center={mapCenter} zoom={zoom} style={{ height }}>
                <TileLayer
                    attribution="&copy; OpenStreetMap contributors"
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <ClickToPick onPick={onChange} />
                {markerPos && <Marker position={markerPos} />}
            </MapContainer>
        </div>
    );
}
