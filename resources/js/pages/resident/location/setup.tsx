import { Head, router, useForm } from '@inertiajs/react';
import { useEffect, useRef } from 'react';
import { errorAlert, infoConfirm, loading, closeLoading, successAlert } from '@/lib/notify';

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

const normalize = (s: unknown) =>
    String(s ?? '')
        .toLowerCase()
        .trim()
        .replace(/^brgy\.?\s*/i, '')
        .replace(/^barangay\s*/i, '')
        .replace(/\s+/g, ' ');

export default function LocationSetup({ zones }: Props) {
    const { setData } = useForm<FormData>({
        zone_id: '',
        address_line: '',
        lat: '',
        lng: '',
    });

    const ranRef = useRef(false);

    const denyAndReset = async (title: string, text: string) => {
        setData('lat', '');
        setData('lng', '');
        setData('address_line', '');
        setData('zone_id', '');
        await errorAlert(title, text);
    };

    const reverseGeocodeAndAutoPickZone = async (lat: number, lng: number) => {
        if (!isInsideTuyBounds(lat, lng)) {
            await denyAndReset('Outside Service Area', 'SmartWaste Route is only available in Tuy, Batangas.');
            return null;
        }

        const res = await fetch(`/reverse-geocode?lat=${lat}&lng=${lng}`, {
            headers: { Accept: 'application/json' },
            credentials: 'include',
        });

        const body = await res.json().catch(() => ({}));

        if (!res.ok) {
            await errorAlert('Geocoding Failed', body?.message ?? 'Reverse geocoding failed.');
            return null;
        }

        const city = normalize(body?.city);
        const province = normalize(body?.province);

        if (city !== 'tuy' || !province.includes('batangas')) {
            await denyAndReset(
                'Denied',
                `Only Tuy, Batangas is allowed. Detected: ${body?.city ?? 'Unknown'}, ${body?.province ?? 'Unknown'}.`,
            );
            return null;
        }

        const addressLine = [body.road, body.suburb || body.village, body.city, body.province]
            .filter(Boolean)
            .join(', ');

        const detectedBarangay = normalize(
            body?.suburb || body?.village || body?.raw?.suburb || body?.raw?.village || body?.raw?.neighbourhood,
        );

        const matched = zones.find((z) => normalize(z.barangay) === detectedBarangay);

        if (!matched) {
            await denyAndReset(
                'Zone Not Matched',
                `We detected "${body?.suburb || body?.village || 'Unknown'}", but it doesn't match any configured barangay/zone.`,
            );
            return null;
        }

        return { zone_id: String(matched.id), address_line: addressLine || '' };
    };

    const runAutoSetup = async () => {
        const confirmed = await infoConfirm(
            'Allow Location Access?',
            'We will automatically detect your GPS location, verify your area, and set up your service address.',
            'Allow',
            'Deny',
        );

        if (!confirmed) return;

        if (!navigator.geolocation) {
            await errorAlert('Not Supported', 'Geolocation is not supported by your browser.');
            return;
        }

        loading('Detecting your location…');

        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;

                setData('lat', String(lat));
                setData('lng', String(lng));

                const result = await reverseGeocodeAndAutoPickZone(lat, lng);
                closeLoading();

                if (!result) return;

                setData('zone_id', result.zone_id);
                setData('address_line', result.address_line);

                loading('Saving your location…');

                router.post(
                    '/resident/location/setup',
                    {
                        zone_id: result.zone_id,
                        address_line: result.address_line,
                        lat: String(lat),
                        lng: String(lng),
                    },
                    {
                        preserveScroll: true,
                        onSuccess: () => {
                            closeLoading();
                            successAlert('Location Saved', 'Your service location has been set up.');
                            router.visit('/resident/dashboard');
                        },
                        onError: () => {
                            closeLoading();
                            errorAlert('Save Failed', 'Could not save your location. Please try again.');
                        },
                    },
                );
            },
            () => {
                closeLoading();
                errorAlert('Location Denied', 'Please allow location access in your browser settings and try again.');
            },
            { enableHighAccuracy: true, timeout: 12000 },
        );
    };

    useEffect(() => {
        if (ranRef.current) return;
        ranRef.current = true;
        runAutoSetup();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return <Head title="Set Service Location" />;
}
