import { router } from '@inertiajs/react';
import { AlertTriangle } from 'lucide-react';
import Swal from 'sweetalert2';

export default function DeleteUser() {
    const handleDelete = async () => {
        const { isConfirmed } = await Swal.fire({
            icon: 'warning',
            title: 'Delete your account?',
            text: 'All your data will be permanently removed. This action cannot be undone.',
            input: 'password',
            inputPlaceholder: 'Enter your password to confirm',
            inputAttributes: { autocomplete: 'current-password' },
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Delete account',
            reverseButtons: true,
            inputValidator: (value) => (!value ? 'Password is required' : null),
        });

        if (!isConfirmed) return;

        const password = Swal.getInput()?.value;

        router.delete('/settings/profile', {
            data: { password },
            preserveScroll: true,
            onError: (errors) => {
                Swal.fire({
                    icon: 'error',
                    title: 'Delete failed',
                    text: errors.password ?? 'Incorrect password. Please try again.',
                    confirmButtonColor: '#059669',
                });
            },
        });
    };

    return (
        <div className="space-y-4">
            <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-500 dark:bg-red-950/50 dark:text-red-400">
                    <AlertTriangle size={20} strokeWidth={1.8} />
                </div>
                <div>
                    <h3 className="text-base font-semibold text-neutral-900 dark:text-white">Delete Account</h3>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">Permanently remove your account and all data</p>
                </div>
            </div>

            <div className="rounded-xl border border-red-200/60 bg-red-50/50 p-4 dark:border-red-800/30 dark:bg-red-950/20">
                <p className="mb-3 text-sm text-red-700 dark:text-red-300">
                    Once deleted, all your data will be permanently removed. This action cannot be undone.
                </p>
                <button
                    onClick={handleDelete}
                    className="inline-flex items-center rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-700"
                    data-test="delete-user-button"
                >
                    Delete account
                </button>
            </div>
        </div>
    );
}
