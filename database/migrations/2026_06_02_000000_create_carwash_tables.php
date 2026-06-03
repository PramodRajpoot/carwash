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
        // 1. Franchisees
        Schema::create('franchisees', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->string('center_name');
            $table->string('address');
            $table->string('city');
            $table->decimal('latitude', 10, 8)->nullable();
            $table->decimal('longitude', 11, 8)->nullable();
            $table->decimal('royalty_percentage', 5, 2)->default(10.00);
            $table->string('status')->default('active'); // active, pending, inactive
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        });

        // 2. Vehicles
        Schema::create('vehicles', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('customer_id');
            $table->string('vehicle_type'); // hatchback, sedan, suv, commercial, bus, volvo_bus
            $table->string('make_model');
            $table->string('plate_number');
            $table->timestamps();

            $table->foreign('customer_id')->references('id')->on('users')->onDelete('cascade');
        });

        // 3. Service Packages
        Schema::create('service_packages', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('vehicle_type'); // hatchback, sedan, suv, commercial, bus, volvo_bus
            $table->decimal('price', 10, 2);
            $table->integer('frequency_days')->default(30); // 30 for monthly package, 0 for one-time
            $table->integer('max_bookings')->default(4); // e.g. 4 washes
            $table->timestamps();
        });

        // 4. Subscriptions
        Schema::create('subscriptions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('customer_id');
            $table->unsignedBigInteger('package_id');
            $table->string('status')->default('active'); // active, expired, cancelled
            $table->integer('booking_count')->default(0);
            $table->timestamp('starts_at')->useCurrent();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();

            $table->foreign('customer_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('package_id')->references('id')->on('service_packages')->onDelete('cascade');
        });

        // 5. Bookings
        Schema::create('bookings', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('customer_id');
            $table->unsignedBigInteger('vehicle_id');
            $table->unsignedBigInteger('franchisee_id')->nullable();
            $table->unsignedBigInteger('package_id')->nullable(); // nullable for custom single service
            $table->date('booking_date');
            $table->string('slot_time'); // "09:00 AM - 11:00 AM", etc.
            $table->string('status')->default('pending'); // pending, assigned, ongoing, completed, cancelled, postponed
            $table->string('payment_status')->default('unpaid'); // unpaid, paid
            $table->string('payment_method')->default('cod'); // online, cod, subscription
            $table->decimal('total_price', 10, 2)->default(0.00);
            $table->timestamps();

            $table->foreign('customer_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('vehicle_id')->references('id')->on('vehicles')->onDelete('cascade');
            $table->foreign('franchisee_id')->references('id')->on('franchisees')->onDelete('set null');
            $table->foreign('package_id')->references('id')->on('service_packages')->onDelete('set null');
        });

        // 6. Slots (Schedules per center)
        Schema::create('slots', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('franchisee_id');
            $table->date('date');
            $table->string('time_range'); // "09:00 AM - 11:00 AM"
            $table->integer('max_bookings')->default(3);
            $table->integer('current_bookings')->default(0);
            $table->timestamps();

            $table->foreign('franchisee_id')->references('id')->on('franchisees')->onDelete('cascade');
        });

        // 7. Expenses
        Schema::create('expenses', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('franchisee_id');
            $table->string('category'); // salary, chemical, maintenance, other
            $table->decimal('amount', 10, 2);
            $table->text('description')->nullable();
            $table->date('expense_date');
            $table->timestamps();

            $table->foreign('franchisee_id')->references('id')->on('franchisees')->onDelete('cascade');
        });

        // 8. Coupons
        Schema::create('coupons', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('discount_type'); // fixed, percentage
            $table->decimal('discount_value', 10, 2);
            $table->date('expires_at')->nullable();
            $table->string('status')->default('active'); // active, expired
            $table->timestamps();
        });

        // 9. Wishlists
        Schema::create('wishlists', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('customer_id');
            $table->unsignedBigInteger('package_id');
            $table->timestamps();

            $table->foreign('customer_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('package_id')->references('id')->on('service_packages')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('wishlists');
        Schema::dropIfExists('coupons');
        Schema::dropIfExists('expenses');
        Schema::dropIfExists('slots');
        Schema::dropIfExists('bookings');
        Schema::dropIfExists('subscriptions');
        Schema::dropIfExists('service_packages');
        Schema::dropIfExists('vehicles');
        Schema::dropIfExists('franchisees');
    }
};
