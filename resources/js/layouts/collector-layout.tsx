import { CollectorBottombar } from '@/components/collector-bottombar';
import { CollectorTopbar } from '@/components/collector-topbar';
import { useIsMobile } from '@/hooks/use-mobile';
import type { AppLayoutProps } from '@/types';

export default function CollectorLayout({ children }: AppLayoutProps) {
    const isMobile = useIsMobile();

    return (
        <div className="flex min-h-screen w-full flex-col bg-neutral-50 dark:bg-neutral-950">
            {!isMobile && <CollectorTopbar />}

            <main className={`mx-auto flex w-full max-w-7xl flex-1 flex-col ${isMobile ? 'pb-24' : ''}`}>
                {children}
            </main>

            {isMobile && <CollectorBottombar />}
        </div>
    );
}
