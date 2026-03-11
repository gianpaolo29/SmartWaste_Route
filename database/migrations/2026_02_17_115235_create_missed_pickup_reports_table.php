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
        Schema::create('missed_pickup_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('resident_user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('zone_id')->constrained()->cascadeOnDelete();

            $table->timestamp('report_datetime')->index();
            $table->string('location_text');
            $table->decimal('lat', 10, 7)->nullable();
            $table->decimal('lng', 10, 7)->nullable();
            $table->string('photo_url')->nullable();
            $table->text('description')->nullable();

            $table->string('status')->default('pending')->index(); // pending|verified|scheduled|resolved|rejected
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('missed_pickup_reports');
    }
};
