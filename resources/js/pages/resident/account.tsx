import { Form, Head, Link, router, usePage } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { ResidentBottombar } from '@/components/resident-bottombar';
import { ResidentTopbar } from '@/components/resident-topbar';
import AppearanceTabs from '@/components/appearance-tabs';
import InputError from '@/components/input-error';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useIsMobile } from '@/hooks/use-mobile';
import { useInitials } from '@/hooks/use-initials';
import { confirm as confirmDialog, successAlert } from '@/lib/notify';
import { logout } from '@/routes';
import PasswordController from '@/actions/App/Http/Controllers/Settings/PasswordController';
import {
    AlertTriangle, Camera, Check, ChevronDown, ChevronLeft,
    KeyRound, Lock, LogOut, Mail, MapPin, Palette,
    Pencil, ShieldCheck, Trash2, User as UserIcon, X,
} from 'lucide-react';
import { useRef, useState } from 'react';
import type { User } from '@/types';

type Props = {
    twoFactorEnabled?: boolean;
    stats: { reports: number; zone: string | null; address: string | null };
};

// Shared input class
const inputCls = 'w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-sm text-neutral-900 outline-none transition-colors focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 dark:border-neutral-700 dark:bg-neutral-800/50 dark:text-white dark:focus:border-emerald-700';

