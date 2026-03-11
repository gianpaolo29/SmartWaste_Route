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
        Schema::create('collections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('route_stop_id')->constrained()->cascadeOnDelete();

            $table->timestamp('collected_at')->nullable()->index();
            $table->string('status')->default('collected')->index(); // collected|skipped|failed
            $table->string('proof_photo_url')->nullable();
            $table->decimal('gps_lat', 10, 7)->nullable();
            $table->decimal('gps_lng', 10, 7)->nullable();
            $table->text('remarks')->nullable();

            $table->timestamps();

            $table->unique('route_stop_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('collections');
    }
};
