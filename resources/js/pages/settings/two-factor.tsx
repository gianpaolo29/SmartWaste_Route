import { Form, Head } from '@inertiajs/react';
import { ShieldBan, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import TwoFactorRecoveryCodes from '@/components/two-factor-recovery-codes';
import TwoFactorSetupModal from '@/components/two-factor-setup-modal';
import { useTwoFactorAuth } from '@/hooks/use-two-factor-auth';
import SettingsLayout from '@/layouts/settings/layout';
import { disable, enable } from '@/routes/two-factor';

type Props = {
    requiresConfirmation?: boolean;
    twoFactorEnabled?: boolean;
};

export default function TwoFactor({ requiresConfirmation = false, twoFactorEnabled = false }: Props) {
    const { qrCodeSvg, hasSetupData, manualSetupKey, clearSetupData, fetchSetupData, recoveryCodesList, fetchRecoveryCodes, errors } = useTwoFactorAuth();
    const [showSetupModal, setShowSetupModal] = useState(false);

    return (
        <SettingsLayout title="Two-Factor Auth">
            <Head title="Two-Factor Auth" />

            <div className="flex items-start gap-3 mb-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                    <ShieldCheck size={20} strokeWidth={1.8} />
                </div>
                <div>
                    <h3 className="text-base font-semibold text-neutral-900 dark:text-white">Two-Factor Authentication</h3>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">Extra security for your account</p>
                </div>
            </div>

            {twoFactorEnabled ? (
                <div className="space-y-4">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Enabled
                    </span>
                    <div className="rounded-xl bg-emerald-50/60 p-3.5 dark:bg-emerald-950/20">
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            Two-factor authentication is active. You'll be prompted for a pin from your authenticator app during login.
                        </p>
                    </div>
                    <TwoFactorRecoveryCodes recoveryCodesList={recoveryCodesList} fetchRecoveryCodes={fetchRecoveryCodes} errors={errors} />
                    <Form {...disable.form()}>
                        {({ processing }) => (
                            <button type="submit" disabled={processing}
                                className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-700 disabled:opacity-50">
                                <ShieldBan size={16} /> Disable 2FA
                            </button>
                        )}
                    </Form>
                </div>
            ) : (
                <div className="space-y-4">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700 dark:bg-red-900/40 dark:text-red-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-red-500" /> Disabled
                    </span>
                    <div className="rounded-xl bg-neutral-50 p-3.5 dark:bg-neutral-800/50">
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            When enabled, you'll need a pin from your authenticator app to log in.
                        </p>
                    </div>
                    {hasSetupData ? (
                        <button onClick={() => setShowSetupModal(true)}
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700">
                            <ShieldCheck size={16} /> Continue Setup
                        </button>
                    ) : (
                        <Form {...enable.form()} onSuccess={() => setShowSetupModal(true)}>
                            {({ processing }) => (
                                <button type="submit" disabled={processing}
                                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:opacity-50">
                                    {processing ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <ShieldCheck size={16} />}
                                    {processing ? 'Enabling...' : 'Enable 2FA'}
                                </button>
                            )}
                        </Form>
                    )}
                </div>
            )}

            <TwoFactorSetupModal isOpen={showSetupModal} onClose={() => setShowSetupModal(false)} requiresConfirmation={requiresConfirmation} twoFactorEnabled={twoFactorEnabled} qrCodeSvg={qrCodeSvg} manualSetupKey={manualSetupKey} clearSetupData={clearSetupData} fetchSetupData={fetchSetupData} errors={errors} />
        </SettingsLayout>
    );
}
