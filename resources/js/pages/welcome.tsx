import { Head, Link, usePage } from '@inertiajs/react';
import { dashboard, login, register } from '@/routes';
import { Truck, MapPin, Calendar, AlertCircle, BarChart3, Globe, Leaf } from 'lucide-react';

export default function Welcome({
                                    canRegister = true,
                                }: {
    canRegister?: boolean;
}) {
    const { auth } = usePage().props;

    return (
        <>
            <Head title="Welcome | SmartWaste Route">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link
                    href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600"
                    rel="stylesheet"
                />
            </Head>
            <div className="flex min-h-screen flex-col bg-[#FDFDFC] text-[#1b1b18] dark:bg-[#0a0a0a] dark:text-[#EDEDEC]">

                <header className="sticky top-0 z-50 flex w-full items-center justify-between border-b border-[#19140015] bg-white/80 px-6 py-4 backdrop-blur-md dark:border-[#3E3E3A] dark:bg-[#0a0a0a]/80">
                    <div className="flex items-center gap-2 font-bold text-[#2d6a4f] dark:text-[#40916c]">
                        <Truck size={24} />
                        <span className="text-lg tracking-tight">SmartWaste Route</span>
                    </div>
                    <nav className="flex items-center gap-4 text-sm">
                        {auth.user ? (
                            <Link
                                href={dashboard()}
                                className="inline-block rounded-md bg-[#2d6a4f] px-5 py-2 text-white transition hover:bg-[#1b4332]"
                            >
                                Go to Dashboard
                            </Link>
                        ) : (
                            <>
                                <Link
                                    href={login()}
                                    className="px-4 py-2 font-medium hover:text-[#2d6a4f]"
                                >
                                    Log in
                                </Link>
                                {canRegister && (
                                    <Link
                                        href={register()}
                                        className="rounded-md border border-[#2d6a4f] px-5 py-2 font-medium text-[#2d6a4f] transition hover:bg-[#d8f3dc] dark:border-[#40916c] dark:text-[#40916c]"
                                    >
                                        Register
                                    </Link>
                                )}
                            </>
                        )}
                    </nav>
                </header>

                <main className="flex-grow">
                    {/* Hero Section */}
                    <section className="relative overflow-hidden px-6 py-16 text-center lg:py-32">
                        <div className="mx-auto max-w-4xl">
                            <h1 className="mb-6 text-4xl font-bold tracking-tight lg:text-6xl">
                                Efficient Logistics for a <span className="text-[#2d6a4f]">Cleaner Tomorrow</span>
                            </h1>
                            <p className="mx-auto mb-10 max-w-2xl text-lg text-[#706f6c] dark:text-[#A1A09A]">
                                Modernize your city's waste management. Optimize routes, monitor fleet performance, and empower residents with real-time reporting tools.
                            </p>
                            <div className="flex justify-center gap-4">
                                <Link href={register()} className="rounded-lg bg-[#2d6a4f] px-8 py-3 font-semibold text-white shadow-lg transition hover:scale-105 active:scale-95">
                                    Get Started Now
                                </Link>
                            </div>
                        </div>
                    </section>

                    {/* Features Grid */}
                    <section className="mx-auto max-w-6xl px-6 py-12">
                        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                            <FeatureCard
                                icon={<MapPin className="text-[#2d6a4f]" />}
                                title="Route Optimization"
                                description="AI-driven suggestions based on distance, time, and truck capacity to lower fuel costs."
                            />
                            <FeatureCard
                                icon={<Calendar className="text-[#2d6a4f]" />}
                                title="Zone Management"
                                description="Define service areas and publish pickup schedules that residents can access anywhere."
                            />
                            <FeatureCard
                                icon={<AlertCircle className="text-[#2d6a4f]" />}
                                title="Missed Pickup Reporting"
                                description="Real-time ticket workflow (Pending → Verified → Resolved) for resident satisfaction."
                            />
                            <FeatureCard
                                icon={<BarChart3 className="text-[#2d6a4f]" />}
                                title="Analytics Dashboard"
                                description="Monitor KPIs like truck utilization, slow routes, and peak waste zones in one place."
                            />
                            <FeatureCard
                                icon={<Leaf className="text-[#2d6a4f]" />}
                                title="SDG 12 & 13 Support"
                                description="Directly contribute to Climate Action and Responsible Production through efficiency."
                            />
                            <FeatureCard
                                icon={<Globe className="text-[#2d6a4f]" />}
                                title="Fleet Tracking"
                                description="Supervisors monitor collection progress live with optional GPS/time stamp validation."
                            />
                        </div>
                    </section>

                    {/* SDG Impact Banner */}
                    <section className="bg-[#d8f3dc] py-16 dark:bg-[#1b4332]/20">
                        <div className="mx-auto max-w-4xl px-6 text-center">
                            <h2 className="mb-8 text-2xl font-bold uppercase tracking-widest text-[#1b4332] dark:text-[#d8f3dc]">Our Global Impact</h2>
                            <div className="flex flex-col justify-center gap-8 md:flex-row">
                                <div className="flex-1 rounded-xl bg-white p-8 shadow-sm dark:bg-[#161615]">
                                    <div className="mb-4 text-3xl font-black text-[#2d6a4f]">SDG 12</div>
                                    <p className="text-sm font-medium">Responsible Consumption</p>
                                    <p className="mt-2 text-xs text-[#706f6c]">Improving segregation and performance tracking for better recycling outcomes.</p>
                                </div>
                                <div className="flex-1 rounded-xl bg-white p-8 shadow-sm dark:bg-[#161615]">
                                    <div className="mb-4 text-3xl font-black text-[#2d6a4f]">SDG 13</div>
                                    <p className="text-sm font-medium">Climate Action</p>
                                    <p className="mt-2 text-xs text-[#706f6c]">Reducing carbon emissions by eliminating unnecessary trips and idle time.</p>
                                </div>
                            </div>
                        </div>
                    </section>
                </main>

                <footer className="border-t border-[#19140015] p-8 text-center text-sm text-[#706f6c] dark:border-[#3E3E3A]">
                    <p>&copy; 2026 SmartWaste Route. Built for modern municipalities.</p>
                </footer>
            </div>
        </>
    );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
    return (
        <div className="flex flex-col rounded-2xl border border-[#19140010] bg-white p-8 shadow-sm transition hover:shadow-md dark:border-[#3E3E3A] dark:bg-[#161615]">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-[#d8f3dc] dark:bg-[#2d6a4f]/20">
                {icon}
            </div>
            <h3 className="mb-2 font-semibold text-lg">{title}</h3>
            <p className="text-sm leading-relaxed text-[#706f6c] dark:text-[#A1A09A]">
                {description}
            </p>
        </div>
    );
}
