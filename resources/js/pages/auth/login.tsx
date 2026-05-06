import { Form, Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, User, ArrowRight, Sparkles, Leaf, Recycle, CheckCircle2 } from 'lucide-react';
import Swal from 'sweetalert2';
import { motion, AnimatePresence } from 'framer-motion';
import InputError from '@/components/input-error';
// Google OAuth + Fortify routes
import { store as loginStore } from '@/routes/login';
import { store as registerStore } from '@/routes/register';
import { request } from '@/routes/password';

type Props = {
    status?: string;
    canResetPassword: boolean;
    canRegister: boolean;
};

type LoginErrors = { email?: string; password?: string };
type RegisterErrors = { name?: string; email?: string; password?: string; password_confirmation?: string };

const FEATURES = [
    { icon: Recycle, text: 'Smart route optimization' },
    { icon: Leaf, text: 'Real-time GPS tracking' },
    { icon: CheckCircle2, text: 'Waste collection reports' },
];

const GoogleIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
    </svg>
);

export default function Login({ status, canResetPassword, canRegister }: Props) {
    const [isSignUp, setIsSignUp] = useState(false);

    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [showLoginPw, setShowLoginPw] = useState(false);
    const [loginErrors, setLoginErrors] = useState<LoginErrors>({});

    const [regName, setRegName] = useState('');
    const [regEmail, setRegEmail] = useState('');
    const [regPassword, setRegPassword] = useState('');
    const [regConfirm, setRegConfirm] = useState('');
    const [showRegPw, setShowRegPw] = useState(false);
    const [regErrors, setRegErrors] = useState<RegisterErrors>({});
    const [regSubmitting, setRegSubmitting] = useState(false);

    const validateLogin = () => {
        const e: LoginErrors = {};
        if (!loginEmail) e.email = 'Email is required.';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginEmail)) e.email = 'Please enter a valid email.';
        if (!loginPassword) e.password = 'Password is required.';
        else if (loginPassword.length < 6) e.password = 'Password must be at least 6 characters.';
        setLoginErrors(e);
        return Object.keys(e).length === 0;
    };

    const validateRegister = () => {
        const e: RegisterErrors = {};
        if (!regName.trim()) e.name = 'Full name is required.';
        if (!regEmail) e.email = 'Email is required.';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail)) e.email = 'Please enter a valid email.';
        if (!regPassword) e.password = 'Password is required.';
        else if (regPassword.length < 8) e.password = 'Password must be at least 8 characters.';
        if (!regConfirm) e.password_confirmation = 'Please confirm your password.';
        else if (regConfirm !== regPassword) e.password_confirmation = 'Passwords do not match.';
        setRegErrors(e);
        return Object.keys(e).length === 0;
    };

    const pwStrength = (pw: string) => {
        let s = 0;
        if (pw.length >= 8) s++;
        if (/[A-Z]/.test(pw)) s++;
        if (/[0-9]/.test(pw)) s++;
        if (/[^A-Za-z0-9]/.test(pw)) s++;
        return s;
    };
    const strength = pwStrength(regPassword);
    const strengthLabel = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong'][strength];
    const strengthColor = ['bg-gray-200', 'bg-red-400', 'bg-orange-400', 'bg-amber-400', 'bg-emerald-500'][strength];

    // Tuy bounds check
    const TUY_BOUNDS = { minLat: 13.80, maxLat: 14.05, minLng: 120.55, maxLng: 120.85 };
    const isInsideTuy = (lat: number, lng: number) =>
        lat >= TUY_BOUNDS.minLat && lat <= TUY_BOUNDS.maxLat && lng >= TUY_BOUNDS.minLng && lng <= TUY_BOUNDS.maxLng;

    const [locationVerified, setLocationVerified] = useState(false);

    const checkLocationBeforeRegister = (e: React.FormEvent) => {
        if (locationVerified) {
            // Already verified, let form submit normally
            setRegSubmitting(true);
            return;
        }

        e.preventDefault();
        if (!validateRegister()) return;

        setRegSubmitting(true);

        if (!navigator.geolocation) {
            setRegSubmitting(false);
            Swal.fire({
                icon: 'error',
                title: 'Location Not Supported',
                text: 'Your browser does not support geolocation. This service is only available for residents of Tuy, Batangas.',
                confirmButtonColor: '#059669',
            }).then(() => { window.location.href = '/'; });
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                if (isInsideTuy(latitude, longitude)) {
                    // Inside Tuy — mark verified, then submit via Inertia router
                    setLocationVerified(true);
                    router.post('/register', {
                        name: regName,
                        email: regEmail,
                        password: regPassword,
                        password_confirmation: regConfirm,
                    }, {
                        onError: (errs) => { setRegSubmitting(false); setLocationVerified(false); setRegErrors(errs as RegisterErrors); },
                    });
                } else {
                    setRegSubmitting(false);
                    Swal.fire({
                        icon: 'warning',
                        title: 'Outside Service Area',
                        html: '<p>You appear to be <strong>outside Tuy, Batangas</strong>.</p><p class="mt-2 text-sm text-gray-500">This service is exclusively available for residents within the municipality of Tuy. You will be redirected to the homepage.</p>',
                        confirmButtonColor: '#059669',
                        confirmButtonText: 'OK',
                        allowOutsideClick: false,
                    }).then(() => { window.location.href = '/'; });
                }
            },
            () => {
                setRegSubmitting(false);
                Swal.fire({
                    icon: 'error',
                    title: 'Location Required',
                    html: '<p>We need your location to verify you are within <strong>Tuy, Batangas</strong>.</p><p class="mt-2 text-sm text-gray-500">Please allow location access and try again. This service is only available for Tuy residents.</p>',
                    confirmButtonColor: '#059669',
                    confirmButtonText: 'OK',
                    allowOutsideClick: false,
                }).then(() => { window.location.href = '/'; });
            },
            { enableHighAccuracy: true, timeout: 10000 },
        );
    };

    const inputCls =
        'w-full rounded-xl border border-gray-200 bg-gray-50/50 py-3 pl-11 pr-4 text-sm outline-none transition-all focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-emerald-600';
    const inputPwCls = inputCls.replace('pr-4', 'pr-11');

    return (
        <>
            <Head title={isSignUp ? 'Sign Up | SmartWaste Route' : 'Log In | SmartWaste Route'} />

            {/* Register loading overlay */}
            <AnimatePresence>
                {regSubmitting && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/90 backdrop-blur-md dark:bg-[#080c08]/90"
                    >
                        {/* Road scene */}
                        <div className="relative w-72 h-40 mb-6">
                            {/* Road */}
                            <div className="absolute bottom-6 left-0 right-0 h-10 rounded-full bg-gray-300 dark:bg-gray-700 overflow-hidden">
                                {/* Road dashes */}
                                <motion.div
                                    className="absolute top-1/2 -translate-y-1/2 flex gap-4"
                                    animate={{ x: [0, -48] }}
                                    transition={{ duration: 0.4, repeat: Infinity, ease: 'linear' }}
                                >
                                    {Array.from({ length: 16 }).map((_, i) => (
                                        <div key={i} className="w-6 h-1 rounded bg-white/60 dark:bg-white/20 shrink-0" />
                                    ))}
                                </motion.div>
                            </div>

                            {/* Truck */}
                            <motion.div
                                className="absolute bottom-10 left-1/2 -translate-x-1/2"
                                animate={{ y: [0, -3, 0, -2, 0] }}
                                transition={{ duration: 0.6, repeat: Infinity, ease: 'easeInOut' }}
                            >
                                {/* Exhaust puffs */}
                                <motion.div
                                    className="absolute -left-6 top-6 h-3 w-3 rounded-full bg-gray-300 dark:bg-gray-600"
                                    animate={{ opacity: [0, 0.7, 0], scale: [0.3, 1.2, 0.5], x: [-2, -14], y: [0, -8] }}
                                    transition={{ duration: 1.2, repeat: Infinity, ease: 'easeOut' }}
                                />
                                <motion.div
                                    className="absolute -left-4 top-8 h-2 w-2 rounded-full bg-gray-200 dark:bg-gray-600"
                                    animate={{ opacity: [0, 0.5, 0], scale: [0.3, 1, 0.4], x: [-2, -10], y: [0, -6] }}
                                    transition={{ duration: 1, repeat: Infinity, ease: 'easeOut', delay: 0.5 }}
                                />

                                {/* Truck body */}
                                <div className="relative">
                                    {/* Cargo area */}
                                    <div className="w-16 h-12 rounded-lg bg-gradient-to-b from-emerald-500 to-emerald-600 shadow-lg relative">
                                        <div className="absolute inset-1 rounded-md border border-emerald-400/30" />
                                        <Recycle size={14} className="absolute inset-0 m-auto text-white/80" />
                                    </div>
                                    {/* Cabin */}
                                    <div className="absolute -right-8 top-2 w-9 h-10 rounded-t-lg rounded-br-lg bg-gradient-to-b from-emerald-600 to-emerald-700 shadow-lg">
                                        {/* Windshield */}
                                        <div className="absolute top-1.5 right-1 w-5 h-4 rounded-t-md bg-sky-200/80 dark:bg-sky-300/60" />
                                    </div>
                                    {/* Wheels */}
                                    <motion.div
                                        className="absolute -bottom-3 left-1.5 h-5 w-5 rounded-full bg-gray-800 dark:bg-gray-200 border-2 border-gray-600 dark:border-gray-400 shadow-md"
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 0.4, repeat: Infinity, ease: 'linear' }}
                                    >
                                        <div className="absolute inset-1 rounded-full border border-dashed border-gray-400 dark:border-gray-500" />
                                    </motion.div>
                                    <motion.div
                                        className="absolute -bottom-3 right-[-22px] h-5 w-5 rounded-full bg-gray-800 dark:bg-gray-200 border-2 border-gray-600 dark:border-gray-400 shadow-md"
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 0.4, repeat: Infinity, ease: 'linear' }}
                                    >
                                        <div className="absolute inset-1 rounded-full border border-dashed border-gray-400 dark:border-gray-500" />
                                    </motion.div>
                                </div>
                            </motion.div>

                            {/* Floating leaves */}
                            {[0, 1, 2].map((i) => (
                                <motion.div
                                    key={i}
                                    className="absolute top-2"
                                    style={{ left: `${20 + i * 30}%` }}
                                    animate={{ y: [0, 40, 80], x: [0, -15, -30], rotate: [0, 180, 360], opacity: [0, 1, 0] }}
                                    transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: i * 0.8 }}
                                >
                                    <Leaf size={12} className="text-emerald-400" />
                                </motion.div>
                            ))}
                        </div>

                        <motion.p
                            className="text-xl font-semibold text-[#1b4332] dark:text-white"
                            animate={{ opacity: [1, 0.5, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                        >
                            Creating your account...
                        </motion.p>
                        <p className="mt-2 text-sm text-gray-400">Getting your route ready</p>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="relative flex min-h-svh w-full overflow-hidden bg-[#FAFBF9] dark:bg-[#080c08]">
                {/* ─── Left half: Register form area (desktop) ─── */}
                <div className="hidden w-1/2 items-center justify-center lg:flex">
                    <AnimatePresence mode="wait">
                        {isSignUp && (
                            <motion.div key="register-form" initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.35, delay: 0.15 }} className="w-full max-w-md px-6">
                                <div className="mb-8">
                                    <h1 className="text-3xl font-bold tracking-tight text-[#1b1b18] dark:text-white">Create your account</h1>
                                    <p className="mt-2 text-sm text-gray-400">Sign up to get started in seconds</p>
                                </div>
                                <Form {...registerStore.form()} resetOnSuccess={['password', 'password_confirmation']} onSubmit={checkLocationBeforeRegister} onError={() => { setRegSubmitting(false); setLocationVerified(false); }} className="space-y-4">
                                    {({ processing, errors }) => (
                                        <>
                                            <div>
                                                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Full name</label>
                                                <div className="relative"><User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" /><input name="name" type="text" autoComplete="name" value={regName} onChange={(e) => setRegName(e.target.value)} placeholder="John Doe" className={inputCls} /></div>
                                                <InputError message={regErrors.name || errors.name} />
                                            </div>
                                            <div>
                                                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Email address</label>
                                                <div className="relative"><Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" /><input name="email" type="email" autoComplete="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} placeholder="you@example.com" className={inputCls} /></div>
                                                <InputError message={regErrors.email || errors.email} />
                                            </div>
                                            <div>
                                                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                                                <div className="relative">
                                                    <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                                    <input name="password" type={showRegPw ? 'text' : 'password'} autoComplete="new-password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} placeholder="At least 8 characters" className={inputPwCls} />
                                                    <button type="button" onClick={() => setShowRegPw((s) => !s)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-600" tabIndex={-1}>{showRegPw ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                                                </div>
                                                {regPassword && (
                                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-2">
                                                        <div className="flex gap-1">{[1, 2, 3, 4].map((i) => (<div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${i <= strength ? strengthColor : 'bg-gray-100 dark:bg-white/5'}`} />))}</div>
                                                        <p className="mt-1 text-xs text-gray-400">Strength: <span className="font-medium">{strengthLabel}</span></p>
                                                    </motion.div>
                                                )}
                                                <InputError message={regErrors.password || errors.password} />
                                            </div>
                                            <div>
                                                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Confirm password</label>
                                                <div className="relative"><Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" /><input name="password_confirmation" type={showRegPw ? 'text' : 'password'} autoComplete="new-password" value={regConfirm} onChange={(e) => setRegConfirm(e.target.value)} placeholder="Re-enter password" className={inputCls} /></div>
                                                <InputError message={regErrors.password_confirmation || errors.password_confirmation} />
                                            </div>
                                            <button type="submit" disabled={processing || regSubmitting} className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#1b4332] to-[#2d6a4f] px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-emerald-600/30 disabled:opacity-70">
                                                {processing || regSubmitting ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />}
                                                {processing || regSubmitting ? 'Creating account...' : 'Create account'}
                                            </button>
                                            {/* Google Sign-up */}
                                            <div className="relative my-1"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100 dark:border-white/5" /></div><div className="relative flex justify-center text-xs"><span className="bg-[#FAFBF9] px-4 text-gray-400 dark:bg-[#080c08]">or</span></div></div>
                                            <a href="/auth/google/redirect" className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-white/5 dark:text-white"><GoogleIcon /> Sign up with Google</a>
                                        </>
                                    )}
                                </Form>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* ─── Right half: Login form area (desktop) ─── */}
                <div className="hidden w-1/2 items-center justify-center lg:flex">
                    <AnimatePresence mode="wait">
                        {!isSignUp && (
                            <motion.div key="login-form" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 40 }} transition={{ duration: 0.35, delay: 0.15 }} className="w-full max-w-md px-6">
                                <div className="mb-10">
                                    <h1 className="text-3xl font-bold tracking-tight text-[#1b1b18] dark:text-white">Log in to your account</h1>
                                    <p className="mt-2 text-sm text-gray-400">Enter your credentials to continue</p>
                                </div>
                                {status && (<motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-5 rounded-xl bg-emerald-50 px-4 py-3 text-center text-sm font-medium text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">{status}</motion.div>)}
                                <Form {...loginStore.form()} resetOnSuccess={['password']} onSubmit={(e) => { if (!validateLogin()) e.preventDefault(); }} className="space-y-5">
                                    {({ processing, errors }) => (
                                        <>
                                            <div>
                                                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Email address</label>
                                                <div className="relative"><Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" /><input name="email" type="email" autoComplete="email" autoFocus value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} placeholder="you@example.com" className={inputCls} /></div>
                                                <InputError message={loginErrors.email || errors.email} />
                                            </div>
                                            <div>
                                                <div className="mb-1.5 flex items-center justify-between"><label className="text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>{canResetPassword && <Link href={request()} className="text-xs font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400">Forgot password?</Link>}</div>
                                                <div className="relative"><Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" /><input name="password" type={showLoginPw ? 'text' : 'password'} autoComplete="current-password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} placeholder="Enter your password" className={inputPwCls} /><button type="button" onClick={() => setShowLoginPw((s) => !s)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-600" tabIndex={-1}>{showLoginPw ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>
                                                <InputError message={loginErrors.password || errors.password} />
                                            </div>
                                            <label className="flex items-center gap-2.5 text-sm text-gray-500 dark:text-gray-400"><input type="checkbox" name="remember" className="h-4 w-4 rounded-md border-gray-300 text-emerald-600 focus:ring-emerald-500 dark:border-white/20" /> Remember me</label>
                                            <button type="submit" disabled={processing} className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#1b4332] to-[#2d6a4f] px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-emerald-600/30 disabled:opacity-70">
                                                {processing ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />}
                                                {processing ? 'Logging in...' : 'Log in'}
                                            </button>
                                            <div className="relative my-1"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100 dark:border-white/5" /></div><div className="relative flex justify-center text-xs"><span className="bg-[#FAFBF9] px-4 text-gray-400 dark:bg-[#080c08]">or continue with</span></div></div>
                                            <a href="/auth/google/redirect" className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-white/5 dark:text-white"><GoogleIcon /> Sign in with Google</a>
                                        </>
                                    )}
                                </Form>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* ─── Sliding overlay panel (desktop only) ─── */}
                <motion.div className="pointer-events-none absolute inset-y-0 z-30 hidden w-1/2 lg:block" animate={{ x: isSignUp ? '100%' : '0%' }} transition={{ type: 'spring', stiffness: 80, damping: 20 }}>
                    <div className="pointer-events-auto relative flex h-full flex-col overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-[#0d2818] via-[#1b4332] to-[#2d6a4f]" />
                        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.03) 1px, transparent 0)', backgroundSize: '32px 32px' }} />
                        <motion.div className="absolute -left-20 -top-20 h-80 w-80 rounded-full bg-emerald-400/10 blur-3xl" animate={{ y: [0, -20, 0], x: [0, 10, 0] }} transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }} />
                        <motion.div className="absolute bottom-10 right-10 h-60 w-60 rounded-full bg-teal-300/10 blur-3xl" animate={{ y: [0, 20, 0], x: [0, -10, 0] }} transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }} />
                        <div className="relative z-10 flex flex-1 flex-col justify-between p-12 text-white">
                            <Link href="/" className="flex items-center gap-2.5 text-xl font-bold">
                                <img src="/logo.png" alt="SmartWaste" className="h-10 w-10 object-contain" />
                                SmartWaste Route
                            </Link>
                            <AnimatePresence mode="wait">
                                <motion.div key={isSignUp ? 'su' : 'li'} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>
                                    <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-emerald-200 backdrop-blur-sm"><Sparkles size={12} />{isSignUp ? 'Start your journey today' : 'Trusted by communities'}</div>
                                    <h2 className="text-4xl font-bold leading-tight tracking-tight xl:text-5xl">
                                        {isSignUp ? (<>Join the movement for{' '}<span className="bg-gradient-to-r from-emerald-200 to-teal-200 bg-clip-text text-transparent">cleaner cities.</span></>) : (<>Welcome back to a{' '}<span className="bg-gradient-to-r from-emerald-200 to-teal-200 bg-clip-text text-transparent">cleaner tomorrow.</span></>)}
                                    </h2>
                                    <p className="mt-5 max-w-sm text-base leading-relaxed text-white/60">{isSignUp ? 'Create your account to start optimizing waste collection.' : 'Log in to manage routes, track collections, and build a sustainable community.'}</p>
                                    <div className="mt-8 space-y-3">{FEATURES.map(({ icon: Icon, text }) => (<div key={text} className="flex items-center gap-3 text-sm text-white/50"><div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5"><Icon size={14} className="text-emerald-300" /></div>{text}</div>))}</div>
                                </motion.div>
                            </AnimatePresence>
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-white/30">&copy; {new Date().getFullYear()} SmartWaste Route</p>
                                <button onClick={() => setIsSignUp(!isSignUp)} className="rounded-full border border-white/20 px-5 py-2 text-sm font-medium text-white/80 backdrop-blur-sm transition hover:bg-white/10">{isSignUp ? 'Log In Instead' : 'Create Account'}</button>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* ─── Mobile: gradient header + form ─── */}
                <div className="flex w-full flex-col lg:hidden">
                    {/* Gradient header with animated blobs */}
                    <div className="relative overflow-hidden">
                        <div className="h-56 bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600">
                            {/* Animated floating circles */}
                            <motion.div className="absolute right-[-30px] top-[-20px] h-44 w-44 rounded-full bg-white/[0.08]" animate={{ y: [0, -12, 0], x: [0, 8, 0] }} transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }} />
                            <motion.div className="absolute right-[40px] top-[40px] h-24 w-24 rounded-full bg-white/[0.06]" animate={{ y: [0, 10, 0], x: [0, -6, 0] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }} />
                            <motion.div className="absolute left-[-20px] top-[20px] h-28 w-28 rounded-full bg-white/[0.05]" animate={{ y: [0, 14, 0] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 2 }} />
                            {/* Subtle glow behind logo */}
                            <div className="absolute left-1/2 top-[40%] h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/10 blur-2xl" />
                        </div>
                        <svg viewBox="0 0 400 40" className="absolute -bottom-[1px] left-0 w-full" preserveAspectRatio="none">
                            <path d="M 0 40 Q 80 5 200 20 Q 320 38 400 12 L 400 40 Z" className="fill-[#FAFBF9] dark:fill-[#080c08]" />
                        </svg>

                        {/* Logo + brand */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="absolute inset-0 flex flex-col items-center justify-center text-white"
                        >
                            <motion.div
                                className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 shadow-xl shadow-black/10 backdrop-blur-md ring-1 ring-white/20"
                                animate={{ y: [0, -5, 0] }}
                                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                            >
                                <img src="/logo.png" alt="SmartWaste" className="h-10 w-10 object-contain" />
                            </motion.div>
                            <p className="mt-3 text-lg font-bold tracking-wider">SmartWaste Route</p>
                            <p className="mt-0.5 text-[11px] font-medium tracking-widest uppercase text-white/50">Cleaner Communities</p>
                        </motion.div>
                    </div>

                    {/* Form area */}
                    <div className="flex flex-1 flex-col px-6 pb-10 pt-3">
                        <AnimatePresence mode="wait">
                            {!isSignUp ? (
                                <motion.div key="m-login" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -24 }} transition={{ duration: 0.35 }} className="w-full">
                                    <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="text-center text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">Welcome back!</motion.h1>
                                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="mt-1 text-center text-sm text-neutral-400">Log in to continue</motion.p>

                                    {status && <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-center text-sm font-medium text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">{status}</motion.div>}

                                    <Form {...loginStore.form()} resetOnSuccess={['password']} onSubmit={(e) => { if (!validateLogin()) e.preventDefault(); }} className="mt-6 space-y-3.5">
                                        {({ processing, errors }) => (
                                            <>
                                                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
                                                    <div className="relative">
                                                        <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                                                        <input name="email" type="email" autoComplete="email" autoFocus value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} placeholder="Email address" className={inputCls} />
                                                    </div>
                                                    <InputError message={loginErrors.email || errors.email} />
                                                </motion.div>
                                                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}>
                                                    <div className="relative">
                                                        <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                                                        <input name="password" type={showLoginPw ? 'text' : 'password'} autoComplete="current-password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} placeholder="Password" className={inputPwCls} />
                                                        <button type="button" onClick={() => setShowLoginPw((s) => !s)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 transition-colors hover:text-emerald-500" tabIndex={-1}>{showLoginPw ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                                                    </div>
                                                    <InputError message={loginErrors.password || errors.password} />
                                                </motion.div>
                                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="flex items-center justify-between">
                                                    <label className="flex items-center gap-2 text-sm text-neutral-500"><input type="checkbox" name="remember" className="h-4 w-4 rounded-md border-gray-300 text-emerald-600 focus:ring-emerald-500" /> Remember me</label>
                                                    {canResetPassword && <Link href={request()} className="text-xs font-semibold text-emerald-600">Forgot password?</Link>}
                                                </motion.div>
                                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
                                                    <button type="submit" disabled={processing} className="relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/25 transition-all active:scale-[0.97] disabled:opacity-70">
                                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] animate-shimmer" />
                                                        {processing ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : null}
                                                        {processing ? 'Logging in...' : 'Login'}
                                                    </button>
                                                </motion.div>
                                                {canRegister && (
                                                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="text-center text-sm text-neutral-500">
                                                        New user?{' '}
                                                        <button type="button" onClick={() => setIsSignUp(true)} className="font-bold text-emerald-600 underline underline-offset-2 decoration-emerald-600/30">Sign Up</button>
                                                    </motion.p>
                                                )}
                                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}>
                                                    <div className="relative my-2"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-neutral-200 dark:border-white/10" /></div><div className="relative flex justify-center text-[11px]"><span className="bg-[#FAFBF9] px-4 font-medium tracking-wider text-neutral-400 uppercase dark:bg-[#080c08]">or</span></div></div>
                                                    <a href="/auth/google/redirect" className="flex w-full items-center justify-center gap-3 rounded-2xl border border-neutral-200 bg-white px-4 py-3.5 text-sm font-semibold text-neutral-700 shadow-sm transition-all active:scale-[0.97] dark:border-white/10 dark:bg-white/5 dark:text-white">
                                                        <GoogleIcon />
                                                        Sign in with Google
                                                    </a>
                                                </motion.div>
                                            </>
                                        )}
                                    </Form>
                                </motion.div>
                            ) : (
                                <motion.div key="m-register" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -24 }} transition={{ duration: 0.35 }} className="w-full">
                                    <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="text-center text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">Create account</motion.h1>
                                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="mt-1 text-center text-sm text-neutral-400">Join SmartWaste Route today</motion.p>

                                    <Form {...registerStore.form()} resetOnSuccess={['password', 'password_confirmation']} onSubmit={checkLocationBeforeRegister} onError={() => { setRegSubmitting(false); setLocationVerified(false); }} className="mt-6 space-y-3.5">
                                        {({ processing, errors }) => (
                                            <>
                                                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
                                                    <div className="relative"><User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" /><input name="name" type="text" autoComplete="name" value={regName} onChange={(e) => setRegName(e.target.value)} placeholder="Full name" className={inputCls} /></div>
                                                    <InputError message={regErrors.name || errors.name} />
                                                </motion.div>
                                                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}>
                                                    <div className="relative"><Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" /><input name="email" type="email" autoComplete="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} placeholder="Email address" className={inputCls} /></div>
                                                    <InputError message={regErrors.email || errors.email} />
                                                </motion.div>
                                                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
                                                    <div className="relative">
                                                        <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                                                        <input name="password" type={showRegPw ? 'text' : 'password'} autoComplete="new-password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} placeholder="Password (8+ characters)" className={inputPwCls} />
                                                        <button type="button" onClick={() => setShowRegPw((s) => !s)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 transition-colors hover:text-emerald-500" tabIndex={-1}>{showRegPw ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                                                    </div>
                                                    {regPassword && (
                                                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-2 space-y-1">
                                                            <div className="flex gap-1">{[1, 2, 3, 4].map((i) => (<div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${i <= strength ? strengthColor : 'bg-neutral-100 dark:bg-white/5'}`} />))}</div>
                                                            <p className="text-[11px] text-neutral-400">{strengthLabel}</p>
                                                        </motion.div>
                                                    )}
                                                    <InputError message={regErrors.password || errors.password} />
                                                </motion.div>
                                                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }}>
                                                    <div className="relative"><Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" /><input name="password_confirmation" type={showRegPw ? 'text' : 'password'} autoComplete="new-password" value={regConfirm} onChange={(e) => setRegConfirm(e.target.value)} placeholder="Confirm password" className={inputCls} /></div>
                                                    <InputError message={regErrors.password_confirmation || errors.password_confirmation} />
                                                </motion.div>
                                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                                                    <button type="submit" disabled={processing || regSubmitting} className="relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/25 transition-all active:scale-[0.97] disabled:opacity-70">
                                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] animate-shimmer" />
                                                        {processing || regSubmitting ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : null}
                                                        {processing || regSubmitting ? 'Creating...' : 'Sign Up'}
                                                    </button>
                                                </motion.div>
                                                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }} className="text-center text-sm text-neutral-500">
                                                    Already have an account?{' '}
                                                    <button type="button" onClick={() => setIsSignUp(false)} className="font-bold text-emerald-600 underline underline-offset-2 decoration-emerald-600/30">Log in</button>
                                                </motion.p>
                                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                                                    <div className="relative my-2"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-neutral-200 dark:border-white/10" /></div><div className="relative flex justify-center text-[11px]"><span className="bg-[#FAFBF9] px-4 font-medium tracking-wider text-neutral-400 uppercase dark:bg-[#080c08]">or</span></div></div>
                                                    <a href="/auth/google/redirect" className="flex w-full items-center justify-center gap-3 rounded-2xl border border-neutral-200 bg-white px-4 py-3.5 text-sm font-semibold text-neutral-700 shadow-sm transition-all active:scale-[0.97] dark:border-white/10 dark:bg-white/5 dark:text-white">
                                                        <GoogleIcon />
                                                        Sign up with Google
                                                    </a>
                                                </motion.div>
                                            </>
                                        )}
                                    </Form>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </>
    );
}
