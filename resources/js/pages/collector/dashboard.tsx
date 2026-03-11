import { Head, usePage } from '@inertiajs/react';
import React from 'react';


export default function CollectorDashboard() {
    const user = usePage().props.auth?.user;

    return (
        <>
            <Head title="Collector Dashboard" />
            <div className="mx-auto max-w-4xl space-y-3 p-8">
                <h1 className="text-2xl font-semibold">Collector Dashboard</h1>
                <p className="text-sm text-gray-600">
                    Testing role-based login routing.
                </p>

                <div className="rounded border bg-white p-4 text-sm">
                    <div>
                        <span className="text-gray-500">User:</span>{' '}
                        {user?.name}
                    </div>
                </div>
            </div>
        </>
    );
}
