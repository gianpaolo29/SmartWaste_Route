import { Head, useForm, Link } from '@inertiajs/react';
import CollectorLayout from '@/layouts/collector-layout';
import type { FormEventHandler } from 'react';

type RouteOption = {
    id: number;
    route_date: string | null;
    zone: string;
};

export default function ReportsCreate({ routes, route_id }: { routes: RouteOption[]; route_id?: string }) {
    const { data, setData, post, processing, errors } = useForm({
        route_plan_id: route_id ?? '',
        mixed_waste: '',
        biodegradable: '',
        recyclable: '',
        residual: '',
        solid_waste: '',
        notes: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/collector/reports');
    };

    const total =
        (parseFloat(data.mixed_waste) || 0) +
        (parseFloat(data.biodegradable) || 0) +
        (parseFloat(data.recyclable) || 0) +
        (parseFloat(data.residual) || 0) +
        (parseFloat(data.solid_waste) || 0);

    return (
        <CollectorLayout>
            <Head title="New Collection Report" />
            <div className="mx-auto max-w-2xl space-y-6 p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-semibold">New Collection Report</h1>
                    <Link
                        href="/collector/reports"
                        className="text-sm text-gray-500 hover:text-gray-700"
                    >
                        Cancel
                    </Link>
                </div>

                <form onSubmit={submit} className="space-y-6 rounded-xl border border-sidebar-border/70 bg-white p-6 dark:bg-[#0a0a0a]">
                    {/* Route Selection */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Completed Route
                        </label>
                        <select
                            value={data.route_plan_id}
                            onChange={(e) => setData('route_plan_id', e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#2d6a4f] focus:ring-[#2d6a4f] focus:outline-none dark:border-gray-600 dark:bg-[#1a1a1a] dark:text-gray-100"
                        >
                            <option value="">Select a route...</option>
                            {routes.map((r) => (
                                <option key={r.id} value={r.id}>
                                    {r.route_date ?? 'No date'} — {r.zone}
                                </option>
                            ))}
                        </select>
                        {routes.length === 0 && (
                            <p className="mt-1 text-sm text-gray-500">No completed routes without reports.</p>
                        )}
                        {errors.route_plan_id && (
                            <p className="mt-1 text-sm text-red-600">{errors.route_plan_id}</p>
                        )}
                    </div>

                    {/* Waste fields */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {[
                            { key: 'mixed_waste' as const, label: 'Mixed Waste (kg)' },
                            { key: 'biodegradable' as const, label: 'Biodegradable (kg)' },
                            { key: 'recyclable' as const, label: 'Recyclable (kg)' },
                            { key: 'residual' as const, label: 'Residual (kg)' },
                            { key: 'solid_waste' as const, label: 'Solid Waste (kg)' },
                        ].map((field) => (
                            <div key={field.key}>
                                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {field.label}
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={data[field.key]}
                                    onChange={(e) => setData(field.key, e.target.value)}
                                    placeholder="0.00"
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#2d6a4f] focus:ring-[#2d6a4f] focus:outline-none dark:border-gray-600 dark:bg-[#1a1a1a] dark:text-gray-100"
                                />
                                {errors[field.key] && (
                                    <p className="mt-1 text-sm text-red-600">{errors[field.key]}</p>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Total */}
                    <div className="rounded-lg bg-[#2d6a4f]/10 px-4 py-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-[#2d6a4f]">Total Waste</span>
                            <span className="text-lg font-bold text-[#2d6a4f]">{total.toFixed(2)} kg</span>
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Notes (optional)
                        </label>
                        <textarea
                            value={data.notes}
                            onChange={(e) => setData('notes', e.target.value)}
                            rows={3}
                            placeholder="Any additional notes about this collection..."
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#2d6a4f] focus:ring-[#2d6a4f] focus:outline-none dark:border-gray-600 dark:bg-[#1a1a1a] dark:text-gray-100"
                        />
                        {errors.notes && (
                            <p className="mt-1 text-sm text-red-600">{errors.notes}</p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={processing}
                        className="w-full rounded-lg bg-[#2d6a4f] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#245a42] disabled:opacity-50"
                    >
                        {processing ? 'Submitting...' : 'Submit Report'}
                    </button>
                </form>
            </div>
        </CollectorLayout>
    );
}
