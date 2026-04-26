<?php

namespace Database\Seeders;

use App\Models\Household;
use App\Models\User;
use App\Models\Zone;
use Illuminate\Database\Seeder;

class ResidentSeeder extends Seeder
{
    public function run(): void
    {
        $zones = Zone::with('barangays')->get();

        if ($zones->isEmpty()) {
            $this->command?->warn('No zones found — skipping ResidentSeeder.');
            return;
        }

        // Random Tuy-area coordinate near a center point
        $jitter = fn () => (mt_rand(-400, 400) / 100000); // ~±0.004 deg

        $count = 0;

        foreach ($zones as $zone) {
            $firstBarangay = $zone->barangays->first()?->name;
            $barangaySlug = strtolower(str_replace(' ', '', $firstBarangay ?? 'tuy'));
            $center = $this->barangayCenter($firstBarangay);

            for ($i = 1; $i <= 10; $i++) {
                $email = sprintf('resident_%s_%d@smartwaste.test', $barangaySlug, $i);

                $user = User::updateOrCreate(
                    ['email' => $email],
                    [
                        'name' => sprintf('%s Resident %d', $firstBarangay ?? 'Tuy', $i),
                        'password' => 'password',
                        'role' => 'resident',
                        'status' => 'active',
                    ],
                );

                Household::updateOrCreate(
                    ['resident_user_id' => $user->id],
                    [
                        'barangay_id' => $zone->barangays->first()?->id,
                        'zone_id' => $zone->id,
                        'address_line' => sprintf('Purok %d, %s, Tuy, Batangas', $i, $zone->barangayNames()),
                        'lat' => $center['lat'] + $jitter(),
                        'lng' => $center['lng'] + $jitter(),
                    ],
                );

                $count++;
            }
        }

        $this->command?->info("Seeded {$count} residents across {$zones->count()} zone(s).");
    }

    /**
     * Approximate centers for Tuy barangays. Falls back to Tuy poblacion.
     */
    private function barangayCenter(?string $name): array
    {
        $defaults = ['lat' => 13.9989, 'lng' => 120.7297]; // Tuy poblacion approx

        return match (strtolower(trim((string) $name))) {
            'poblacion'      => ['lat' => 13.9989, 'lng' => 120.7297],
            'magahis'        => ['lat' => 14.0393, 'lng' => 120.7497],
            'bolbok'         => ['lat' => 14.0193, 'lng' => 120.7197],
            'luna'           => ['lat' => 14.0083, 'lng' => 120.7350],
            'sabang'         => ['lat' => 13.9920, 'lng' => 120.7400],
            'palincaro'      => ['lat' => 14.0050, 'lng' => 120.7250],
            'malibu'         => ['lat' => 13.9850, 'lng' => 120.7150],
            'putol'          => ['lat' => 14.0150, 'lng' => 120.7400],
            default          => $defaults,
        };
    }
}
