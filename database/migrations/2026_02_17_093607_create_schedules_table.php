<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('zone_id')->constrained()->cascadeOnDelete();

            $table->unsignedTinyInteger('day_of_week')->index(); // 0=Sun .. 6=Sat
            $table->time('start_time');
            $table->time('end_time');

            $table->foreignId('published_by')->constrained('users')->restrictOnDelete();
            $table->timestamps();

            $table->unique(['zone_id', 'day_of_week', 'start_time', 'end_time'], 'zone_day_time_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('schedules');
    }
};
