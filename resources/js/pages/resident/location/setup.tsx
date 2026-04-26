import { Head, router, useForm } from "@inertiajs/react";
import React, { useEffect, useRef } from "react";
import Swal from "sweetalert2";

type Zone = {
    id: number | string;
    name: string;
    barangay: string;
};

type Props = { zones: Zone[] };

type FormData = {
    zone_id: string;
    address_line: string;
    lat: string;
    lng: string;
};

// Rough Tuy bounds (adjust if needed)
const TUY_BOUNDS = {
    minLat: 13.80,
    maxLat: 14.05,
    minLng: 120.55,
    maxLng: 120.85,
};

const isInsideTuyBounds = (lat: number, lng: number) =>
    lat >= TUY_BOUNDS.minLat &&
    lat <= TUY_BOUNDS.maxLat &&
    lng >= TUY_BOUNDS.minLng &&
    lng <= TUY_BOUNDS.maxLng;

const normalize = (s: any) =>
    String(s ?? "")
        .toLowerCase()
        .trim()
        .replace(/^brgy\.?\s*/i, "")
        .replace(/^barangay\s*/i, "")
        .replace(/\s+/g, " ");

export default function LocationSetup({ zones }: Props) {
    const { setData } = useForm<FormData>({
        zone_id: "",
        address_line: "",
        lat: "",
        lng: "",
    });

    const ranRef = useRef(false);

    const toast = (icon: "success" | "error" | "info" | "warning", title: string) =>
        Swal.fire({
            toast: true,
            position: "top-end",
            icon,
            title,
            showConfirmButton: false,
            timer: 2200,
            timerProgressBar: true,
        });

    const denyAndReset = async (title: string, text: string) => {
        setData("lat", "");
        setData("lng", "");
        setData("address_line", "");
        setData("zone_id", "");

        await Swal.fire({ icon: "error", title, text });
    };

    const reverseGeocodeAndAutoPickZone = async (lat: number, lng: number) => {
        // Quick bounds check
        if (!isInsideTuyBounds(lat, lng)) {
            await denyAndReset(
                "Outside Service Area",
                "SmartWaste Route is only available in Tuy, Batangas."
            );
            return null;
        }

        const res = await fetch(`/reverse-geocode?lat=${lat}&lng=${lng}`, {
            headers: { Accept: "application/json" },
            credentials: "include",
        });

        const body = await res.json().catch(() => ({}));

        if (!res.ok) {
            await Swal.fire({
                icon: "error",
                title: "Geocoding Failed",
                text: body?.message ?? "Reverse geocoding failed.",
            });
            return null;
        }

        // Strict Tuy check
        const city = normalize(body?.city);
        const province = normalize(body?.province);

        const isTuy = city === "tuy";
        const isBatangas = province.includes("batangas");

        if (!isTuy || !isBatangas) {
            await denyAndReset(
                "Denied",
                `Only Tuy, Batangas is allowed. Detected: ${body?.city ?? "Unknown"}, ${body?.province ?? "Unknown"}.`
            );
            return null;
        }

        // Auto-fill address
        const addressLine = [body.road, body.suburb || body.village, body.city, body.province]
            .filter(Boolean)
            .join(", ");

        // Detect barangay-like label from Nominatim
        const detectedBarangay = normalize(body?.suburb || body?.village || body?.raw?.suburb || body?.raw?.village || body?.raw?.neighbourhood);

        // Auto-pick zone by barangay (1 zone = 1 barangay)
        const matched = zones.find((z) => normalize(z.barangay) === detectedBarangay);

        if (!matched) {
            await denyAndReset(
                "Zone Not Matched",
                `We detected "${body?.suburb || body?.village || "Unknown"}", but it doesn't match any configured barangay/zone in the system. Please contact admin to add/normalize barangays.`
            );
            return null;
        }

        return {
            zone_id: String(matched.id),
            address_line: addressLine || "",
        };
    };

    const runAutoSetup = async () => {
        const confirm = await Swal.fire({
            icon: "info",
            title: "Allow Location Access?",
            text: "We will automatically get your GPS location, verify Tuy, Batangas, detect your barangay, auto-select your zone, and save your service location.",
            showCancelButton: true,
            confirmButtonText: "Allow",
            cancelButtonText: "Deny",
        });

        if (!confirm.isConfirmed) return;

        if (!navigator.geolocation) return;

        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;

                setData("lat", String(lat));
                setData("lng", String(lng));

                const result = await reverseGeocodeAndAutoPickZone(lat, lng);
                if (!result) return;

                setData("zone_id", result.zone_id);
                setData("address_line", result.address_line);

                router.post(
                    "/resident/location/setup",
                    {
                        zone_id: result.zone_id,
                        address_line: result.address_line,
                        lat: String(lat),
                        lng: String(lng),
                    },
                    {
                        preserveScroll: true,
                        onSuccess: () => router.visit("/resident/dashboard"),
                    }
                );
            },
            () => {},
            { enableHighAccuracy: true, timeout: 12000 }
        );
    };

    // Auto-run once when page loads
    useEffect(() => {
        if (ranRef.current) return;
        ranRef.current = true;
        runAutoSetup();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return <Head title="Set Service Location" />;
}
