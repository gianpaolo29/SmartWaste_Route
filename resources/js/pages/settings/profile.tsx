import { Head, Link, router, usePage } from '@inertiajs/react';
import { Camera, Mail, Trash2, User as UserIcon } from 'lucide-react';
import { useRef, useState } from 'react';
import DeleteUser from '@/components/delete-user';
import InputError from '@/components/input-error';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/use-initials';
import SettingsLayout from '@/layouts/settings/layout';
import { send } from '@/routes/verification';
import { successAlert } from '@/lib/notify';

const inputClass = 'w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-sm text-neutral-900 outline-none transition-colors focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 dark:border-neutral-700 dark:bg-neutral-800/50 dark:text-white dark:focus:border-emerald-700 dark:focus:bg-neutral-900';

export default function Profile({ mustVerifyEmail, status }: { mustVerifyEmail: boolean; status?: string }) {
    const { auth } = usePage().props;
    const getInitials = useInitials();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
        reader.readAsDataURL(file);
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});
        const formData = new FormData(e.currentTarget);
        const avatarFile = fileInputRef.current?.files?.[0];
        if (avatarFile) formData.append('avatar', avatarFile);

        router.post('/settings/profile', formData, {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => {
                setAvatarPreview(null);
                successAlert('Profile updated');
            },
            onError: (errs) => setErrors(errs),
            onFinish: () => setProcessing(false),
        });
    };

    const displayAvatar = avatarPreview || auth.user.avatar;

    return (
        <SettingsLayout title="Edit Profile">
            <Head title="Edit Profile" />

            {/* Avatar */}
            <div className="flex items-center gap-4">
                <div className="group relative shrink-0">
                    <div className="rounded-full bg-gradient-to-br from-emerald-400 to-teal-400 p-[2.5px] shadow-md dark:from-emerald-500 dark:to-teal-500">
                        <Avatar className="h-16 w-16 border-[3px] border-white dark:border-neutral-900">
                            <AvatarImage src={displayAvatar ?? undefined} alt={auth.user.name} className="object-cover" />
                            <AvatarFallback className="bg-gradient-to-br from-emerald-100 to-teal-100 text-lg font-bold text-emerald-700 dark:from-emerald-900 dark:to-teal-900 dark:text-emerald-300">
                                {getInitials(auth.user.name)}
                            </AvatarFallback>
                        </Avatar>
                    </div>
                    <button type="button" onClick={() => fileInputRef.current?.click()}
                        className="absolute -bottom-0.5 -right-0.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-emerald-500 text-white shadow transition-transform hover:scale-110 dark:border-neutral-900">
                        <Camera size={11} />
                    </button>
                    <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarChange} />
                </div>
                <div className="flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <button type="button" onClick={() => fileInputRef.current?.click()}
                            className="rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950/50">
                            Change photo
                        </button>
                        {(auth.user.avatar || avatarPreview) && (
                            <button type="button" onClick={() => router.delete('/settings/profile/avatar', { preserveScroll: true, onSuccess: () => setAvatarPreview(null) })}
                                className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-500 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30">
                                <Trash2 size={12} className="mr-1 inline" /> Remove
                            </button>
                        )}
                    </div>
                    <p className="text-[11px] text-neutral-400">JPG, PNG or WebP. Max 2MB.</p>
                    <InputError message={errors.avatar} />
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-1">
                    <label className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-neutral-400">
                        <UserIcon size={11} /> Name
                    </label>
                    <input name="name" defaultValue={auth.user.name} required autoComplete="name" placeholder="Full name" className={inputClass} />
                    <InputError message={errors.name} />
                </div>
                <div className="grid gap-1">
                    <label className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-neutral-400">
                        <Mail size={11} /> Email
                    </label>
                    <input name="email" type="email" defaultValue={auth.user.email} required autoComplete="username" placeholder="Email address" className={inputClass} />
                    <InputError message={errors.email} />
                </div>

                {mustVerifyEmail && auth.user.email_verified_at === null && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3 dark:border-amber-800/50 dark:bg-amber-950/20">
                        <p className="text-sm text-amber-800 dark:text-amber-300">
                            Your email is unverified.{' '}
                            <Link href={send()} as="button" className="font-medium underline underline-offset-4">Resend verification.</Link>
                        </p>
                        {status === 'verification-link-sent' && (
                            <p className="mt-2 text-sm font-medium text-emerald-600 dark:text-emerald-400">Verification link sent.</p>
                        )}
                    </div>
                )}

                <button type="submit" disabled={processing}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:opacity-50">
                    {processing ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : null}
                    {processing ? 'Saving...' : 'Save changes'}
                </button>
            </form>

            {/* Danger zone */}
            <div className="border-t border-neutral-100 pt-6 dark:border-neutral-800">
                <DeleteUser />
            </div>
        </SettingsLayout>
    );
}
