import { Link } from '@inertiajs/react';
import { BarChart3, CalendarDays, ClipboardList, LayoutGrid, MapPin, Route, Truck, Users, Map } from 'lucide-react';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarGroup,
    SidebarGroupLabel,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import AppLogo from './app-logo';

const mainNav = [
    { title: 'Dashboard', href: '/admin/dashboard', icon: LayoutGrid },
];

const managementNav = [
    { title: 'Barangays', href: '/admin/barangays', icon: Map },
    { title: 'Zones', href: '/admin/zones', icon: MapPin },
    { title: 'Residents', href: '/admin/residents', icon: Users },
    { title: 'Collectors', href: '/admin/collectors', icon: Truck },
];

const operationsNav = [
    { title: 'Schedules', href: '/admin/schedules', icon: CalendarDays },
    { title: 'Routes', href: '/admin/routes', icon: Route },
    { title: 'Collection Reports', href: '/admin/collection-reports', icon: ClipboardList },
    { title: 'Missed Pickups', href: '/admin/reports', icon: BarChart3 },
];

export function AdminSidebar() {
    const { isCurrentUrl } = useCurrentUrl();

    const renderGroup = (label: string, items: typeof mainNav) => (
        <SidebarGroup className="px-3 py-0">
            <SidebarGroupLabel className="mb-1 px-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                {label}
            </SidebarGroupLabel>
            <SidebarMenu>
                {items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                            asChild
                            isActive={isCurrentUrl(item.href)}
                            tooltip={{ children: item.title }}
                        >
                            <Link href={item.href} prefetch>
                                {item.icon && <item.icon />}
                                <span>{item.title}</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </SidebarGroup>
    );

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/admin/dashboard" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                {renderGroup('Dashboard', mainNav)}
                {renderGroup('Management', managementNav)}
                {renderGroup('Operations', operationsNav)}
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
