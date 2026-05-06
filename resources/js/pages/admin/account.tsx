import { Form, Head, router, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import InputError from '@/components/input-error';
import AppearanceTabs from '@/components/appearance-tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/use-initials';
import { successAlert, errorAlert } from '@/lib/notify';
import AdminLayout from '@/layouts/admin-layout';
import {
    Camera, Check, KeyRound, Mail, Palette,
    Pencil, ShieldCheck, Lock, Trash2, User as UserIcon,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { User } from '@/types';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/admin/dashboard' },
    { title: 'My Account', href: '/admin/account' },
];

const inputCls = 'w-full rounded-xl border border-neutral-200 bg-neutral-50/50 px-3.5 py-2.5 text-sm text-neutral-900 outline-none transition-all focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 dark:border-neutral-700 dark:bg-neutral-800/50 dark:text-white dark:focus:border-emerald-700';

export default function AdminAccount() {
    const { auth } = usePage().props as { auth: { user: User } };
    const getInitials = useInitials();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const avatarFileRef = useRef<File | null>(null);

    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [profileProcessing, setProfileProcessing] = useState(false);
    const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});
    const [name, setName] = useState(auth.user.name);
    const [email, setEmail] = useState(auth.user.email);

    useEffect(() => {
        setName(auth.user.name);
        setEmail(auth.user.email);
    }, [auth.user.name, auth.user.email]);

    const displayAvatar = avatarPreview || auth.user.avatar;

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        avatarFileRef.current = file;
        const reader = new FileReader();
        reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
        reader.readAsDataURL(file);

        // Auto-upload avatar
        const formData = new FormData();
        formData.append('avatar', file);
        formData.append('name', auth.user.name);
        formData.append('email', auth.user.email);
        router.post('/admin/profile', formData, {
            forceFormData: true,
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                setAvatarPreview(null);
                avatarFileRef.current = null;
                successAlert('Photo updated', 'Your profile photo has been changed successfully.');
            },
            onError: () => {
                setAvatarPreview(null);
                avatarFileRef.current = null;
                errorAlert('Upload failed', 'Please try again with a valid image (JPG, PNG, WebP, max 2MB).');
            },
        });
        if (e.target) e.target.value = '';
    };

    const handleSaveProfile = () => {
        setProfileProcessing(true);
        setProfileErrors({});
        router.post('/admin/profile', { name, email }, {
            preserveScroll: true,
            onSuccess: () => {
                successAlert('Profile updated', 'Your profile has been saved successfully.');
            },
            onError: (errs) => {
                setProfileErrors(errs);
                const msg = Object.values(errs).join('\n');
                errorAlert('Update failed', msg || 'Please check the form for errors.');
            },
            onFinish: () => setProfileProcessing(false),
        });
    };

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="My Account" />

            <div className="space-y-5 p-4 sm:p-5">
                {/* Page header */}
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">My Account</h1>
                    <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">Manage your profile, password, and preferences</p>
                </div>

                <div className="grid gap-5 lg:grid-cols-3">
                    {/* Left: Profile card */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-4"
                    >
                        <div className="overflow-hidden rounded-2xl border border-neutral-200/60 bg-white shadow-sm dark:border-neutral-700/60 dark:bg-neutral-900">
                            <div className="relative h-24 bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-500">
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent_60%)]" />
                            </div>
                            <div className="relative -mt-10 px-5 pb-5">
                                <div className="group relative inline-block">
                                    <div className="rounded-full bg-gradient-to-br from-emerald-400 to-teal-400 p-[3px] shadow-xl shadow-emerald-600/20">
                                        <Avatar className="h-20 w-20 border-[3px] border-white dark:border-neutral-900">
                                            <AvatarImage src={displayAvatar ?? undefined} alt={auth.user.name} className="object-cover" />
                                            <AvatarFallback className="bg-gradient-to-br from-emerald-100 to-teal-100 text-xl font-bold text-emerald-700 dark:from-emerald-900 dark:to-teal-900 dark:text-emerald-300">
                                                {getInitials(auth.user.name)}
                                            </AvatarFallback>
                                        </Avatar>
                                    </div>
                                    <button type="button" onClick={() => fileInputRef.current?.click()} className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-emerald-500 text-white shadow-md transition-transform hover:scale-110 dark:border-neutral-900">
                                        <Camera size={13} />
                                    </button>
                                    <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarChange} />
                                </div>
                                <div className="mt-3">
                                    <h2 className="text-lg font-bold text-neutral-900 dark:text-white">{auth.user.name}</h2>
                                    <p className="text-sm text-neutral-500 dark:text-neutral-400">{auth.user.email}</p>
                                    <span className="mt-2 inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
                                        Administrator
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Avatar actions */}
                        <div className="space-y-2">
                            <button onClick={() => fileInputRef.current?.click()}
                                className="flex w-full items-center gap-3 rounded-xl border border-neutral-200/60 bg-white px-4 py-3 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-700/60 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800/50">
                                <Camera size={16} className="text-emerald-600 dark:text-emerald-400" /> Change Photo
                            </button>
                            {auth.user.avatar && (
                                <button onClick={() => router.delete('/admin/profile/avatar', { preserveScroll: true, onSuccess: () => { setAvatarPreview(null); successAlert('Photo removed', 'Your profile photo has been removed.'); } })}
                                    className="flex w-full items-center gap-3 rounded-xl border border-red-200/60 bg-white px-4 py-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-900/30 dark:bg-neutral-900 dark:text-red-400 dark:hover:bg-red-950/20">
                                    <Trash2 size={16} /> Remove Photo
                                </button>
                            )}
                        </div>
                    </motion.div>

                    {/* Right: Settings */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                        className="space-y-5 lg:col-span-2"
                    >
                        {/* Edit Profile */}
                        <div className="overflow-hidden rounded-2xl border border-neutral-200/60 bg-white shadow-sm dark:border-neutral-700/60 dark:bg-neutral-900">
                            <div className="flex items-center gap-3 border-b border-neutral-100 px-5 py-4 dark:border-neutral-800">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/50">
                                    <Pencil size={16} className="text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-neutral-900 dark:text-white">Edit Profile</h3>
                                    <p className="text-[11px] text-neutral-400">Update your name and email address</p>
                                </div>
                            </div>
                            <div className="space-y-4 p-5">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                                            <UserIcon size={12} /> Name
                                        </label>
                                        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className={inputCls} />
                                        <InputError message={profileErrors.name} />
                                    </div>
                                    <div>
                                        <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                                            <Mail size={12} /> Email
                                        </label>
                                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" className={inputCls} />
                                        <InputError message={profileErrors.email} />
                                    </div>
                                </div>
                                <button onClick={handleSaveProfile} disabled={profileProcessing}
                                    className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-emerald-600/20 transition-all hover:shadow-md disabled:opacity-50">
                                    {profileProcessing ? 'Saving...' : 'Save changes'}
                                </button>
                            </div>
                        </div>

                        {/* Password */}
                        <div className="overflow-hidden rounded-2xl border border-neutral-200/60 bg-white shadow-sm dark:border-neutral-700/60 dark:bg-neutral-900">
                            <div className="flex items-center gap-3 border-b border-neutral-100 px-5 py-4 dark:border-neutral-800">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/50">
                                    <KeyRound size={16} className="text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-neutral-900 dark:text-white">Password</h3>
                                    <p className="text-[11px] text-neutral-400">Update your password</p>
                                </div>
                            </div>
                            <Form
                                method="put"
                                action="/admin/password"
                                options={{ preserveScroll: true }}
                                resetOnError={['password', 'password_confirmation', 'current_password']}
                                resetOnSuccess
                                onSuccess={() => successAlert('Password updated', 'Your password has been changed successfully.')}
                                className="space-y-4 p-5"
                            >
                                {({ errors, processing }) => (
                                    <>
                                        <div>
                                            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                                                <Lock size={12} /> Current password
                                            </label>
                                            <input name="current_password" type="password" autoComplete="current-password" placeholder="Enter current password" className={inputCls} />
                                            <InputError message={errors.current_password} />
                                        </div>
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <div>
                                                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                                                    <ShieldCheck size={12} /> New password
                                                </label>
                                                <input name="password" type="password" autoComplete="new-password" placeholder="New password" className={inputCls} />
                                                <InputError message={errors.password} />
                                            </div>
                                            <div>
                                                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                                                    <ShieldCheck size={12} /> Confirm password
                                                </label>
                                                <input name="password_confirmation" type="password" autoComplete="new-password" placeholder="Confirm password" className={inputCls} />
                                                <InputError message={errors.password_confirmation} />
                                            </div>
                                        </div>
                                        <button type="submit" disabled={processing}
                                            className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-emerald-600/20 transition-all hover:shadow-md disabled:opacity-50">
                                            {processing ? 'Saving...' : 'Save password'}
                                        </button>
                                    </>
                                )}
                            </Form>
                        </div>

                        {/* Appearance */}
                        <div className="overflow-hidden rounded-2xl border border-neutral-200/60 bg-white shadow-sm dark:border-neutral-700/60 dark:bg-neutral-900">
                            <div className="flex items-center gap-3 border-b border-neutral-100 px-5 py-4 dark:border-neutral-800">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/50">
                                    <Palette size={16} className="text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-neutral-900 dark:text-white">Appearance</h3>
                                    <p className="text-[11px] text-neutral-400">Choose your preferred theme</p>
                                </div>
                            </div>
                            <div className="p-5">
                                <AppearanceTabs />
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </AdminLayout>
    );
}
