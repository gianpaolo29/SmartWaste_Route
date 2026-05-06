// SmartWaste Route — Service Worker for background notifications
const CACHE_NAME = 'smartwaste-v1';
const TRUCK_POLL_INTERVAL = 10000; // 10 seconds
const NOTIF_POLL_INTERVAL = 30000; // 30 seconds
let pollTimer = null;
let notifTimer = null;
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
            for (const client of clients) {
                if (client.url.includes('/resident') && 'focus' in client) {
                    return client.focus();
                }
            }
            return self.clients.openWindow(url);
        })
    );
});

// ── Start/stop polling ──
function startPolling() {
    stopPolling();
    pollTruck();
    pollNotifications();
    pollTimer = setInterval(pollTruck, TRUCK_POLL_INTERVAL);
    notifTimer = setInterval(pollNotifications, NOTIF_POLL_INTERVAL);
}

function stopPolling() {
    if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
    if (notifTimer) { clearInterval(notifTimer); notifTimer = null; }
}

// ══════════════════════════════════════
//  NEARBY TRUCK POLLING
// ══════════════════════════════════════

let lastNotifiedRouteId = null;
let lastNextStopRouteId = null;

async function pollTruck() {
    try {
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
            if (truck === null && lastNotifiedRouteId) {
                lastNotifiedRouteId = null;
                lastNextStopRouteId = null;
            }
            return;
        }

        if (truck.distance_m > 1200) {
            lastNotifiedRouteId = null;
            lastNextStopRouteId = null;
            return;
        }

        // Only send SW notifications when the app tab is NOT visible
        if (hasVisibleClient) return;

        // Next stop alert
        if (
            truck.is_next_stop &&
            truck.distance_m <= 800 &&
            lastNextStopRouteId !== truck.route_id
        ) {
            lastNextStopRouteId = truck.route_id;
            self.registration.showNotification('Pickup arriving!', {
                body: `${truck.collector || 'Collector'} is heading to your house — only ${truck.distance_m}m away. Please prepare your waste for pickup.`,
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
            self.registration.showNotification('Waste collection in your area', {
                body: `${truck.collector || 'A collector'} is ~${truck.distance_m}m away.${truck.stops_away > 0 ? ` ${truck.stops_away} stop${truck.stops_away > 1 ? 's' : ''} before your house.` : ''} Get your waste ready!`,
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

// ══════════════════════════════════════
//  NOTIFICATION / ANNOUNCEMENT POLLING
// ══════════════════════════════════════

let lastKnownUnreadCount = 0;

async function pollNotifications() {
    try {
        const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
        const hasVisibleClient = clients.some((c) => c.visibilityState === 'visible');

        // Skip if app is visible — the in-app bell handles it
        if (hasVisibleClient) return;

        const res = await fetch('/resident/notifications/unread-count', {
            headers: { Accept: 'application/json' },
            credentials: 'include',
        });

        if (!res.ok) return;
        const data = await res.json();
        const currentCount = data.count ?? 0;

        // New notifications since last check
        if (currentCount > lastKnownUnreadCount && currentCount > 0) {
            // Fetch the latest notification to show its content
            const listRes = await fetch('/resident/notifications', {
                headers: { Accept: 'application/json' },
                credentials: 'include',
            });

            if (listRes.ok) {
                const listData = await listRes.json();
                const latest = listData.notifications?.[0];

                if (latest && !latest.is_read) {
                    const newCount = currentCount - lastKnownUnreadCount;
                    const title = newCount > 1
                        ? `${newCount} new notifications`
                        : latest.title;
                    const body = newCount > 1
                        ? `${latest.title}: ${latest.message}`
                        : latest.message;

                    self.registration.showNotification(title, {
                        body,
                        icon: '/logo.png',
                        badge: '/logo.png',
                        tag: 'smartwaste-notification',
                        renotify: true,
                        vibrate: [200, 100, 200],
                        data: { url: '/resident/dashboard' },
                    });
                }
            }
        }

        lastKnownUnreadCount = currentCount;
    } catch {
        // Network error, ignore
    }
}
