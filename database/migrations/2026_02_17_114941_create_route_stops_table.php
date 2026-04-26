<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('route_stops', function (Blueprint $table) {
            $table->id();
            $table->foreignId('route_plan_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('stop_no');
            $table->foreignId('household_id')->nullable()->constrained()->nullOnDelete();
            $table->string('stop_address')->nullable();
            $table->decimal('lat', 10, 7)->nullable();
            $table->decimal('lng', 10, 7)->nullable();
            $table->timestamp('planned_eta')->nullable();
            $table->timestamps();

            $table->index(['route_plan_id', 'stop_no']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('route_stops');
    }
};
