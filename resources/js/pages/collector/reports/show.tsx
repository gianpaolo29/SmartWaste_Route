import { Head, Link } from '@inertiajs/react';
import CollectorLayout from '@/layouts/collector-layout';
import type { BreadcrumbItem } from '@/types';

type Report = {
    id: number;
    report_date: string;
    mixed_waste: number;
    biodegradable: number;
    recyclable: number;
    residual: number;
    solid_waste: number;
    total: number;
    notes: string | null;
    zone: { name: string; barangay: string | null } | null;
    route_date: string | null;
    created_at: string;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/collector/dashboard' },
    { title: 'Reports', href: '/collector/reports' },
    { title: 'Report Details', href: '#' },
];

export default function ReportsShow({ report }: { report: Report }) {
    const wasteItems = [
        { label: 'Mixed Waste', value: report.mixed_waste, color: 'bg-yellow-100 text-yellow-800' },
        { label: 'Biodegradable', value: report.biodegradable, color: 'bg-green-100 text-green-800' },
        { label: 'Recyclable', value: report.recyclable, color: 'bg-blue-100 text-blue-800' },
        { label: 'Residual', value: report.residual, color: 'bg-gray-100 text-gray-800' },
        { label: 'Solid Waste', value: report.solid_waste, color: 'bg-red-100 text-red-800' },
    ];

    return (
        <CollectorLayout breadcrumbs={breadcrumbs}>
            <Head title="Report Details" />
            <div className="mx-auto max-w-2xl space-y-6 p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-semibold">Report Details</h1>
                    <Link
                        href="/collector/reports"
                        className="text-sm text-gray-500 hover:text-gray-700"
                    >
                        Back to Reports
                    </Link>
                </div>

                <div className="space-y-6 rounded-xl border border-sidebar-border/70 bg-white p-6 dark:bg-[#0a0a0a]">
                    {/* Route Info */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="text-gray-500">Report Date</span>
                            <p className="font-medium">{report.report_date}</p>
                        </div>
                        <div>
                            <span className="text-gray-500">Route Date</span>
                            <p className="font-medium">{report.route_date ?? '—'}</p>
                        </div>
                        <div>
                            <span className="text-gray-500">Zone</span>
                            <p className="font-medium">
                                {report.zone ? `${report.zone.name} (${report.zone.barangay ?? '—'})` : '—'}
                            </p>
                        </div>
                        <div>
                            <span className="text-gray-500">Submitted</span>
                            <p className="font-medium">{report.created_at}</p>
                        </div>
                    </div>

                    <hr className="border-gray-100 dark:border-gray-800" />

                    {/* Waste Breakdown */}
                    <div>
                        <h2 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                            Waste Breakdown
                        </h2>
                        <div className="space-y-3">
                            {wasteItems.map((item) => (
                                <div key={item.label} className="flex items-center justify-between">
                                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${item.color}`}>
                                        {item.label}
                                    </span>
                                    <span className="font-medium">{item.value.toFixed(2)} kg</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Total */}
                    <div className="rounded-lg bg-[#2d6a4f]/10 px-4 py-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-[#2d6a4f]">Total Waste</span>
                            <span className="text-lg font-bold text-[#2d6a4f]">{report.total.toFixed(2)} kg</span>
                        </div>
                    </div>

                    {/* Notes */}
                    {report.notes && (
                        <div>
                            <h2 className="mb-1 text-sm font-semibold text-gray-700 dark:text-gray-300">Notes</h2>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{report.notes}</p>
                        </div>
                    )}
                </div>
            </div>
        </CollectorLayout>
    );
}
