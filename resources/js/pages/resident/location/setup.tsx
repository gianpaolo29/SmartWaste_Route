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

export default function LocationSetup({ zones }: Props) {
    const { setData } = useForm<FormData>({
        zone_id: '',
        address_line: '',
        lat: '',
        lng: '',
    });

    const ranRef = useRef(false);

    const autoDetectAndSave = async (lat: number, lng: number) => {
        // Step 1: Check bounds
        if (!isInsideTuyBounds(lat, lng)) {
            closeLoading();
            await errorAlert('Outside Service Area', 'SmartWaste Route is only available in Tuy, Batangas.');
            return;
        }

        // Step 2: Auto-detect zone from coordinates (uses nearest barangay centroid)
        let zoneId: string | null = null;
        let barangayName = '';

        try {
            const detectRes = await fetch(`/resident/location/detect-zone?lat=${lat}&lng=${lng}`, {
                headers: { Accept: 'application/json' },
                credentials: 'include',
            });
            const detectBody = await detectRes.json();

            if (detectBody.zone?.id) {
                zoneId = String(detectBody.zone.id);
                barangayName = detectBody.barangay ?? '';
            } else if (detectBody.barangay) {
                // Barangay detected but no active zone — try matching from the zones list
                barangayName = detectBody.barangay;
                const normalizedDetected = barangayName.toLowerCase().trim();
                const matched = zones.find((z) => {
                    const zBrg = z.barangay.toLowerCase().trim();
                    return zBrg.includes(normalizedDetected) || normalizedDetected.includes(zBrg);
                });
                if (matched) zoneId = String(matched.id);
            }
        } catch {
            // Detection failed — try reverse geocode as fallback
        }

        // Step 3: If zone detection failed, try reverse geocode
        if (!zoneId) {
            try {
                const geoRes = await fetch(`/reverse-geocode?lat=${lat}&lng=${lng}`, {
                    headers: { Accept: 'application/json' },
                    credentials: 'include',
                });
                const geoBody = await geoRes.json();
                const suburb = (geoBody?.suburb || geoBody?.village || '').toLowerCase().trim()
                    .replace(/^brgy\.?\s*/i, '').replace(/^barangay\s*/i, '');

                if (suburb) {
                    const matched = zones.find((z) => {
                        const zBrg = z.barangay.toLowerCase().trim();
                        return zBrg.includes(suburb) || suburb.includes(zBrg);
                    });
                    if (matched) {
                        zoneId = String(matched.id);
                        barangayName = geoBody?.suburb || geoBody?.village || '';
                    }
                }
            } catch {
                // Geocode also failed
            }
        }

        // Step 4: If still no zone, pick the first zone as fallback (at least save the location)
        if (!zoneId && zones.length > 0) {
            zoneId = String(zones[0].id);
            barangayName = zones[0].barangay;
        }

        if (!zoneId) {
            closeLoading();
            await errorAlert('No Zones Available', 'No active zones are configured yet. Please contact your administrator.');
            return;
        }

        // Step 5: Build address
        const addressLine = barangayName
            ? `${barangayName}, Tuy, Batangas`
            : 'Tuy, Batangas';

        // Step 6: Save
        setData('zone_id', zoneId);
        setData('address_line', addressLine);
        setData('lat', String(lat));
        setData('lng', String(lng));

        loading('Saving your location…');

        router.post(
            '/resident/location/setup',
            {
                zone_id: zoneId,
                address_line: addressLine,
                lat: String(lat),
                lng: String(lng),
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    closeLoading();
                    successAlert('Location Saved', `You have been assigned to ${barangayName || 'your nearest zone'}.`);
                    router.visit('/resident/dashboard');
                },
                onError: () => {
                    closeLoading();
                    errorAlert('Save Failed', 'Could not save your location. Please try again.');
                },
            },
        );
    };

    const runAutoSetup = async () => {
        const confirmed = await infoConfirm(
            'Allow Location Access?',
            'We will automatically detect your GPS location and assign you to the nearest collection zone in Tuy, Batangas.',
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
                await autoDetectAndSave(pos.coords.latitude, pos.coords.longitude);
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
