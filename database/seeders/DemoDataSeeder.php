<?php

namespace Database\Seeders;

use App\Models\AppNotification;
use App\Models\Barangay;
use App\Models\Collection;
use App\Models\CollectionReport;
use App\Models\Household;
use App\Models\MissedPickupReport;
use App\Models\RoutePlan;
use App\Models\RouteStop;
use App\Models\Schedule;
use App\Models\Truck;
use App\Models\User;
use App\Models\Zone;
use App\Support\TuyBarangayBoundaries;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class DemoDataSeeder extends Seeder
{
    private array $firstNames = [
        'Juan', 'Maria', 'Jose', 'Ana', 'Pedro', 'Rosa', 'Carlos', 'Elena',
        'Miguel', 'Sofia', 'Antonio', 'Liza', 'Rafael', 'Grace', 'Ramon',
        'Diana', 'Fernando', 'Cristina', 'Gabriel', 'Angela', 'Roberto',
        'Patricia', 'Eduardo', 'Marissa', 'Ricardo', 'Jasmine', 'Alberto',
        'Carmela', 'Ernesto', 'Bianca', 'Manuel', 'Teresa', 'Francisco',
        'Lucia', 'Danilo', 'Rosario', 'Benito', 'Alma', 'Gregorio', 'Fe',
        'Lorenzo', 'Nena', 'Emilio', 'Rowena', 'Santiago', 'Marites',
        'Alejandro', 'Cherry', 'Arturo', 'Mylene',
    ];

    private array $lastNames = [
        'Dela Cruz', 'Santos', 'Reyes', 'Cruz', 'Bautista', 'Garcia',
        'Mendoza', 'Lopez', 'Rivera', 'Torres', 'Gonzales', 'Flores',
        'Ramos', 'Aquino', 'Castro', 'Fernandez', 'Villanueva', 'Martinez',
        'Pascual', 'Navarro', 'Mercado', 'Domingo', 'Salvador', 'Aguilar',
        'Hernandez', 'Castillo', 'Manalo', 'Gutierrez', 'Soriano', 'Diaz',
    ];

    private array $streets = [
        'Rizal St.', 'Mabini St.', 'Bonifacio Ave.', 'Aguinaldo Rd.', 'Luna St.',
        'Del Pilar St.', 'Burgos Ave.', 'Quezon Blvd.', 'Sampaguita St.',
        'Narra St.', 'Mahogany Rd.', 'Acacia Lane', 'Orchid St.', 'Jasmine Ave.',
        'Camia St.', 'Ilang-Ilang Rd.', 'Dahlia Lane', 'Rose St.', 'Tulip Ave.',
        'Sunflower Rd.',
    ];

    private array $skipReasons = [
        'Locked gate', 'No waste out', 'Road blocked', 'Dog / animal',
        'Resident not home', 'No waste prepared', 'Gate inaccessible',
    ];

    private array $missedDescriptions = [
        'Truck did not pass by our area today.',
        'Collection was scheduled but no truck arrived.',
        'We waited until 11am but no collector came.',
        'Missed again this week. Please prioritize our zone.',
        'The truck passed but skipped our house.',
        'Collection was hours late, we already left for work.',
        'No collection for two consecutive weeks.',
        'Truck came but did not collect all bins.',
        'Schedule says Tuesday but no truck today.',
        'We have bulky waste that was not collected.',
    ];

    private array $reportNotes = [
        'Full collection completed. All households cooperated.',
        'Heavy rain slowed down operations. Completed 1 hour late.',
        'Some households had unsegregated waste. Noted for follow-up.',
        'Smooth collection. Residents well-prepared.',
        'Two houses were locked. Marked as skipped.',
        'Excess waste due to weekend cleanup activities.',
        'Route completed ahead of schedule.',
        'Minor delay due to road construction on main road.',
        'All biodegradable waste was properly composted.',
        'Large amount of recyclables collected today.',
    ];

    private array $announcementTitles = [
        'Schedule Update: Holiday Collection',
        'Important: Waste Segregation Reminder',
        'New Collection Schedule for This Month',
        'Special Collection: Bulky Waste Pickup',
        'Weather Advisory: Collection May Be Delayed',
        'Community Cleanup Drive This Saturday',
        'Reminder: Properly Bag Your Waste',
        'Route Change Notice for Zone Updates',
        'Thank You for Proper Waste Segregation!',
        'System Maintenance Notice',
    ];

    private array $announcementMessages = [
        'Due to the upcoming holiday, waste collection will be moved to the following day. Please prepare your waste accordingly.',
        'Please ensure all waste is properly segregated into biodegradable, recyclable, and residual categories before placing outside.',
        'We have updated our collection schedule. Please check the Schedule page for the latest times in your zone.',
        'Special bulky waste collection is scheduled for this weekend. Place large items by the curb before 7 AM.',
        'Due to expected heavy rainfall, collection may be delayed by 1-2 hours. We apologize for any inconvenience.',
        'Join our community cleanup drive this Saturday from 7 AM to 10 AM. Volunteers are welcome!',
        'Reminder: Please use proper trash bags and tie them securely. Loose waste will not be collected.',
        'We have optimized our collection routes for faster service. Some pickup times may change.',
        'Thank you for your cooperation in proper waste segregation. Our recycling rates have improved by 15%!',
        'The SmartWaste system will undergo brief maintenance tonight. Service will resume by 6 AM.',
    ];

    public function run(): void
    {
        $password = Hash::make('password');

        // ── Admin ──
        $admin = User::updateOrCreate(
            ['email' => 'admin@smartwaste.test'],
            ['name' => 'Admin User', 'password' => $password, 'role' => 'admin', 'status' => 'active'],
        );

        // ── Ensure 23 barangays + zones exist ──
        $centroids = TuyBarangayBoundaries::CENTROIDS;
        $barangays = [];
        $zones = [];

        foreach ($centroids as $name => $coords) {
            $brg = Barangay::firstOrCreate(['name' => $name]);
            $zone = Zone::firstOrCreate(
                ['name' => 'Zone ' . $name],
                ['description' => "Collection zone for Brgy. {$name}", 'active' => true],
            );
            $brg->zones()->syncWithoutDetaching([$zone->id]);
            $barangays[$name] = $brg;
            $zones[$name] = $zone;
        }

        $barangayList = array_values($barangays);
        $zoneList = array_values($zones);
        $centroidKeys = array_keys($centroids);
        $centroidValues = array_values($centroids);

        // ── 10 Collectors ──
        $collectors = [];
        for ($i = 1; $i <= 10; $i++) {
            $fn = $this->firstNames[array_rand($this->firstNames)];
            $ln = $this->lastNames[array_rand($this->lastNames)];
            $collectors[] = User::updateOrCreate(
                ['email' => "collector{$i}@smartwaste.test"],
                ['name' => "{$fn} {$ln}", 'password' => $password, 'role' => 'collector', 'status' => 'active'],
            );
        }

        // ── 10 Trucks (assigned to collectors) ──
        $trucks = [];
        for ($i = 1; $i <= 10; $i++) {
            $trucks[] = Truck::updateOrCreate(
                ['plate_no' => sprintf('SWR-%03d', $i)],
                [
                    'capacity_kg' => fake()->randomElement([1500, 2000, 2500, 3000]),
                    'status' => $i <= 8 ? 'available' : fake()->randomElement(['maintenance', 'inactive']),
                    'collector_user_id' => $collectors[$i - 1]->id,
                ],
            );
        }

        // ── 5 Households per barangay (115 residents) ──
        $allHouseholds = [];
        $residentIdx = 0;

        foreach ($centroidKeys as $brgIdx => $brgName) {
            $brg = $barangays[$brgName];
            $zone = $zones[$brgName];
            [$baseLat, $baseLng] = $centroidValues[$brgIdx];

            for ($h = 0; $h < 5; $h++) {
                $residentIdx++;
                $fn = $this->firstNames[($residentIdx * 7 + $h) % count($this->firstNames)];
                $ln = $this->lastNames[($residentIdx * 3 + $h) % count($this->lastNames)];

                $resident = User::updateOrCreate(
                    ['email' => "resident{$residentIdx}@smartwaste.test"],
                    ['name' => "{$fn} {$ln}", 'password' => $password, 'role' => 'resident', 'status' => 'active'],
                );

                $lat = $baseLat + (mt_rand(-300, 300) / 100000);
                $lng = $baseLng + (mt_rand(-300, 300) / 100000);

                $household = Household::updateOrCreate(
                    ['resident_user_id' => $resident->id],
                    [
                        'barangay_id' => $brg->id,
                        'zone_id' => $zone->id,
                        'address_line' => mt_rand(1, 999) . ' ' . $this->streets[array_rand($this->streets)] . ', Brgy. ' . $brgName,
                        'lat' => $lat,
                        'lng' => $lng,
                    ],
                );

                $allHouseholds[] = $household;
            }
        }

        // ── Schedules (2-3 days per zone) ──
        foreach ($zoneList as $zone) {
            $days = fake()->randomElements([0, 1, 2, 3, 4, 5, 6], mt_rand(2, 3));
            foreach ($days as $day) {
                Schedule::updateOrCreate(
                    ['zone_id' => $zone->id, 'day_of_week' => $day, 'start_time' => '06:00:00', 'end_time' => '12:00:00'],
                    ['published_by' => $admin->id],
                );
            }
        }

        // ── Route Plans + Stops + Collections + Reports (100+ of each) ──
        $routeCount = 0;
        $collectionReportCount = 0;

        // Generate routes for the past 30 days
        for ($daysAgo = 30; $daysAgo >= 0; $daysAgo--) {
            $date = Carbon::today()->subDays($daysAgo);

            // 3-5 routes per day across different zones
            $routesPerDay = mt_rand(3, 5);
            $dayZones = fake()->randomElements($zoneList, min($routesPerDay, count($zoneList)));

            foreach ($dayZones as $zone) {
                $routeCount++;
                $collector = $collectors[array_rand($collectors)];
                $truck = $trucks[array_rand($trucks)];

                $isCompleted = $daysAgo > 0 ? (mt_rand(1, 100) <= 85) : (mt_rand(1, 100) <= 30);
                $isCancelled = !$isCompleted && mt_rand(1, 100) <= 10;
                $status = $isCancelled ? 'cancelled' : ($isCompleted ? 'completed' : ($daysAgo === 0 ? 'planned' : 'completed'));

                $startedAt = $isCompleted ? $date->copy()->setHour(mt_rand(5, 8))->setMinute(mt_rand(0, 59)) : null;
                $finishedAt = $isCompleted && $startedAt ? $startedAt->copy()->addHours(mt_rand(2, 5)) : null;

                $plan = RoutePlan::create([
                    'route_date' => $date,
                    'zone_id' => $zone->id,
                    'truck_id' => $truck->id,
                    'collector_user_id' => $collector->id,
                    'status' => $status,
                    'created_by' => $admin->id,
                    'started_at' => $startedAt,
                    'finished_at' => $finishedAt,
                ]);

                // Get households in this zone
                $zoneHouseholds = collect($allHouseholds)->where('zone_id', $zone->id)->values();
                if ($zoneHouseholds->isEmpty()) continue;

                // Create 3-5 stops per route
                $stopCount = min(mt_rand(3, 5), $zoneHouseholds->count());
                $selectedHouseholds = $zoneHouseholds->random($stopCount);

                foreach ($selectedHouseholds as $stopNo => $hh) {
                    $stop = RouteStop::create([
                        'route_plan_id' => $plan->id,
                        'stop_no' => $stopNo + 1,
                        'household_id' => $hh->id,
                        'stop_address' => $hh->address_line,
                        'lat' => $hh->lat,
                        'lng' => $hh->lng,
                    ]);

                    // Create collection record for completed routes
                    if ($isCompleted) {
                        $collStatus = fake()->randomElement(['collected', 'collected', 'collected', 'collected', 'skipped', 'failed']);
                        Collection::create([
                            'route_stop_id' => $stop->id,
                            'collected_at' => $startedAt?->copy()->addMinutes(($stopNo + 1) * mt_rand(8, 20)),
                            'status' => $collStatus,
                            'gps_lat' => $hh->lat + (mt_rand(-50, 50) / 1000000),
                            'gps_lng' => $hh->lng + (mt_rand(-50, 50) / 1000000),
                            'remarks' => $collStatus === 'skipped'
                                ? $this->skipReasons[array_rand($this->skipReasons)]
                                : ($collStatus === 'failed' ? 'Unable to collect' : null),
                        ]);
                    }
                }

                // Create collection report for completed routes
                if ($isCompleted) {
                    $collectionReportCount++;
                    CollectionReport::create([
                        'route_plan_id' => $plan->id,
                        'collector_user_id' => $collector->id,
                        'report_date' => $date,
                        'mixed_waste' => mt_rand(50, 500) / 10,
                        'biodegradable' => mt_rand(30, 300) / 10,
                        'recyclable' => mt_rand(20, 200) / 10,
                        'residual' => mt_rand(10, 100) / 10,
                        'solid_waste' => mt_rand(5, 80) / 10,
                        'notes' => mt_rand(1, 100) <= 40 ? $this->reportNotes[array_rand($this->reportNotes)] : null,
                    ]);
                }
            }
        }

        // ── Missed Pickup Reports (100+) ──
        $residents = User::where('role', 'resident')->get();
        for ($i = 0; $i < 100; $i++) {
            $resident = $residents->random();
            $hh = Household::where('resident_user_id', $resident->id)->first();
            if (!$hh) continue;

            $daysAgo = mt_rand(0, 60);
            $status = fake()->randomElement(['pending', 'pending', 'verified', 'resolved', 'resolved', 'resolved', 'rejected']);

            MissedPickupReport::create([
                'resident_user_id' => $resident->id,
                'zone_id' => $hh->zone_id,
                'report_datetime' => Carbon::now()->subDays($daysAgo)->setHour(mt_rand(6, 18)),
                'location_text' => $hh->address_line,
                'lat' => $hh->lat,
                'lng' => $hh->lng,
                'description' => $this->missedDescriptions[array_rand($this->missedDescriptions)],
                'status' => $status,
            ]);
        }

        // ── Notifications (100+) — mix of collection confirmations and announcements ──
        $notifTypes = ['collection_confirmation', 'collection_confirmation', 'announcement', 'schedule_update'];

        for ($i = 0; $i < 100; $i++) {
            $type = $notifTypes[array_rand($notifTypes)];
            $resident = $residents->random();
            $daysAgo = mt_rand(0, 30);

            if ($type === 'announcement') {
                $titleIdx = array_rand($this->announcementTitles);
                AppNotification::create([
                    'user_id' => $resident->id,
                    'title' => $this->announcementTitles[$titleIdx],
                    'message' => $this->announcementMessages[$titleIdx],
                    'type' => 'announcement',
                    'is_read' => mt_rand(1, 100) <= 60,
                    'created_at' => Carbon::now()->subDays($daysAgo),
                ]);
            } elseif ($type === 'collection_confirmation') {
                $hour = mt_rand(6, 12);
                AppNotification::create([
                    'user_id' => $resident->id,
                    'title' => 'Waste Collected',
                    'message' => 'Your waste was collected at ' . Carbon::now()->subDays($daysAgo)->setHour($hour)->format('g:i A') . '. Thank you for keeping your community clean!',
                    'type' => 'collection_confirmation',
                    'is_read' => mt_rand(1, 100) <= 70,
                    'created_at' => Carbon::now()->subDays($daysAgo)->setHour($hour),
                ]);
            } else {
                AppNotification::create([
                    'user_id' => $resident->id,
                    'title' => 'Schedule Updated',
                    'message' => 'Your zone collection schedule has been updated. Please check the Schedule page for details.',
                    'type' => 'schedule_update',
                    'is_read' => mt_rand(1, 100) <= 50,
                    'created_at' => Carbon::now()->subDays($daysAgo),
                ]);
            }
        }

        // ── Summary ──
        $this->command->info("Demo data seeded:");
        $this->command->info("  Admin:       admin@smartwaste.test / password");
        $this->command->info("  Collectors:  collector1@smartwaste.test ... collector10@smartwaste.test / password");
        $this->command->info("  Residents:   resident1@smartwaste.test ... resident{$residentIdx}@smartwaste.test / password");
        $this->command->info("  Barangays:   " . count($barangays));
        $this->command->info("  Zones:       " . count($zones));
        $this->command->info("  Trucks:      10");
        $this->command->info("  Households:  " . count($allHouseholds));
        $this->command->info("  Routes:      {$routeCount}");
        $this->command->info("  Reports:     {$collectionReportCount}");
        $this->command->info("  Missed:      100");
        $this->command->info("  Notifications: 100");
    }
}
