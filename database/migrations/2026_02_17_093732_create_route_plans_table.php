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
        Schema::create('route_plans', function (Blueprint $table) {
            $table->id();
            $table->date('route_date')->index();

            $table->foreignId('zone_id')->constrained()->cascadeOnDelete();
            $table->foreignId('truck_id')->constrained()->restrictOnDelete();
            $table->foreignId('collector_user_id')->constrained('users')->restrictOnDelete();

            $table->string('status')->default('planned')->index(); // planned|in_progress|completed|cancelled
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();

            $table->timestamps();

            $table->index(['zone_id', 'route_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('route_plans');
    }
};
