import { Head, useForm } from '@inertiajs/react';
import { AlertTriangle, FileText, Send } from 'lucide-react';
import ResidentLayout from '@/layouts/resident-layout';
import { errorAlert, successAlert } from '@/lib/notify';
import type { BreadcrumbItem } from '@/types';

type Report = {
    id: number;
    description: string;
    location_text: string | null;
    status: string;
    report_datetime: string | null;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Home', href: '/resident/dashboard' },
    { title: 'Missed Pickup', href: '/resident/missed-pickup' },
];

export default function ResidentMissedPickup({ reports }: { reports: Report[] }) {
    const { data, setData, post, processing, reset, errors } = useForm({
        description: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        const desc = data.description.trim();
        if (desc.length < 10) {
            errorAlert('Too short', 'Please describe what happened (at least 10 characters).');
            return;
        }
        post('/resident/missed-pickup', {
            preserveScroll: true,
            onSuccess: () => {
                reset('description');
                successAlert('Report submitted', 'We have received your missed pickup report.');
            },
            onError: () => errorAlert('Submit failed', 'Something went wrong. Please try again.'),
        });
    };

    const statusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'resolved':
                return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400';
            case 'pending':
                return 'bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400';
            default:
                return 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400';
        }
    };

    return (
        <ResidentLayout breadcrumbs={breadcrumbs}>
            <Head title="Missed Pickup" />
            <div className="space-y-4 px-4 py-5">
                {/* Header */}
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">Report a Missed Pickup</h1>
                    <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">Let us know if your garbage was not collected</p>
                </div>

                {/* Form */}
                <form
                    onSubmit={submit}
                    className="overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
                >
                    <div className="flex items-center gap-2 border-b border-neutral-100 px-4 py-3 dark:border-neutral-800">
                        <AlertTriangle size={15} className="text-amber-600 dark:text-amber-400" />
                        <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">What happened?</h2>
                    </div>
                    <div className="p-4 space-y-3">
                        <textarea
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            rows={4}
                            placeholder="e.g. The garbage truck did not stop at our house this morning."
                            className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 transition-colors focus:border-emerald-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-neutral-700 dark:bg-neutral-800/50 dark:text-white dark:placeholder:text-neutral-500 dark:focus:border-emerald-700 dark:focus:bg-neutral-900"
                        />
                        {errors.description && (
                            <p className="text-xs text-red-600 dark:text-red-400">{errors.description}</p>
                        )}
                        <button
                            type="submit"
                            disabled={processing}
                            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:opacity-50 dark:bg-emerald-600 dark:hover:bg-emerald-500"
                        >
                            {processing ? (
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                            ) : (
                                <Send size={15} />
                            )}
                            {processing ? 'Submitting…' : 'Submit Report'}
                        </button>
                    </div>
                </form>

                {/* Reports list */}
                <section className="overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <div className="flex items-center gap-2 border-b border-neutral-100 px-4 py-3 dark:border-neutral-800">
                        <FileText size={15} className="text-emerald-600 dark:text-emerald-400" />
                        <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">My Reports</h2>
                        {reports.length > 0 && (
                            <span className="ml-auto rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-semibold text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
                                {reports.length}
                            </span>
                        )}
                    </div>
                    <div className="px-4 pb-4">
                        {reports.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50 px-4 py-8 mt-4 text-center dark:border-neutral-800 dark:bg-neutral-800/30">
                                <FileText size={28} className="mx-auto text-neutral-300 dark:text-neutral-600" />
                                <p className="mt-2 text-sm text-neutral-400 dark:text-neutral-500">No reports yet.</p>
                            </div>
                        ) : (
                            <ul className="divide-y divide-neutral-100 text-sm dark:divide-neutral-800">
                                {reports.map((r) => (
                                    <li key={r.id} className="py-3">
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium text-neutral-900 dark:text-white">{r.report_datetime}</span>
                                            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusColor(r.status)}`}>
                                                {r.status}
                                            </span>
                                        </div>
                                        <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">{r.description}</p>
                                        {r.location_text && (
                                            <p className="mt-0.5 text-[11px] text-neutral-400 dark:text-neutral-500">{r.location_text}</p>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </section>
            </div>
        </ResidentLayout>
    );
}
