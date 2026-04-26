<?php

namespace Database\Seeders;

use App\Models\Truck;
use App\Models\Zone;
use Illuminate\Database\Seeder;

class TruckSeeder extends Seeder
{
    public function run(): void
    {
        $zoneCount = Zone::count();

        if ($zoneCount === 0) {
            $this->command?->warn('No zones found — skipping TruckSeeder.');
            return;
        }

        for ($i = 1; $i <= $zoneCount; $i++) {
            Truck::updateOrCreate(
                ['plate_no' => sprintf('SWR-%03d', $i)],
                [
                    'capacity_kg' => 2000,
                    'status' => 'available',
                ],
            );
        }

        $this->command?->info("Seeded {$zoneCount} truck(s).");
    }
}
