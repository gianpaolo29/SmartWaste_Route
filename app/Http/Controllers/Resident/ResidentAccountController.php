<?php

namespace App\Http\Controllers\Resident;

use App\Http\Controllers\Controller;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ResidentAccountController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        $reportsCount = $user->missedPickupReports()->count();
        $household = $user->households()->with('zone')->first();

        return Inertia::render('resident/account', [
            'mustVerifyEmail' => $user instanceof MustVerifyEmail,
            'status' => $request->session()->get('status'),
            'twoFactorEnabled' => ! is_null($user->two_factor_confirmed_at),
            'stats' => [
                'reports' => $reportsCount,
                'zone' => $household?->zone?->name,
                'address' => $household?->address,
            ],
        ]);
    }
}
