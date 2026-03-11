<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class TestUsersSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'admin@test.com'],
            ['name' => 'Admin Test', 'password' => Hash::make('password'), 'role' => 'admin', 'status' => 'active']
        );

        User::updateOrCreate(
            ['email' => 'collector@test.com'],
            ['name' => 'Collector Test', 'password' => Hash::make('password'), 'role' => 'collector', 'status' => 'active']
        );

        User::updateOrCreate(
            ['email' => 'resident@test.com'],
            ['name' => 'Resident Test', 'password' => Hash::make('password'), 'role' => 'resident', 'status' => 'active']
        );
    }
}
