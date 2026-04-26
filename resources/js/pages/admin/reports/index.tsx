import { Head } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import { AdminTable } from '@/components/admin-table';
import type { BreadcrumbItem } from '@/types';

type Item = {
    id: number;
    description: string;
    status: string;
    report_datetime: string | null;
    location_text: string | null;
    resident: string | null;
    zone: { name: string; barangay: string | null } | null;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/admin/dashboard' },
    { title: 'Reports', href: '/admin/reports' },
];

const STATUS_COLOR: Record<string, string> = {
    open: 'bg-amber-100 text-amber-800',
    in_progress: 'bg-blue-100 text-blue-800',
    resolved: 'bg-emerald-100 text-emerald-800',
    closed: 'bg-gray-100 text-gray-700',
};

export default function ReportsIndex({ items }: { items: Item[] }) {
    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Missed Pickup Reports" />
            <div className="space-y-4 p-4">
                <h1 className="text-2xl font-semibold">Missed Pickup Reports</h1>
                <AdminTable
                    rows={items}
                    empty="No reports filed."
                    columns={[
                        { header: 'Date', cell: (r) => r.report_datetime ?? '—' },
                        { header: 'Resident', cell: (r) => r.resident ?? '—' },
                        {
                            header: 'Zone',
                            cell: (r) =>
                                r.zone ? `${r.zone.name} (${r.zone.barangay ?? '—'})` : '—',
                        },
                        { header: 'Description', cell: (r) => <span className="line-clamp-2">{r.description}</span> },
                        {
                            header: 'Status',
                            cell: (r) => (
                                <span
                                    className={`rounded px-2 py-0.5 text-xs ${
                                        STATUS_COLOR[r.status] ?? 'bg-gray-100 text-gray-700'
                                    }`}
                                >
                                    {r.status}
                                </span>
                            ),
                        },
                    ]}
                />
            </div>
        </AdminLayout>
    );
}
