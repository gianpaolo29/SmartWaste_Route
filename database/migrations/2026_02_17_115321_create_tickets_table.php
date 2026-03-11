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
        Schema::create('tickets', function (Blueprint $table) {
            $table->id();

            $table->foreignId('report_id')->constrained('missed_pickup_reports')->cascadeOnDelete();
            $table->string('current_status')->default('pending')->index(); // pending|verified|scheduled|resolved|rejected

            $table->foreignId('assigned_route_plan_id')->nullable()->constrained('route_plans')->nullOnDelete();

            $table->foreignId('verified_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('resolved_by')->nullable()->constrained('users')->nullOnDelete();

            $table->timestamp('closed_at')->nullable()->index();
            $table->timestamps();

            $table->unique('report_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tickets');
    }
};
