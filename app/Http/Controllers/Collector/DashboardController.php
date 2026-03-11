<?php

namespace App\Http\Controllers\Collector;

use App\Http\Controllers\Controller;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        return Inertia::render('collector/dashboard', [
            'role' => 'collector',
        ]);
    }
}
