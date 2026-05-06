import { Head } from '@inertiajs/react';
import { Leaf, Recycle, Trash2, Package, Flame, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import ResidentLayout from '@/layouts/resident-layout';

const categories = [
    {
        name: 'Mixed Waste',
        color: 'bg-amber-500',
        bg: 'bg-amber-50 dark:bg-amber-950/30',
        border: 'border-amber-200 dark:border-amber-800/40',
        text: 'text-amber-700 dark:text-amber-400',
        icon: Package,
        description: 'General waste that does not fit into other categories.',
        examples: ['Diapers', 'Sanitary napkins', 'Soiled paper', 'Candy wrappers', 'Cigarette butts', 'Broken ceramics'],
        tip: 'Use a separate bag and tie it securely before placing outside.',
    },
    {
        name: 'Biodegradable',
        color: 'bg-emerald-500',
        bg: 'bg-emerald-50 dark:bg-emerald-950/30',
        border: 'border-emerald-200 dark:border-emerald-800/40',
        text: 'text-emerald-700 dark:text-emerald-400',
        icon: Leaf,
        description: 'Organic waste that decomposes naturally.',
        examples: ['Food scraps', 'Fruit & vegetable peels', 'Leaves & garden waste', 'Eggshells', 'Coffee grounds', 'Paper napkins'],
        tip: 'Compost at home if possible. Keep wet waste separate from dry.',
    },
    {
        name: 'Recyclable',
        color: 'bg-blue-500',
        bg: 'bg-blue-50 dark:bg-blue-950/30',
        border: 'border-blue-200 dark:border-blue-800/40',
        text: 'text-blue-700 dark:text-blue-400',
        icon: Recycle,
        description: 'Materials that can be processed and reused.',
        examples: ['Plastic bottles', 'Aluminum cans', 'Cardboard', 'Glass bottles', 'Paper & newspaper', 'Metal containers'],
        tip: 'Rinse containers before recycling. Flatten boxes to save space.',
    },
    {
        name: 'Residual',
        color: 'bg-neutral-400',
        bg: 'bg-neutral-100 dark:bg-neutral-800/50',
        border: 'border-neutral-200 dark:border-neutral-700',
        text: 'text-neutral-600 dark:text-neutral-400',
        icon: Trash2,
        description: 'Non-recyclable, non-compostable waste that goes to landfill.',
        examples: ['Styrofoam', 'Multilayer packaging', 'Worn-out shoes', 'Old toys', 'Broken electronics', 'Used toothbrushes'],
        tip: 'Minimize residual waste by choosing products with less packaging.',
    },
    {
        name: 'Solid Waste',
        color: 'bg-red-500',
        bg: 'bg-red-50 dark:bg-red-950/30',
        border: 'border-red-200 dark:border-red-800/40',
        text: 'text-red-700 dark:text-red-400',
        icon: Flame,
        description: 'Bulky or special waste requiring separate handling.',
        examples: ['Construction debris', 'Old furniture', 'Appliances', 'Tires', 'Mattresses', 'Large branches'],
        tip: 'Schedule a special pickup for bulky items. Do not mix with regular waste.',
    },
];

const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 16 } as const,
    animate: { opacity: 1, y: 0 } as const,
    transition: { duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
});

export default function WasteGuide() {
    return (
        <ResidentLayout>
            <Head title="Waste Segregation Guide" />
            <div className="space-y-5 px-4 py-5 pb-36">

                <motion.div {...fadeUp(0)}>
                    <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">Waste Segregation Guide</h1>
                    <p className="mt-0.5 text-sm text-neutral-400">Learn how to properly sort your waste for collection</p>
                </motion.div>

                {/* Color legend */}
                <motion.div {...fadeUp(0.05)} className="flex flex-wrap gap-2">
                    {categories.map((c) => (
                        <span key={c.name} className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-medium shadow-sm dark:bg-neutral-900">
                            <span className={`h-2.5 w-2.5 rounded-full ${c.color}`} />
                            <span className={c.text}>{c.name}</span>
                        </span>
                    ))}
                </motion.div>

                {/* Category cards */}
                <div className="space-y-4">
                    {categories.map((cat, i) => {
                        const Icon = cat.icon;
                        return (
                            <motion.div
                                key={cat.name}
                                {...fadeUp(0.1 + i * 0.06)}
                                className={`overflow-hidden rounded-2xl border bg-white shadow-sm dark:bg-neutral-900 ${cat.border}`}
                            >
                                {/* Header */}
                                <div className={`flex items-center gap-3 ${cat.bg} px-5 py-4`}>
                                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${cat.color} text-white shadow-md`}>
                                        <Icon size={20} />
                                    </div>
                                    <div>
                                        <h2 className={`text-sm font-bold ${cat.text}`}>{cat.name}</h2>
                                        <p className="text-xs text-neutral-500 dark:text-neutral-400">{cat.description}</p>
                                    </div>
                                </div>

                                {/* Examples */}
                                <div className="px-5 py-4">
                                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">Examples</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {cat.examples.map((ex) => (
                                            <span key={ex} className="rounded-lg bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                                                {ex}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Tip */}
                                <div className="border-t border-neutral-100 px-5 py-3 dark:border-neutral-800">
                                    <div className="flex items-start gap-2">
                                        <Info size={13} className="mt-0.5 shrink-0 text-neutral-400" />
                                        <p className="text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">{cat.tip}</p>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </ResidentLayout>
    );
}
