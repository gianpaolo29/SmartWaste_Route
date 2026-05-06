import { CollectorBottombar } from '@/components/collector-bottombar';
import { CollectorTopbar } from '@/components/collector-topbar';
import { useIsMobile } from '@/hooks/use-mobile';
import { usePage } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import type { AppLayoutProps } from '@/types';

export default function CollectorLayout({ children }: AppLayoutProps) {
    const isMobile = useIsMobile();
    const { url } = usePage();

    return (
        <div className="flex min-h-screen w-full flex-col bg-neutral-50 dark:bg-neutral-950">
            {!isMobile && <CollectorTopbar />}

            <AnimatePresence mode="wait">
                <motion.main
                    key={url}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                    className={`flex w-full flex-1 flex-col ${isMobile ? '' : 'mx-auto max-w-7xl'}`}
                >
                    {children}
                </motion.main>
            </AnimatePresence>

            {isMobile && <CollectorBottombar />}
        </div>
    );
}
