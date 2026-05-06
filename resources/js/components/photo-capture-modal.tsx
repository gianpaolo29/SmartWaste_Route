import { AnimatePresence, motion } from 'framer-motion';
import { Camera, Image, X, CheckCircle2, Trash2 } from 'lucide-react';
import { useRef, useState } from 'react';

type Props = {
    open: boolean;
    onClose: () => void;
    onSubmit: (photo: File | null) => void;
};

export function PhotoCaptureModal({ open, onClose, onSubmit }: Props) {
    const cameraRef = useRef<HTMLInputElement>(null);
    const galleryRef = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [file, setFile] = useState<File | null>(null);

    const handleFile = (f: File) => {
        setFile(f);
        const reader = new FileReader();
        reader.onload = (e) => setPreview(e.target?.result as string);
        reader.readAsDataURL(f);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (f) handleFile(f);
        if (e.target) e.target.value = '';
    };

    const reset = () => {
        setPreview(null);
        setFile(null);
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    const handleSubmit = () => {
        onSubmit(file);
        reset();
    };

    const handleSkip = () => {
        onSubmit(null);
        reset();
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
                                <h3 className="text-base font-bold text-neutral-900 dark:text-white">Collection proof</h3>
                                <button onClick={handleClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 text-neutral-500 transition-colors hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400">
                                    <X size={16} />
                                </button>
                            </div>

                            {/* Preview or picker */}
                            {preview ? (
                                <div className="px-5">
                                    <div className="relative overflow-hidden rounded-2xl">
                                        <img src={preview} alt="Proof" className="h-48 w-full object-cover" />
                                        <button
                                            onClick={reset}
                                            className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-black/70"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                    <button
                                        onClick={handleSubmit}
                                        className="mt-4 w-full rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.97]"
                                    >
                                        <CheckCircle2 size={16} className="mr-2 inline" />
                                        Mark as Collected
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-3 px-5">
                                    <p className="text-xs text-neutral-400">Take a photo as proof of collection (optional)</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => cameraRef.current?.click()}
                                            className="flex flex-col items-center gap-2 rounded-2xl border-2 border-neutral-100 bg-neutral-50 p-5 text-sm font-medium text-neutral-700 transition-all active:scale-[0.97] hover:border-emerald-200 hover:bg-emerald-50 dark:border-neutral-800 dark:bg-neutral-800/50 dark:text-neutral-300"
                                        >
                                            <Camera size={24} className="text-emerald-600 dark:text-emerald-400" />
                                            Take Photo
                                        </button>
                                        <button
                                            onClick={() => galleryRef.current?.click()}
                                            className="flex flex-col items-center gap-2 rounded-2xl border-2 border-neutral-100 bg-neutral-50 p-5 text-sm font-medium text-neutral-700 transition-all active:scale-[0.97] hover:border-blue-200 hover:bg-blue-50 dark:border-neutral-800 dark:bg-neutral-800/50 dark:text-neutral-300"
                                        >
                                            <Image size={24} className="text-blue-600 dark:text-blue-400" />
                                            Gallery
                                        </button>
                                    </div>

                                    <button
                                        onClick={handleSkip}
                                        className="w-full rounded-2xl border-2 border-neutral-100 bg-white px-4 py-3.5 text-sm font-semibold text-neutral-600 transition-all active:scale-[0.97] hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400"
                                    >
                                        Skip photo — mark collected
                                    </button>
                                </div>
                            )}

                            {/* Hidden inputs */}
                            <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleChange} />
                            <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={handleChange} />
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
