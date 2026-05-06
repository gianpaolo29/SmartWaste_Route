import { AnimatePresence, motion } from 'framer-motion';
import { Lock, Trash2, Construction, Dog, MessageSquare, X } from 'lucide-react';
import { useState } from 'react';

const reasons = [
    { label: 'Locked gate', icon: Lock },
    { label: 'No waste out', icon: Trash2 },
    { label: 'Road blocked', icon: Construction },
    { label: 'Dog / animal', icon: Dog },
    { label: 'Other', icon: MessageSquare },
];

type Props = {
    open: boolean;
    onClose: () => void;
    onSubmit: (reason: string) => void;
};

export function SkipReasonModal({ open, onClose, onSubmit }: Props) {
    const [selected, setSelected] = useState<string | null>(null);
    const [custom, setCustom] = useState('');

    const handleSubmit = () => {
        const reason = selected === 'Other' ? (custom.trim() || 'Other') : (selected ?? 'Skipped');
        onSubmit(reason);
        setSelected(null);
        setCustom('');
    };

    const handleClose = () => {
        setSelected(null);
        setCustom('');
        onClose();
    };

    return (
        <AnimatePresence>
            {open && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
                        onClick={handleClose}
                    />
                    <motion.div
                        initial={{ opacity: 0, y: 100 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 100 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-lg"
                    >
                        <div className="rounded-t-3xl border-t border-neutral-200/50 bg-white pb-8 shadow-2xl dark:border-neutral-700 dark:bg-neutral-900">
                            {/* Handle */}
                            <div className="flex justify-center pt-3 pb-1">
                                <div className="h-1 w-10 rounded-full bg-neutral-300 dark:bg-neutral-700" />
                            </div>

                            {/* Header */}
                            <div className="flex items-center justify-between px-5 pb-3">
                                <h3 className="text-base font-bold text-neutral-900 dark:text-white">Skip reason</h3>
                                <button onClick={handleClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 text-neutral-500 transition-colors hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400">
                                    <X size={16} />
                                </button>
                            </div>

                            {/* Reasons grid */}
                            <div className="grid grid-cols-2 gap-2 px-5">
                                {reasons.map(({ label, icon: Icon }) => (
                                    <button
                                        key={label}
                                        onClick={() => setSelected(label)}
                                        className={`flex items-center gap-3 rounded-2xl border-2 px-4 py-3.5 text-left text-sm font-medium transition-all active:scale-[0.97] ${
                                            selected === label
                                                ? 'border-amber-400 bg-amber-50 text-amber-700 dark:border-amber-600 dark:bg-amber-950/40 dark:text-amber-400'
                                                : 'border-neutral-100 bg-neutral-50 text-neutral-700 hover:border-neutral-200 dark:border-neutral-800 dark:bg-neutral-800/50 dark:text-neutral-300'
                                        }`}
                                    >
                                        <Icon size={18} className={selected === label ? 'text-amber-500' : 'text-neutral-400'} />
                                        {label}
                                    </button>
                                ))}
                            </div>

                            {/* Custom text input for "Other" */}
                            <AnimatePresence>
                                {selected === 'Other' && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden px-5"
                                    >
                                        <input
                                            value={custom}
                                            onChange={(e) => setCustom(e.target.value)}
                                            placeholder="Describe the reason..."
                                            autoFocus
                                            className="mt-3 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none transition-colors focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-500/20 dark:border-neutral-700 dark:bg-neutral-800/50 dark:text-white dark:focus:border-amber-600"
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Submit */}
                            <div className="mt-4 px-5">
                                <button
                                    onClick={handleSubmit}
                                    disabled={!selected}
                                    className="w-full rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-amber-500/20 transition-all active:scale-[0.97] disabled:opacity-40"
                                >
                                    Skip this stop
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
