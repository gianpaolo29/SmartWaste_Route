import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
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

type Stats = {
    total: number;
    open: number;
    in_progress: number;
    resolved: number;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/admin/dashboard' },
    { title: 'Reports', href: '/admin/reports' },
];

const STATUS_COLOR: Record<string, string> = {
    open: 'bg-amber-100 text-amber-800',
    in_progress: 'bg-blue-100 text-blue-800',
    resolved: 'bg-emerald-100 text-emerald-800',
};

const FILTERS = [
    { label: 'All', value: '' },
    { label: 'Open', value: 'open' },
    { label: 'In Progress', value: 'in_progress' },
    { label: 'Resolved', value: 'resolved' },
];

const STATUS_OPTIONS = ['open', 'in_progress', 'resolved'];

export default function ReportsIndex({ items, stats, filter }: { items: Item[]; stats: Stats; filter: string }) {
    const [updatingId, setUpdatingId] = useState<number | null>(null);

    const updateStatus = (id: number, status: string) => {
        setUpdatingId(id);
        router.put(`/admin/reports/${id}`, { status }, {
            preserveScroll: true,
            onFinish: () => setUpdatingId(null),
        });
    };

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Missed Pickup Reports" />
            <div className="space-y-4 p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-semibold">Missed Pickup Reports</h1>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-4 gap-3">
                    <div className="rounded-xl border border-gray-100 bg-white p-4 text-center dark:border-white/5 dark:bg-white/[0.02]">
                        <p className="text-2xl font-bold">{stats.total}</p>
                        <p className="text-xs text-gray-400">Total</p>
                    </div>
                    <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-4 text-center dark:border-amber-900/30 dark:bg-amber-950/20">
                        <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">{stats.open}</p>
                        <p className="text-xs text-amber-600/70 dark:text-amber-400/70">Open</p>
                    </div>
                    <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 text-center dark:border-blue-900/30 dark:bg-blue-950/20">
                        <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{stats.in_progress}</p>
                        <p className="text-xs text-blue-600/70 dark:text-blue-400/70">In Progress</p>
                    </div>
                    <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 text-center dark:border-emerald-900/30 dark:bg-emerald-950/20">
                        <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{stats.resolved}</p>
                        <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70">Resolved</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex gap-2">
                    {FILTERS.map((f) => (
                        <button
                            key={f.value || 'all'}
                            onClick={() => router.get('/admin/reports', f.value ? { status: f.value } : {}, { preserveState: false })}
                            className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                                (filter ?? '') === f.value
                                    ? 'border-[#2d6a4f] bg-[#2d6a4f] text-white'
                                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 dark:border-white/10 dark:bg-white/5 dark:text-gray-400'
                            }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>

                <AdminTable
                    rows={items}
                    empty="No reports found."
                    columns={[
                        { header: 'Date', cell: (r) => r.report_datetime ?? '—' },
                        { header: 'Resident', cell: (r) => r.resident ?? '—' },
                        {
                            header: 'Zone',
                            cell: (r) =>
                                r.zone ? `${r.zone.name} (${r.zone.barangay ?? '—'})` : '—',
                        },
                        { header: 'Location', cell: (r) => <span className="line-clamp-1 text-xs text-gray-500">{r.location_text ?? '—'}</span> },
                        { header: 'Description', cell: (r) => <span className="line-clamp-2 max-w-[200px]">{r.description}</span> },
                        {
                            header: 'Status',
                            cell: (r) => (
                                <select
                                    value={r.status}
                                    disabled={updatingId === r.id}
                                    onChange={(e) => updateStatus(r.id, e.target.value)}
                                    className={`cursor-pointer rounded-lg border-0 px-2 py-1 text-xs font-semibold outline-none ${
                                        STATUS_COLOR[r.status] ?? 'bg-gray-100 text-gray-700'
                                    } ${updatingId === r.id ? 'opacity-50' : ''}`}
                                >
                                    {STATUS_OPTIONS.map((s) => (
                                        <option key={s} value={s}>{s.replace('_', ' ')}</option>
                                    ))}
                                </select>
                            ),
                        },
                    ]}
                />
            </div>
        </AdminLayout>
    );
}