// Accordion row component
function AccordionRow({ icon: Icon, label, isOpen, onToggle, children, isLast = false }: {
    icon: React.ElementType; label: string; isOpen: boolean; onToggle: () => void; children: React.ReactNode; isLast?: boolean;
}) {
    return (
        <div className={!isLast ? 'border-b border-neutral-100 dark:border-neutral-800' : ''}>
            <button onClick={onToggle} className={`flex w-full items-center gap-4 px-4 py-3.5 transition-colors ${isOpen ? 'bg-emerald-50 dark:bg-emerald-950/30' : 'hover:bg-neutral-50 active:bg-neutral-100 dark:hover:bg-neutral-800/50'}`}>
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors ${isOpen ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400'}`}>
                    <Icon size={18} strokeWidth={1.8} />
                </div>
                <span className={`flex-1 text-left text-sm font-medium ${isOpen ? 'text-emerald-700 dark:text-emerald-400' : 'text-neutral-800 dark:text-neutral-200'}`}>{label}</span>
                <ChevronDown size={16} className={`text-neutral-400 transition-transform duration-200 dark:text-neutral-600 ${isOpen ? 'rotate-180 !text-emerald-500' : ''}`} />
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25, ease: 'easeInOut' }} className="overflow-hidden">
                        <div className="border-t border-neutral-100 px-4 py-4 dark:border-neutral-800">
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default function ResidentAccount({ stats }: Props) {
    const { auth } = usePage().props as { auth: { user: User } };
    const getInitials = useInitials();
    const isMobile = useIsMobile();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [openSection, setOpenSection] = useState<string | null>(null);

    // Edit profile state
    const [profileProcessing, setProfileProcessing] = useState(false);
    const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});
    const [name, setName] = useState(auth.user.name);
    const [email, setEmail] = useState(auth.user.email);

    const displayAvatar = avatarPreview || auth.user.avatar;

    const toggle = (section: string) => {
        setOpenSection(openSection === section ? null : section);
        // Reset profile form when closing
        if (section === 'profile' && openSection === 'profile') {
            setName(auth.user.name);
            setEmail(auth.user.email);
            setProfileErrors({});
        }
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
        reader.readAsDataURL(file);
        const formData = new FormData();
        formData.append('avatar', file);
        formData.append('name', auth.user.name);
        formData.append('email', auth.user.email);
        router.post('/settings/profile', formData, { forceFormData: true, preserveScroll: true, onSuccess: () => setAvatarPreview(null) });
    };

    const handleSaveProfile = () => {
        setProfileProcessing(true);
        setProfileErrors({});
        router.post('/settings/profile', { name, email }, {
            preserveScroll: true,
            onSuccess: () => { setOpenSection(null); successAlert('Profile updated'); },
            onError: (errs) => setProfileErrors(errs),
            onFinish: () => setProfileProcessing(false),
        });
    };

    const handleLogout = async () => {
        const yes = await confirmDialog('Log out?', 'Are you sure you want to log out?', 'Log out');
        if (!yes) return;
        document.body.style.removeProperty('pointer-events');
        router.flushAll();
        router.post(logout());
    };

    const quickActions = [
        { icon: AlertTriangle, label: 'My Reports', value: stats.reports, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/40', href: '/resident/missed-pickup' },
        { icon: MapPin, label: 'My Zone', value: stats.zone ?? 'Not set', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/40', href: '/resident/location/setup' },
    ];

    return (
        <>
            <Head title="My Account" />
            <div className="flex min-h-screen flex-col bg-neutral-50 dark:bg-neutral-950">
                {!isMobile && <ResidentTopbar />}

                {/* ===== Header ===== */}
                <div className="relative mb-16">
                    <div className="relative h-48 overflow-hidden bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 dark:from-emerald-700 dark:via-emerald-800 dark:to-teal-800">
                        <div className="absolute right-[-30px] top-[-20px] h-40 w-40 rounded-full bg-white/10" />
                        <div className="absolute right-[40px] top-[30px] h-24 w-24 rounded-full bg-white/[0.07]" />
                        <div className="absolute left-[-20px] top-[20px] h-20 w-20 rounded-full bg-white/[0.05]" />
                    </div>
                    <svg viewBox="0 0 400 30" className="absolute -bottom-[1px] left-0 z-10 w-full" preserveAspectRatio="none">
                        <path d="M 0 30 Q 100 0 200 15 Q 300 30 400 10 L 400 30 Z" className="fill-neutral-50 dark:fill-neutral-950" />
                    </svg>
                    <div className="absolute left-0 right-0 top-0 z-20 flex items-center px-4 pt-4">
                        <Link href="/resident/dashboard" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-colors hover:bg-white/30"><ChevronLeft size={20} /></Link>
                        <h1 className="flex-1 text-center text-lg font-semibold text-white">Profile</h1>
                        <div className="w-9" />
                    </div>
                    <div className="absolute -bottom-12 left-1/2 z-30 -translate-x-1/2">
                        <div className="group relative">
                            <div className="rounded-full bg-gradient-to-br from-emerald-400 to-teal-400 p-[3px] shadow-xl shadow-emerald-600/20 dark:from-emerald-500 dark:to-teal-500 dark:shadow-emerald-900/30">
                                <Avatar className="h-[88px] w-[88px] border-[3px] border-neutral-50 dark:border-neutral-950">
                                    <AvatarImage src={displayAvatar ?? undefined} alt={auth.user.name} className="object-cover" />
                                    <AvatarFallback className="bg-gradient-to-br from-emerald-100 to-teal-100 text-2xl font-bold text-emerald-700 dark:from-emerald-900 dark:to-teal-900 dark:text-emerald-300">{getInitials(auth.user.name)}</AvatarFallback>
                                </Avatar>
                            </div>
                            <button type="button" onClick={() => fileInputRef.current?.click()} className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full border-2 border-neutral-50 bg-emerald-500 text-white shadow-md transition-transform hover:scale-110 dark:border-neutral-950"><Camera size={13} /></button>
                            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarChange} />
                        </div>
                    </div>
                </div>

                {/* ===== Name + Role ===== */}
                <div className="text-center px-4">
                    <h2 className="text-xl font-bold text-neutral-900 dark:text-white">{auth.user.name}</h2>
                    <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">{auth.user.email}</p>
                    <span className="mt-2 inline-flex items-center rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-semibold capitalize text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400">Resident</span>
                </div>

                {/* ===== Quick Stats ===== */}
                <div className="mt-5 px-4">
                    <div className="grid grid-cols-2 gap-3">
                        {quickActions.map((item) => (
                            <Link key={item.label} href={item.href} className={`flex flex-col items-center gap-2 rounded-2xl ${item.bg} p-4 transition-transform active:scale-[0.97]`}>
                                <div className={`rounded-xl p-2 ${item.color}`}><item.icon size={22} strokeWidth={1.8} /></div>
                                <span className="text-lg font-bold text-neutral-800 dark:text-white">{item.value}</span>
                                <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">{item.label}</span>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* ===== Settings Accordions ===== */}
                <div className="mt-5 px-4">
                    <div className="overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-neutral-900">

                        {/* Edit Profile */}
                        <AccordionRow icon={Pencil} label="Edit Profile" isOpen={openSection === 'profile'} onToggle={() => toggle('profile')}>
                            <div className="space-y-3">
                                <div className="grid gap-1">
                                    <label className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-neutral-400"><UserIcon size={11} /> Name</label>
                                    <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className={inputCls} />
                                    <InputError message={profileErrors.name} />
                                </div>
                                <div className="grid gap-1">
                                    <label className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-neutral-400"><Mail size={11} /> Email</label>
                                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" className={inputCls} />
                                    <InputError message={profileErrors.email} />
                                </div>
                                <div className="flex gap-2 pt-1">
                                    <button onClick={() => toggle('profile')} disabled={profileProcessing} className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl border border-neutral-200 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-400"><X size={15} /> Cancel</button>
                                    <button onClick={handleSaveProfile} disabled={profileProcessing} className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:opacity-50"><Check size={15} /> {profileProcessing ? 'Saving...' : 'Save'}</button>
                                </div>
                            </div>
                        </AccordionRow>

                        {/* Password */}
                        <AccordionRow icon={KeyRound} label="Password" isOpen={openSection === 'password'} onToggle={() => toggle('password')}>
                            <Form
                                {...PasswordController.update.form()}
                                options={{ preserveScroll: true }}
                                resetOnError={['password', 'password_confirmation', 'current_password']}
                                resetOnSuccess
                                onSuccess={() => { setOpenSection(null); successAlert('Password updated'); }}
                                className="space-y-3"
                            >
                                {({ errors, processing }) => (
                                    <>
                                        <div className="grid gap-1">
                                            <label className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-neutral-400"><Lock size={11} /> Current password</label>
                                            <input name="current_password" type="password" autoComplete="current-password" placeholder="Current password" className={inputCls} />
                                            <InputError message={errors.current_password} />
                                        </div>
                                        <div className="grid gap-1">
                                            <label className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-neutral-400"><ShieldCheck size={11} /> New password</label>
                                            <input name="password" type="password" autoComplete="new-password" placeholder="New password" className={inputCls} />
                                            <InputError message={errors.password} />
                                        </div>
                                        <div className="grid gap-1">
                                            <label className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-neutral-400"><ShieldCheck size={11} /> Confirm password</label>
                                            <input name="password_confirmation" type="password" autoComplete="new-password" placeholder="Confirm password" className={inputCls} />
                                            <InputError message={errors.password_confirmation} />
                                        </div>
                                        <button type="submit" disabled={processing} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:opacity-50">
                                            {processing ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <Check size={15} />}
                                            {processing ? 'Saving...' : 'Save password'}
                                        </button>
                                    </>
                                )}
                            </Form>
                        </AccordionRow>

                        {/* Appearance */}
                        <AccordionRow icon={Palette} label="Appearance" isOpen={openSection === 'appearance'} onToggle={() => toggle('appearance')} isLast>
                            <AppearanceTabs />
                        </AccordionRow>

                    </div>
                </div>

                {/* ===== Remove Avatar ===== */}
                {auth.user.avatar && (
                    <div className="mt-3 px-4">
                        <button onClick={() => router.delete('/settings/profile/avatar', { preserveScroll: true, onSuccess: () => setAvatarPreview(null) })}
                            className="flex w-full items-center gap-4 rounded-2xl bg-white px-4 py-3.5 shadow-sm transition-colors hover:bg-neutral-50 active:bg-neutral-100 dark:bg-neutral-900 dark:hover:bg-neutral-800/50">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-500 dark:bg-red-950/50 dark:text-red-400"><Trash2 size={18} strokeWidth={1.8} /></div>
                            <span className="flex-1 text-left text-sm font-medium text-red-600 dark:text-red-400">Remove Photo</span>
                        </button>
                    </div>
                )}

                {/* ===== Logout ===== */}
                <div className="mt-3 px-4 pb-28">
                    <button onClick={handleLogout} className="flex w-full items-center gap-4 rounded-2xl bg-white px-4 py-3.5 shadow-sm transition-colors hover:bg-red-50 active:bg-red-100 dark:bg-neutral-900 dark:hover:bg-red-950/30">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-500 dark:bg-red-950/50 dark:text-red-400"><LogOut size={18} strokeWidth={1.8} /></div>
                        <span className="flex-1 text-left text-sm font-medium text-red-600 dark:text-red-400">Logout</span>
                    </button>
                </div>

                {isMobile && <ResidentBottombar />}
            </div>
        </>
    );
}
