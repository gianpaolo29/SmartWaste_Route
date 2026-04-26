<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Create pivot table
        Schema::create('barangay_zone', function (Blueprint $table) {
            $table->id();
            $table->foreignId('barangay_id')->constrained()->cascadeOnDelete();
            $table->foreignId('zone_id')->constrained()->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['barangay_id', 'zone_id']);
        });

        // 2. Migrate existing data from zones.barangay_id into the pivot
        DB::table('zones')->whereNotNull('barangay_id')->orderBy('id')->each(function ($zone) {
            DB::table('barangay_zone')->insert([
                'barangay_id' => $zone->barangay_id,
                'zone_id' => $zone->id,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        });

        // 3. Drop the old foreign key and column
        Schema::table('zones', function (Blueprint $table) {
            $table->dropForeign(['barangay_id']);
            $table->dropIndex('zones_barangay_id_name_index');
            $table->dropColumn('barangay_id');
        });
    }

    public function down(): void
    {
        // Re-add barangay_id column
        Schema::table('zones', function (Blueprint $table) {
            $table->foreignId('barangay_id')->nullable()->after('id')->constrained()->cascadeOnDelete();
        });

        // Migrate pivot data back (take first barangay per zone)
        DB::table('barangay_zone')
            ->select('zone_id', DB::raw('MIN(barangay_id) as barangay_id'))
            ->groupBy('zone_id')
            ->orderBy('zone_id')
            ->each(function ($row) {
                DB::table('zones')->where('id', $row->zone_id)->update(['barangay_id' => $row->barangay_id]);
            });

        Schema::table('zones', function (Blueprint $table) {
            $table->index(['barangay_id', 'name']);
        });

        Schema::dropIfExists('barangay_zone');
    }
};
