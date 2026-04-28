import { Form, Head } from '@inertiajs/react';
import { KeyRound, Lock, ShieldCheck } from 'lucide-react';
import { useRef } from 'react';
import PasswordController from '@/actions/App/Http/Controllers/Settings/PasswordController';
import InputError from '@/components/input-error';
import SettingsLayout from '@/layouts/settings/layout';
import { successAlert } from '@/lib/notify';

const inputClass = 'w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-sm text-neutral-900 outline-none transition-colors focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 dark:border-neutral-700 dark:bg-neutral-800/50 dark:text-white dark:focus:border-emerald-700 dark:focus:bg-neutral-900';

export default function Password() {
    const passwordInput = useRef<HTMLInputElement>(null);
    const currentPasswordInput = useRef<HTMLInputElement>(null);

    return (
        <SettingsLayout title="Password">
            <Head title="Password" />

            <div className="flex items-start gap-3 mb-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                    <KeyRound size={20} strokeWidth={1.8} />
                </div>
                <div>
                    <h3 className="text-base font-semibold text-neutral-900 dark:text-white">Update Password</h3>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">Use a strong, unique password</p>
                </div>
            </div>

            <Form
                {...PasswordController.update.form()}
                options={{ preserveScroll: true }}
                resetOnError={['password', 'password_confirmation', 'current_password']}
                resetOnSuccess
                onSuccess={() => successAlert('Password updated')}
                onError={(errors) => {
                    if (errors.password) passwordInput.current?.focus();
                    if (errors.current_password) currentPasswordInput.current?.focus();
                }}
                className="space-y-4"
            >
                {({ errors, processing }) => (
                    <>
                        <div className="grid gap-1">
                            <label className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-neutral-400">
                                <Lock size={11} /> Current password
                            </label>
                            <input ref={currentPasswordInput} name="current_password" type="password"
                                className={inputClass} autoComplete="current-password" placeholder="Enter current password" />
                            <InputError message={errors.current_password} />
                        </div>
                        <div className="grid gap-1">
                            <label className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-neutral-400">
                                <ShieldCheck size={11} /> New password
                            </label>
                            <input ref={passwordInput} name="password" type="password"
                                className={inputClass} autoComplete="new-password" placeholder="Enter new password" />
                            <InputError message={errors.password} />
                        </div>
                        <div className="grid gap-1">
                            <label className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-neutral-400">
                                <ShieldCheck size={11} /> Confirm password
                            </label>
                            <input name="password_confirmation" type="password"
                                className={inputClass} autoComplete="new-password" placeholder="Confirm new password" />
                            <InputError message={errors.password_confirmation} />
                        </div>
                        <button type="submit" disabled={processing}
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:opacity-50">
                            {processing ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : null}
                            {processing ? 'Saving...' : 'Save password'}
                        </button>
                    </>
                )}
            </Form>
        </SettingsLayout>
    );
}
