import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import { ResidentSidebar } from '@/components/resident-sidebar';
import { NearbyTruckAlert } from '@/components/nearby-truck-alert';
import type { AppLayoutProps } from '@/types';

export default function ResidentLayout({ children, breadcrumbs = [] }: AppLayoutProps) {
    return (
        <AppShell variant="sidebar">
            <ResidentSidebar />
            <AppContent variant="sidebar" className="overflow-x-hidden">
                <AppSidebarHeader breadcrumbs={breadcrumbs} />
                <NearbyTruckAlert />
                {children}
            </AppContent>
        </AppShell>
    );
}
