<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class CollectorSeeder extends Seeder
{
    public function run(): void
    {
        $collectors = [
            ['name' => 'JSo uan Dela Cruz', 'email' => 'collector1@smartwaste.test'],
            ['name' => 'Pedro Santos',   'email' => 'collector2@smartwaste.test'],
            ['name' => 'Maria Reyes',    'email' => 'collector3@smartwaste.test'],
        ];

        foreach ($collectors as $c) {
            User::updateOrCreate(
                ['email' => $c['email']],
                [
                    'name' => $c['name'],
                    'password' => 'password',
                    'role' => 'collector',
                    'status' => 'active',
                ],
            );
        }

        $this->command?->info('Seeded ' . count($collectors) . ' collector(s).');
    }
}
