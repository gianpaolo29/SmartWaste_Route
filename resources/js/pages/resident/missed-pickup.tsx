import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';
import ResidentLayout from '@/layouts/resident-layout';
import type { BreadcrumbItem } from '@/types';
import { errorAlert, toast } from '@/lib/notify';

type Report = {
    id: number;
    description: string;
    location_text: string | null;
    status: string;
    report_datetime: string | null;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/resident/dashboard' },
    { title: 'Missed Pickup', href: '/resident/missed-pickup' },
];

export default function ResidentMissedPickup({ reports }: { reports: Report[] }) {
    const { data, setData, post, processing, reset, errors } = useForm({
        description: '',
    });

    const [clientError, setClientError] = useState<string | null>(null);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        const desc = data.description.trim();
        if (desc.length < 10) {
            setClientError('Please describe what happened (at least 10 characters).');
            return;
        }
        setClientError(null);
        post('/resident/missed-pickup', {
            preserveScroll: true,
            onSuccess: () => {
                reset('description');
                toast('success', 'Report submitted');
            },
            onError: () => errorAlert('Submit failed', 'Please try again.'),
        });
    };

    return (
        <ResidentLayout breadcrumbs={breadcrumbs}>
            <Head title="Missed Pickup" />
            <div className="space-y-4 p-4">
                <h1 className="text-2xl font-semibold">Report a Missed Pickup</h1>

                <form
                    onSubmit={submit}
                    className="space-y-3 rounded-xl border border-sidebar-border/70 bg-white p-4 dark:bg-[#0a0a0a]"
                >
                    <div>
                        <label className="mb-1 block text-sm font-medium">What happened?</label>
                        <textarea
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            rows={4}
                            placeholder="e.g. The garbage truck did not stop at our house this morning."
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        />
                        {(clientError || errors.description) && (
                            <p className="mt-1 text-xs text-red-600">
                                {clientError ?? errors.description}
                            </p>
                        )}
                    </div>
                    <button
                        type="submit"
                        disabled={processing}
                        className="inline-flex items-center gap-2 rounded-lg bg-[#2d6a4f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1b4332] disabled:opacity-60"
                    >
                        {processing && (
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                        )}
                        {processing ? 'Submitting…' : 'Submit Report'}
                    </button>
                </form>

                <section className="rounded-xl border border-sidebar-border/70 bg-white p-4 dark:bg-[#0a0a0a]">
                    <h2 className="mb-3 text-lg font-semibold">My Reports</h2>
                    {reports.length === 0 ? (
                        <p className="text-sm text-gray-500">No reports yet.</p>
                    ) : (
                        <ul className="divide-y divide-gray-100 text-sm">
                            {reports.map((r) => (
                                <li key={r.id} className="py-3">
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium">{r.report_datetime}</span>
                                        <span className="rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
                                            {r.status}
                                        </span>
                                    </div>
                                    <p className="mt-1 text-xs text-gray-600">{r.description}</p>
                                    {r.location_text && (
                                        <p className="text-xs text-gray-400">{r.location_text}</p>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </div>
        </ResidentLayout>
    );
}
