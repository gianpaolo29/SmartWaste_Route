import { Head } from '@inertiajs/react';
import { useEffect } from 'react';
import { router } from '@inertiajs/react';

/**
 * Registration is now handled by the sliding form on the login page.
 * This page simply redirects to /login with a flag to open the signup panel.
 */
export default function Register() {
    useEffect(() => {
        router.visit('/login');
    }, []);

    return <Head title="Redirecting..." />;
}
