import { usePage } from '@inertiajs/react';
import { NearbyTruckAlert } from '@/components/nearby-truck-alert';
import { ResidentBottombar } from '@/components/resident-bottombar';
import { ResidentTopbar } from '@/components/resident-topbar';
import { useIsMobile } from '@/hooks/use-mobile';
import { useServiceWorker } from '@/hooks/use-service-worker';
import type { AppLayoutProps } from '@/types';

export default function ResidentLayout({ children }: AppLayoutProps) {
    const isMobile = useIsMobile();
    const { auth } = usePage().props as { auth: { user: { id: number } } };

    // Register service worker for background push notifications
    useServiceWorker(auth.user.id);

    return (
        <div className="flex min-h-screen w-full flex-col bg-neutral-50 dark:bg-neutral-950">
            {!isMobile && <ResidentTopbar />}

            <main className={`flex w-full flex-1 flex-col ${isMobile ? '' : 'mx-auto max-w-7xl'}`}>
                <NearbyTruckAlert />
                {children}
            </main>

            {isMobile && <ResidentBottombar />}
        </div>
    );
}
