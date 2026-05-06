import { Head, Link, router, usePage } from '@inertiajs/react';
import { Camera, Mail, Trash2, User as UserIcon } from 'lucide-react';
import { useRef, useState } from 'react';
import InputError from '@/components/input-error';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/use-initials';
import SettingsLayout from '@/layouts/settings/layout';
import { send } from '@/routes/verification';
import { toast } from '@/lib/notify';

const inputClass = 'w-full rounded-xl border border-neutral-200 bg-neutral-50/50 px-3.5 py-2.5 text-sm text-neutral-900 outline-none transition-all focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 dark:border-neutral-700 dark:bg-neutral-800/50 dark:text-white dark:focus:border-emerald-600';

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
                toast('success', 'Profile updated successfully');
            },
            onError: (errs) => setErrors(errs),
            onFinish: () => setProcessing(false),
        });
    };

    const displayAvatar = avatarPreview || auth.user.avatar;

    return (
        <SettingsLayout title="Profile">
            <Head title="Edit Profile" />

            <div className="flex items-start gap-3 mb-6">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                    <UserIcon size={20} strokeWidth={1.8} />
                </div>
                <div>
                    <h3 className="text-base font-bold text-neutral-900 dark:text-white">Profile Information</h3>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">Update your account details and photo</p>
                </div>
            </div>

            {/* Avatar */}
            <div className="flex items-center gap-4 rounded-xl border border-neutral-100 bg-neutral-50/30 p-4 dark:border-neutral-800 dark:bg-neutral-800/20">
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
                <div className="flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                        <button type="button" onClick={() => fileInputRef.current?.click()}
                            className="rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950/50">
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
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div>
                    <label className="mb-1.5 block text-xs font-semibold text-neutral-600 dark:text-neutral-400">Name</label>
                    <input name="name" defaultValue={auth.user.name} required autoComplete="name" placeholder="Full name" className={inputClass} />
                    <InputError message={errors.name} />
                </div>
                <div>
                    <label className="mb-1.5 block text-xs font-semibold text-neutral-600 dark:text-neutral-400">Email</label>
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
                    className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-emerald-600/20 transition-all hover:shadow-md hover:shadow-emerald-600/25 disabled:opacity-50">
                    {processing ? <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : null}
                    {processing ? 'Saving...' : 'Save changes'}
                </button>
            </form>
        </SettingsLayout>
    );
}
