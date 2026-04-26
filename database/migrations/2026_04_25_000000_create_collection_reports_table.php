<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('collection_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('route_plan_id')->constrained()->cascadeOnDelete();
            $table->foreignId('collector_user_id')->constrained('users')->cascadeOnDelete();
            $table->date('report_date');
            $table->decimal('mixed_waste', 8, 2)->default(0);
            $table->decimal('biodegradable', 8, 2)->default(0);
            $table->decimal('recyclable', 8, 2)->default(0);
            $table->decimal('residual', 8, 2)->default(0);
            $table->decimal('solid_waste', 8, 2)->default(0);
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique('route_plan_id');
            $table->index('report_date');
            $table->index('collector_user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('collection_reports');
    }
};
