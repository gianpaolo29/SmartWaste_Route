import type { LucideIcon } from 'lucide-react';
import { Check, Monitor, Moon, Sun } from 'lucide-react';
import type { HTMLAttributes } from 'react';
import type { Appearance } from '@/hooks/use-appearance';
import { useAppearance } from '@/hooks/use-appearance';
import { cn } from '@/lib/utils';

export default function AppearanceToggleTab({
    className = '',
    ...props
}: HTMLAttributes<HTMLDivElement>) {
    const { appearance, updateAppearance } = useAppearance();

    const tabs: { value: Appearance; icon: LucideIcon; label: string; description: string }[] = [
        { value: 'light', icon: Sun, label: 'Light', description: 'Clean and bright' },
        { value: 'dark', icon: Moon, label: 'Dark', description: 'Easy on the eyes' },
        { value: 'system', icon: Monitor, label: 'System', description: 'Match your device' },
    ];

    return (
        <div className={cn('grid gap-3 sm:grid-cols-3', className)} {...props}>
            {tabs.map(({ value, icon: Icon, label, description }) => {
                const active = appearance === value;
                return (
                    <button
                        key={value}
                        onClick={() => updateAppearance(value)}
                        className={cn(
                            'relative flex flex-col items-center gap-2 rounded-2xl border-2 p-5 transition-all duration-200',
                            active
                                ? 'border-emerald-500 bg-emerald-50 shadow-sm dark:border-emerald-500 dark:bg-emerald-950/30'
                                : 'border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-800/40 dark:hover:border-neutral-700',
                        )}
                    >
                        {active && (
                            <div className="absolute right-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white">
                                <Check size={12} strokeWidth={3} />
                            </div>
                        )}
                        <div className={cn(
                            'flex h-11 w-11 items-center justify-center rounded-xl transition-colors',
                            active
                                ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400'
                                : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-700 dark:text-neutral-400',
                        )}>
                            <Icon size={22} strokeWidth={1.8} />
                        </div>
                        <div className="text-center">
                            <p className={cn('text-sm font-semibold', active ? 'text-emerald-700 dark:text-emerald-400' : 'text-neutral-700 dark:text-neutral-300')}>
                                {label}
                            </p>
                            <p className="text-[11px] text-neutral-400 dark:text-neutral-500">{description}</p>
                        </div>
                    </button>
                );
            })}
        </div>
    );
}
