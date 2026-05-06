export default function AppLogo() {
    return (
        <>
            <img src="/logo.png" alt="SmartWaste" className="size-8 object-contain" />
            <div className="ml-1.5 grid flex-1 text-left text-sm">
                <span className="truncate leading-tight font-extrabold tracking-tight text-emerald-900 dark:text-white">
                    SmartWaste
                </span>
            </div>
        </>
    );
}
