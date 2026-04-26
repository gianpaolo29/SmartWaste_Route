import { Truck } from 'lucide-react';

export default function AppLogo() {
    return (
        <>
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#2d6a4f] to-[#40916c] text-white shadow-sm">
                <Truck size={17} />
            </div>
            <div className="ml-1 grid flex-1 text-left text-sm">
                <span className="truncate leading-tight font-bold text-[#1b4332] dark:text-white">
                    SmartWaste
                </span>
            </div>
        </>
    );
}
