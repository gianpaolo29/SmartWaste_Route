<?php

namespace Database\Seeders;

use App\Support\TuyBarangayBoundaries;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class TuyBarangaySeeder extends Seeder
{
    /**
     * Seed all 23 barangays of Tuy, Batangas from the CENTROIDS source of truth.
     * Each barangay gets exactly one zone linked via pivot.
     */
    public function run(): void
    {
        $barangays = array_keys(TuyBarangayBoundaries::CENTROIDS);

        DB::transaction(function () use ($barangays) {
            foreach ($barangays as $name) {
                DB::table('barangays')->updateOrInsert(
                    ['name' => $name],
                    ['updated_at' => now(), 'created_at' => now()]
                );

                $barangayId = DB::table('barangays')->where('name', $name)->value('id');

                $zoneName = 'Zone ' . $name;

                $zone = DB::table('zones')->where('name', $zoneName)->first();

                if (!$zone) {
                    $zoneId = DB::table('zones')->insertGetId([
                        'name' => $zoneName,
                        'description' => "Default collection zone for Barangay {$name}, Tuy, Batangas.",
                        'active' => true,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                } else {
                    $zoneId = $zone->id;
                }

                // Link via pivot
                DB::table('barangay_zone')->updateOrInsert(
                    ['barangay_id' => $barangayId, 'zone_id' => $zoneId],
                    ['created_at' => now(), 'updated_at' => now()]
                );
            }
        });
    }
}
