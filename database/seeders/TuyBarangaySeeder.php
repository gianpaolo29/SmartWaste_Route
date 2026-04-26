<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class TuyBarangaySeeder extends Seeder
{
    /**
     * Seed all 23 barangays of Tuy, Batangas.
     * Each barangay gets exactly one zone linked via pivot.
     */
    public function run(): void
    {
        $barangays = [
            'Acle',
            'Bayudbud',
            'Bolboc',
            'Burol',
            'Dao',
            'Dalima',
            'Guinhawa',
            'Luna',
            'Luntal',
            'Magahis',
            'Malibu',
            'Mataywanac',
            'Palincaro',
            'Putol',
            'Rillo',
            'Sabang',
            'Talon',
            'Tuyon-tuyon',
            'Poblacion 1',
            'Poblacion 2',
            'Poblacion 3',
            'Poblacion 4',
            'Toong',
        ];

        DB::transaction(function () use ($barangays) {
            foreach ($barangays as $name) {
                DB::table('barangays')->updateOrInsert(
                    ['name' => $name],
                    ['updated_at' => now(), 'created_at' => now()]
                );

                $barangayId = DB::table('barangays')->where('name', $name)->value('id');

                $zoneName = 'Zone ' . $name;

                $zone = DB::table('zones')->where('name', $zoneName)->first();

                if (! $zone) {
                    $zoneId = DB::table('zones')->insertGetId([
                        'name'        => $zoneName,
                        'description' => "Default collection zone for Barangay {$name}, Tuy, Batangas.",
                        'active'      => true,
                        'created_at'  => now(),
                        'updated_at'  => now(),
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
