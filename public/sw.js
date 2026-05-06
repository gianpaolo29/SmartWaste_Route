// SmartWaste Route — Service Worker for background notifications
const CACHE_NAME = 'smartwaste-v1';
const POLL_INTERVAL = 10000; // 10 seconds
let pollTimer = null;
let userId = null;

// ── Install ──
self.addEventListener('install', () => {
    self.skipWaiting();
});

// ── Activate ──
self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

// ── Messages from the main app ──
self.addEventListener('message', (event) => {
    const { type, data } = event.data || {};

    if (type === 'START_POLLING') {
        userId = data?.userId ?? null;
        startPolling();
    }

    if (type === 'STOP_POLLING') {
        stopPolling();
    }

    // Forward notification request from app (works in background)
    if (type === 'SHOW_NOTIFICATION') {
        const { title, body, tag, url } = data;
        self.registration.showNotification(title, {
            body,
            icon: '/logo.png',
            badge: '/logo.png',
            tag: tag || 'smartwaste',
            renotify: true,
            vibrate: [200, 100, 200],
            data: { url: url || '/' },
        });
    }
});

// ── Click notification → open app ──
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const url = event.notification.data?.url || '/resident/dashboard';

    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
            // Focus existing tab if found
            for (const client of clients) {
                if (client.url.includes('/resident') && 'focus' in client) {
                    return client.focus();
                }
            }
            // Otherwise open new tab
            return self.clients.openWindow(url);
        })
    );
});

// ── Background polling for nearby truck ──
function startPolling() {
    stopPolling();
    poll(); // immediate first check
    pollTimer = setInterval(poll, POLL_INTERVAL);
}

function stopPolling() {
    if (pollTimer) {
        clearInterval(pollTimer);
        pollTimer = null;
    }
}

let lastNotifiedRouteId = null;
let lastNextStopRouteId = null;

async function poll() {
    try {
        // Check if any client (tab) is focused — skip SW notification if app is visible
        const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
        const hasVisibleClient = clients.some((c) => c.visibilityState === 'visible');

        const res = await fetch('/resident/nearby-truck', {
            headers: { Accept: 'application/json' },
            credentials: 'include',
        });

        if (!res.ok) return;
        const body = await res.json();
        const truck = body.truck;

        if (!truck) {
            // Reset when no truck
            if (truck === null && lastNotifiedRouteId) {
                lastNotifiedRouteId = null;
                lastNextStopRouteId = null;
            }
            return;
        }

        // Reset when truck goes far away
        if (truck.distance_m > 1200) {
            lastNotifiedRouteId = null;
            lastNextStopRouteId = null;
            return;
        }

        // Only send SW notifications when the app tab is NOT visible
        if (hasVisibleClient) return;

        // Next stop alert (highest priority)
        if (
            truck.is_next_stop &&
            truck.distance_m <= 800 &&
            lastNextStopRouteId !== truck.route_id
        ) {
            lastNextStopRouteId = truck.route_id;
            self.registration.showNotification('Your house is next!', {
                body: `${truck.collector || 'Collector'} is ${truck.distance_m}m away. Please bring out your trash now!`,
                icon: '/logo.png',
                badge: '/logo.png',
                tag: 'nearby-truck-next',
                renotify: true,
                vibrate: [200, 100, 200, 100, 300],
                requireInteraction: true,
                data: { url: '/resident/dashboard' },
            });
            return;
        }

        // Nearby alert
        if (
            truck.distance_m <= 500 &&
            lastNotifiedRouteId !== truck.route_id
        ) {
            lastNotifiedRouteId = truck.route_id;
            self.registration.showNotification('Garbage truck nearby!', {
                body: `${truck.collector || 'Collector'} is ~${truck.distance_m}m away.${truck.stops_away > 0 ? ` ${truck.stops_away} stop${truck.stops_away > 1 ? 's' : ''} before you.` : ''}`,
                icon: '/logo.png',
                badge: '/logo.png',
                tag: 'nearby-truck',
                renotify: true,
                vibrate: [200, 100, 200],
                data: { url: '/resident/dashboard' },
            });
        }
    } catch {
        // Network error, ignore
    }
}
