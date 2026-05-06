import { useEffect, useRef } from 'react';

/**
 * Registers the service worker and starts background polling for nearby trucks.
 * Call this from the resident layout so it runs for all resident pages.
 */
export function useServiceWorker(userId?: number) {
    const registeredRef = useRef(false);

    useEffect(() => {
        if (!('serviceWorker' in navigator) || registeredRef.current) return;
        registeredRef.current = true;

        (async () => {
            try {
                const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });

                // Wait for the SW to be active
                const sw = reg.active || reg.installing || reg.waiting;
                if (!sw) return;

                const sendStart = () => {
                    reg.active?.postMessage({
                        type: 'START_POLLING',
                        data: { userId },
                    });
                };

                if (sw.state === 'activated') {
                    sendStart();
                } else {
                    sw.addEventListener('statechange', () => {
                        if (sw.state === 'activated') sendStart();
                    });
                }

                // Request notification permission if not yet granted
                if ('Notification' in window && Notification.permission === 'default') {
                    Notification.requestPermission();
                }
            } catch (err) {
                console.warn('SW registration failed:', err);
            }
        })();

        return () => {
            // Stop polling when unmounting (e.g. logout)
            navigator.serviceWorker.ready.then((reg) => {
                reg.active?.postMessage({ type: 'STOP_POLLING' });
            }).catch(() => {});
        };
    }, [userId]);
}
