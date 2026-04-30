import { Head, Link } from '@inertiajs/react';
import CollectorLayout from '@/layouts/collector-layout';

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
};

export default function ReportsIndex({ reports }: { reports: Report[] }) {
    return (
        <CollectorLayout>
            <Head title="Collection Reports" />
            <div className="space-y-4 p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-semibold">Collection Reports</h1>
                    <Link
                        href="/collector/reports/create"
                        className="rounded-lg bg-[#2d6a4f] px-4 py-2 text-sm font-medium text-white hover:bg-[#245a42]"
                    >
                        New Report
                    </Link>
                </div>

                <div className="overflow-hidden rounded-xl border border-sidebar-border/70 bg-white dark:bg-[#0a0a0a]">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 text-left text-gray-600">
                                <tr>
                                    <th className="px-4 py-3">Date</th>
                                    <th className="px-4 py-3">Zone</th>
                                    <th className="px-4 py-3 text-right">Mixed (kg)</th>
                                    <th className="px-4 py-3 text-right">Biodegradable (kg)</th>
                                    <th className="px-4 py-3 text-right">Recyclable (kg)</th>
                                    <th className="px-4 py-3 text-right">Residual (kg)</th>
                                    <th className="px-4 py-3 text-right">Solid Waste (kg)</th>
                                    <th className="px-4 py-3 text-right">Total (kg)</th>
                                    <th className="px-4 py-3"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {reports.length === 0 && (
                                    <tr>
                                        <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                                            No reports yet.
                                        </td>
                                    </tr>
                                )}
                                {reports.map((r) => (
                                    <tr key={r.id} className="border-t border-gray-100">
                                        <td className="px-4 py-3">{r.report_date}</td>
                                        <td className="px-4 py-3">
                                            {r.zone ? `${r.zone.name} (${r.zone.barangay ?? '—'})` : '—'}
                                        </td>
                                        <td className="px-4 py-3 text-right">{r.mixed_waste.toFixed(2)}</td>
                                        <td className="px-4 py-3 text-right">{r.biodegradable.toFixed(2)}</td>
                                        <td className="px-4 py-3 text-right">{r.recyclable.toFixed(2)}</td>
                                        <td className="px-4 py-3 text-right">{r.residual.toFixed(2)}</td>
                                        <td className="px-4 py-3 text-right">{r.solid_waste.toFixed(2)}</td>
                                        <td className="px-4 py-3 text-right font-semibold">{r.total.toFixed(2)}</td>
                                        <td className="px-4 py-3 text-right">
                                            <Link
                                                href={`/collector/reports/${r.id}`}
                                                className="text-[#2d6a4f] hover:underline"
                                            >
                                                View
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </CollectorLayout>
    );
}
