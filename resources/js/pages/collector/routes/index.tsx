import { Head, Link, router } from '@inertiajs/react';
import CollectorLayout from '@/layouts/collector-layout';
import type { BreadcrumbItem } from '@/types';

type Route = {
    id: number;
    route_date: string | null;
    status: string;
    zone: { name: string; barangay: string | null } | null;
    stops_count: number;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/collector/dashboard' },
    { title: 'My Routes', href: '/collector/routes' },
];

const FILTERS = [
    { label: 'All', value: '' },
    { label: 'Planned', value: 'planned' },
    { label: 'In Progress', value: 'in_progress' },
    { label: 'Completed', value: 'completed' },
];

export default function CollectorRoutesIndex({
    routes,
    filter,
}: {
    routes: Route[];
    filter: string | null;
}) {
    return (
        <CollectorLayout breadcrumbs={breadcrumbs}>
            <Head title="My Routes" />
            <div className="space-y-4 p-4">
                <h1 className="text-2xl font-semibold">My Routes</h1>

                <div className="flex gap-2">
                    {FILTERS.map((f) => (
                        <button
                            key={f.value || 'all'}
                            onClick={() =>
                                router.get(
                                    '/collector/routes',
                                    f.value ? { status: f.value } : {},
                                    { preserveState: false },
                                )
                            }
                            className={`rounded-lg border px-3 py-1.5 text-sm ${
                                (filter ?? '') === f.value
                                    ? 'border-[#2d6a4f] bg-[#2d6a4f] text-white'
                                    : 'border-gray-300 bg-white text-gray-700'
                            }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>

                <div className="overflow-hidden rounded-xl border border-sidebar-border/70 bg-white dark:bg-[#0a0a0a]">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-left text-gray-600">
                            <tr>
                                <th className="px-4 py-3">Date</th>
                                <th className="px-4 py-3">Zone</th>
                                <th className="px-4 py-3">Stops</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {routes.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                                        No routes.
                                    </td>
                                </tr>
                            )}
                            {routes.map((r) => (
                                <tr key={r.id} className="border-t border-gray-100">
                                    <td className="px-4 py-3">{r.route_date ?? '—'}</td>
                                    <td className="px-4 py-3">
                                        {r.zone ? `${r.zone.name} (${r.zone.barangay ?? '—'})` : '—'}
                                    </td>
                                    <td className="px-4 py-3">{r.stops_count}</td>
                                    <td className="px-4 py-3">
                                        <span className="rounded bg-[#2d6a4f]/10 px-2 py-1 text-xs font-medium text-[#2d6a4f]">
                                            {r.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <Link
                                            href={`/collector/routes/${r.id}`}
                                            className="text-[#2d6a4f] hover:underline"
                                        >
                                            Open
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </CollectorLayout>
    );
}
