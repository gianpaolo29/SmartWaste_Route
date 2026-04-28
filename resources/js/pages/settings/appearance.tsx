import { Head } from '@inertiajs/react';
import { Palette } from 'lucide-react';
import AppearanceTabs from '@/components/appearance-tabs';
import SettingsLayout from '@/layouts/settings/layout';

export default function Appearance() {
    return (
        <SettingsLayout title="Appearance">
            <Head title="Appearance" />

            <div className="flex items-start gap-3 mb-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                    <Palette size={20} strokeWidth={1.8} />
                </div>
                <div>
                    <h3 className="text-base font-semibold text-neutral-900 dark:text-white">Appearance</h3>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">Choose your preferred theme</p>
                </div>
            </div>

            <AppearanceTabs />
        </SettingsLayout>
    );
}
