import { usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import AdminLayout from '@/layouts/admin-layout';
import CollectorLayout from '@/layouts/collector-layout';
import ResidentLayout from '@/layouts/resident-layout';
import type { AppLayoutProps } from '@/types';

// Automatically picks the correct role-specific layout for the logged-in user.
export default function RoleLayout({ children, breadcrumbs = [] }: AppLayoutProps) {
    const { auth } = usePage().props as unknown as { auth: { user: { role: string } } };
    const role = auth?.user?.role;

    const Layout =
        role === 'admin'
            ? AdminLayout
            : role === 'collector'
              ? CollectorLayout
              : role === 'resident'
                ? ResidentLayout
                : AppLayout;

    return <Layout breadcrumbs={breadcrumbs}>{children}</Layout>;
}
