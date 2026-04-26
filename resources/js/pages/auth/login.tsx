import { Form, Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, Truck, User, ArrowRight, Sparkles, Leaf, Recycle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import InputError from '@/components/input-error';
import { register as registerRoute } from '@/routes';
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

export default function Login({ status, canResetPassword, canRegister }: Props) {
    const [isSignUp, setIsSignUp] = useState(false);

    // Login state
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [showLoginPw, setShowLoginPw] = useState(false);
    const [loginErrors, setLoginErrors] = useState<LoginErrors>({});

    // Register state
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

    // Input class
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
                        <div className="relative">
                            <div className="h-20 w-20 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-500" />
                            <CheckCircle2 className="absolute inset-0 m-auto text-emerald-600" size={30} />
                        </div>
                        <p className="mt-6 text-xl font-semibold text-[#1b4332] dark:text-white">Creating your account...</p>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="relative flex min-h-svh w-full overflow-hidden bg-[#FAFBF9] dark:bg-[#080c08]">
                {/* ─── Left half: Register form area ─── */}
                <div className="hidden w-1/2 items-center justify-center lg:flex">
                    <AnimatePresence mode="wait">
                        {isSignUp && (
                            <motion.div
                                key="register-form"
                                initial={{ opacity: 0, x: -40 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -40 }}
                                transition={{ duration: 0.35, delay: 0.15 }}
                                className="w-full max-w-md px-6"
                            >
                                <div className="mb-8">
                                    <h1 className="text-3xl font-bold tracking-tight text-[#1b1b18] dark:text-white">
                                        Create your account
                                    </h1>
                                    <p className="mt-2 text-sm text-gray-400">Sign up to get started in seconds</p>
                                </div>

                                <Form
                                    {...registerStore.form()}
                                    resetOnSuccess={['password', 'password_confirmation']}
                                    onSubmit={(e) => {
                                        if (!validateRegister()) { e.preventDefault(); return; }
                                        setRegSubmitting(true);
                                    }}
                                    onError={() => setRegSubmitting(false)}
                                    className="space-y-4"
                                >
                                    {({ processing, errors }) => (
                                        <>
                                            <div>
                                                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Full name</label>
                                                <div className="relative">
                                                    <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                                    <input name="name" type="text" autoComplete="name" value={regName} onChange={(e) => setRegName(e.target.value)} placeholder="John Doe" className={inputCls} />
                                                </div>
                                                <InputError message={regErrors.name || errors.name} />
                                            </div>
                                            <div>
                                                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Email address</label>
                                                <div className="relative">
                                                    <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                                    <input name="email" type="email" autoComplete="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} placeholder="you@example.com" className={inputCls} />
                                                </div>
                                                <InputError message={regErrors.email || errors.email} />
                                            </div>
                                            <div>
                                                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                                                <div className="relative">
                                                    <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                                    <input name="password" type={showRegPw ? 'text' : 'password'} autoComplete="new-password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} placeholder="At least 8 characters" className={inputPwCls} />
                                                    <button type="button" onClick={() => setShowRegPw((s) => !s)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-600" tabIndex={-1}>
                                                        {showRegPw ? <EyeOff size={18} /> : <Eye size={18} />}
                                                    </button>
                                                </div>
                                                {regPassword && (
                                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-2">
                                                        <div className="flex gap-1">
                                                            {[1, 2, 3, 4].map((i) => (
                                                                <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${i <= strength ? strengthColor : 'bg-gray-100 dark:bg-white/5'}`} />
                                                            ))}
                                                        </div>
                                                        <p className="mt-1 text-xs text-gray-400">Strength: <span className="font-medium">{strengthLabel}</span></p>
                                                    </motion.div>
                                                )}
                                                <InputError message={regErrors.password || errors.password} />
                                            </div>
                                            <div>
                                                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Confirm password</label>
                                                <div className="relative">
                                                    <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                                    <input name="password_confirmation" type={showRegPw ? 'text' : 'password'} autoComplete="new-password" value={regConfirm} onChange={(e) => setRegConfirm(e.target.value)} placeholder="Re-enter password" className={inputCls} />
                                                </div>
                                                <InputError message={regErrors.password_confirmation || errors.password_confirmation} />
                                            </div>
                                            <button type="submit" disabled={processing || regSubmitting} className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#1b4332] to-[#2d6a4f] px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-emerald-600/30 disabled:opacity-70">
                                                {processing || regSubmitting ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />}
                                                {processing || regSubmitting ? 'Creating account...' : 'Create account'}
                                            </button>
                                        </>
                                    )}
                                </Form>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* ─── Right half: Login form area ─── */}
                <div className="hidden w-1/2 items-center justify-center lg:flex">
                    <AnimatePresence mode="wait">
                        {!isSignUp && (
                            <motion.div
                                key="login-form"
                                initial={{ opacity: 0, x: 40 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 40 }}
                                transition={{ duration: 0.35, delay: 0.15 }}
                                className="w-full max-w-md px-6"
                            >
                                <div className="mb-10">
                                    <h1 className="text-3xl font-bold tracking-tight text-[#1b1b18] dark:text-white">
                                        Log in to your account
                                    </h1>
                                    <p className="mt-2 text-sm text-gray-400">Enter your credentials to continue</p>
                                </div>

                                {status && (
                                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-5 rounded-xl bg-emerald-50 px-4 py-3 text-center text-sm font-medium text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">
                                        {status}
                                    </motion.div>
                                )}

                                <Form {...loginStore.form()} resetOnSuccess={['password']} onSubmit={(e) => { if (!validateLogin()) e.preventDefault(); }} className="space-y-5">
                                    {({ processing, errors }) => (
                                        <>
                                            <div>
                                                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Email address</label>
                                                <div className="relative">
                                                    <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                                    <input name="email" type="email" autoComplete="email" autoFocus value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} placeholder="you@example.com" className={inputCls} />
                                                </div>
                                                <InputError message={loginErrors.email || errors.email} />
                                            </div>
                                            <div>
                                                <div className="mb-1.5 flex items-center justify-between">
                                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                                                    {canResetPassword && <Link href={request()} className="text-xs font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400">Forgot password?</Link>}
                                                </div>
                                                <div className="relative">
                                                    <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                                    <input name="password" type={showLoginPw ? 'text' : 'password'} autoComplete="current-password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} placeholder="Enter your password" className={inputPwCls} />
                                                    <button type="button" onClick={() => setShowLoginPw((s) => !s)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-600" tabIndex={-1}>
                                                        {showLoginPw ? <EyeOff size={18} /> : <Eye size={18} />}
                                                    </button>
                                                </div>
                                                <InputError message={loginErrors.password || errors.password} />
                                            </div>
                                            <label className="flex items-center gap-2.5 text-sm text-gray-500 dark:text-gray-400">
                                                <input type="checkbox" name="remember" className="h-4 w-4 rounded-md border-gray-300 text-emerald-600 focus:ring-emerald-500 dark:border-white/20" />
                                                Remember me
                                            </label>
                                            <button type="submit" disabled={processing} className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#1b4332] to-[#2d6a4f] px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-emerald-600/30 disabled:opacity-70">
                                                {processing ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />}
                                                {processing ? 'Logging in...' : 'Log in'}
                                            </button>
                                            <div className="relative my-3">
                                                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100 dark:border-white/5" /></div>
                                                <div className="relative flex justify-center text-xs"><span className="bg-[#FAFBF9] px-4 text-gray-400 dark:bg-[#080c08]">or continue with</span></div>
                                            </div>
                                            <a href="/auth/google/redirect" className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-white/5 dark:text-white">
                                                <svg width="18" height="18" viewBox="0 0 24 24">
                                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
                                                </svg>
                                                Sign in with Google
                                            </a>
                                        </>
                                    )}
                                </Form>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* ─── Sliding overlay panel (desktop only) ─── */}
                <motion.div
                    className="pointer-events-none absolute inset-y-0 z-30 hidden w-1/2 lg:block"
                    animate={{ x: isSignUp ? '100%' : '0%' }}
                    transition={{ type: 'spring', stiffness: 80, damping: 20 }}
                >
                    <div className="pointer-events-auto relative flex h-full flex-col overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-[#0d2818] via-[#1b4332] to-[#2d6a4f]" />
                        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.03) 1px, transparent 0)', backgroundSize: '32px 32px' }} />

                        <motion.div className="absolute -left-20 -top-20 h-80 w-80 rounded-full bg-emerald-400/10 blur-3xl" animate={{ y: [0, -20, 0], x: [0, 10, 0] }} transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }} />
                        <motion.div className="absolute bottom-10 right-10 h-60 w-60 rounded-full bg-teal-300/10 blur-3xl" animate={{ y: [0, 20, 0], x: [0, -10, 0] }} transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }} />

                        <div className="relative z-10 flex flex-1 flex-col justify-between p-12 text-white">
                            <Link href="/" className="flex items-center gap-2.5 text-xl font-bold">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm"><Truck size={20} /></div>
                                SmartWaste Route
                            </Link>

                            <AnimatePresence mode="wait">
                                <motion.div key={isSignUp ? 'su' : 'li'} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>
                                    <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-emerald-200 backdrop-blur-sm">
                                        <Sparkles size={12} />
                                        {isSignUp ? 'Start your journey today' : 'Trusted by communities'}
                                    </div>
                                    <h2 className="text-4xl font-bold leading-tight tracking-tight xl:text-5xl">
                                        {isSignUp ? (<>Join the movement for{' '}<span className="bg-gradient-to-r from-emerald-200 to-teal-200 bg-clip-text text-transparent">cleaner cities.</span></>) : (<>Welcome back to a{' '}<span className="bg-gradient-to-r from-emerald-200 to-teal-200 bg-clip-text text-transparent">cleaner tomorrow.</span></>)}
                                    </h2>
                                    <p className="mt-5 max-w-sm text-base leading-relaxed text-white/60">
                                        {isSignUp ? 'Create your account to start optimizing waste collection and making a real environmental impact.' : 'Log in to manage routes, track collections, and help build a more sustainable community.'}
                                    </p>
                                    <div className="mt-8 space-y-3">
                                        {FEATURES.map(({ icon: Icon, text }) => (
                                            <div key={text} className="flex items-center gap-3 text-sm text-white/50">
                                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5"><Icon size={14} className="text-emerald-300" /></div>
                                                {text}
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            </AnimatePresence>

                            <div className="flex items-center justify-between">
                                <p className="text-sm text-white/30">© {new Date().getFullYear()} SmartWaste Route</p>
                                <button onClick={() => setIsSignUp(!isSignUp)} className="rounded-full border border-white/20 px-5 py-2 text-sm font-medium text-white/80 backdrop-blur-sm transition hover:bg-white/10">
                                    {isSignUp ? 'Log In Instead' : 'Create Account'}
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* ─── Mobile: single form view (no sliding panel) ─── */}
                <div className="flex w-full items-center justify-center p-6 lg:hidden">
                    <AnimatePresence mode="wait">
                        {!isSignUp ? (
                            <motion.div key="m-login" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3 }} className="w-full max-w-md">
                                <div className="mb-8 text-center">
                                    <div className="mb-4 flex justify-center">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#2d6a4f] to-[#40916c] text-white shadow-lg shadow-emerald-500/20"><Truck size={20} /></div>
                                    </div>
                                    <h1 className="text-3xl font-bold tracking-tight text-[#1b1b18] dark:text-white">Log in</h1>
                                    <p className="mt-2 text-sm text-gray-400">Enter your credentials to continue</p>
                                </div>
                                {status && <div className="mb-5 rounded-xl bg-emerald-50 px-4 py-3 text-center text-sm font-medium text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">{status}</div>}
                                <Form {...loginStore.form()} resetOnSuccess={['password']} onSubmit={(e) => { if (!validateLogin()) e.preventDefault(); }} className="space-y-5">
                                    {({ processing, errors }) => (
                                        <>
                                            <div>
                                                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                                                <div className="relative">
                                                    <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                                    <input name="email" type="email" autoComplete="email" autoFocus value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} placeholder="you@example.com" className={inputCls} />
                                                </div>
                                                <InputError message={loginErrors.email || errors.email} />
                                            </div>
                                            <div>
                                                <div className="mb-1.5 flex items-center justify-between">
                                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                                                    {canResetPassword && <Link href={request()} className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Forgot?</Link>}
                                                </div>
                                                <div className="relative">
                                                    <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                                    <input name="password" type={showLoginPw ? 'text' : 'password'} autoComplete="current-password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} placeholder="Password" className={inputPwCls} />
                                                    <button type="button" onClick={() => setShowLoginPw((s) => !s)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400" tabIndex={-1}>{showLoginPw ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                                                </div>
                                                <InputError message={loginErrors.password || errors.password} />
                                            </div>
                                            <label className="flex items-center gap-2.5 text-sm text-gray-500"><input type="checkbox" name="remember" className="h-4 w-4 rounded-md border-gray-300 text-emerald-600" /> Remember me</label>
                                            <button type="submit" disabled={processing} className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#1b4332] to-[#2d6a4f] px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition-all hover:-translate-y-0.5 disabled:opacity-70">
                                                {processing ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <ArrowRight size={16} />}
                                                {processing ? 'Logging in...' : 'Log in'}
                                            </button>
                                            {canRegister && (
                                                <p className="text-center text-sm text-gray-500">
                                                    Don't have an account?{' '}
                                                    <button type="button" onClick={() => setIsSignUp(true)} className="font-semibold text-emerald-600">Sign up</button>
                                                </p>
                                            )}
                                        </>
                                    )}
                                </Form>
                            </motion.div>
                        ) : (
                            <motion.div key="m-register" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }} transition={{ duration: 0.3 }} className="w-full max-w-md">
                                <div className="mb-6 text-center">
                                    <div className="mb-4 flex justify-center">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#2d6a4f] to-[#40916c] text-white shadow-lg shadow-emerald-500/20"><Truck size={20} /></div>
                                    </div>
                                    <h1 className="text-3xl font-bold tracking-tight text-[#1b1b18] dark:text-white">Create account</h1>
                                    <p className="mt-2 text-sm text-gray-400">Sign up to get started</p>
                                </div>
                                <Form {...registerStore.form()} resetOnSuccess={['password', 'password_confirmation']} onSubmit={(e) => { if (!validateRegister()) { e.preventDefault(); return; } setRegSubmitting(true); }} onError={() => setRegSubmitting(false)} className="space-y-4">
                                    {({ processing, errors }) => (
                                        <>
                                            <div>
                                                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Full name</label>
                                                <div className="relative"><User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" /><input name="name" type="text" autoComplete="name" value={regName} onChange={(e) => setRegName(e.target.value)} placeholder="John Doe" className={inputCls} /></div>
                                                <InputError message={regErrors.name || errors.name} />
                                            </div>
                                            <div>
                                                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                                                <div className="relative"><Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" /><input name="email" type="email" autoComplete="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} placeholder="you@example.com" className={inputCls} /></div>
                                                <InputError message={regErrors.email || errors.email} />
                                            </div>
                                            <div>
                                                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                                                <div className="relative">
                                                    <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                                    <input name="password" type={showRegPw ? 'text' : 'password'} autoComplete="new-password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} placeholder="At least 8 characters" className={inputPwCls} />
                                                    <button type="button" onClick={() => setShowRegPw((s) => !s)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400" tabIndex={-1}>{showRegPw ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                                                </div>
                                                {regPassword && (
                                                    <div className="mt-2 flex gap-1">
                                                        {[1, 2, 3, 4].map((i) => (<div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i <= strength ? strengthColor : 'bg-gray-100'}`} />))}
                                                    </div>
                                                )}
                                                <InputError message={regErrors.password || errors.password} />
                                            </div>
                                            <div>
                                                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Confirm password</label>
                                                <div className="relative"><Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" /><input name="password_confirmation" type={showRegPw ? 'text' : 'password'} autoComplete="new-password" value={regConfirm} onChange={(e) => setRegConfirm(e.target.value)} placeholder="Re-enter password" className={inputCls} /></div>
                                                <InputError message={regErrors.password_confirmation || errors.password_confirmation} />
                                            </div>
                                            <button type="submit" disabled={processing || regSubmitting} className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#1b4332] to-[#2d6a4f] px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition-all hover:-translate-y-0.5 disabled:opacity-70">
                                                {processing || regSubmitting ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <ArrowRight size={16} />}
                                                {processing || regSubmitting ? 'Creating...' : 'Create account'}
                                            </button>
                                            <p className="text-center text-sm text-gray-500">
                                                Already have an account?{' '}
                                                <button type="button" onClick={() => setIsSignUp(false)} className="font-semibold text-emerald-600">Log in</button>
                                            </p>
                                        </>
                                    )}
                                </Form>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </>
    );
}
