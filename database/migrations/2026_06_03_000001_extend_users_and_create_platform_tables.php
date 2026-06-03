<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Extend users table with E-Points wallet fields
        Schema::table('users', function (Blueprint $table) {
            $table->unsignedBigInteger('e_points')->default(0)->after('reward_coins');
            $table->unsignedBigInteger('pending_epoints')->default(0)->after('e_points');
            $table->boolean('first_booking_discount')->default(false)->after('pending_epoints');
        });

        // 2. Wallet Transactions
        Schema::create('wallet_transactions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->string('type'); // credit, debit
            $table->unsignedBigInteger('amount');
            $table->string('source'); // referral, booking, redeem, admin, coupon
            $table->string('status')->default('confirmed'); // confirmed, pending
            $table->text('description')->nullable();
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        });

        // 3. Support Tickets
        Schema::create('support_tickets', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('customer_id');
            $table->string('subject');
            $table->text('body');
            $table->string('status')->default('open'); // open, in_progress, closed
            $table->text('admin_reply')->nullable();
            $table->timestamp('replied_at')->nullable();
            $table->timestamps();

            $table->foreign('customer_id')->references('id')->on('users')->onDelete('cascade');
        });

        // 4. Feedback & Reviews
        Schema::create('feedback_reviews', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('booking_id');
            $table->unsignedBigInteger('customer_id');
            $table->unsignedTinyInteger('rating'); // 1-5
            $table->text('comment')->nullable();
            $table->string('image_path')->nullable();
            $table->string('video_path')->nullable();
            $table->timestamps();

            $table->foreign('booking_id')->references('id')->on('bookings')->onDelete('cascade');
            $table->foreign('customer_id')->references('id')->on('users')->onDelete('cascade');
        });

        // 5. Notifications Log
        Schema::create('notifications_log', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->string('type'); // booking_confirmed, service_reminder, subscription_expiry, referral_reward, wallet_credit, coupon, royalty_due
            $table->string('title');
            $table->text('body');
            $table->timestamp('read_at')->nullable();
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        });

        // 6. Blog Posts
        Schema::create('blog_posts', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('author_id');
            $table->string('title');
            $table->string('slug')->unique();
            $table->text('content');
            $table->string('featured_image')->nullable();
            $table->string('status')->default('draft'); // draft, published
            $table->timestamp('published_at')->nullable();
            $table->timestamps();

            $table->foreign('author_id')->references('id')->on('users')->onDelete('cascade');
        });

        // 7. Royalty Payments
        Schema::create('royalty_payments', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('franchisee_id');
            $table->decimal('amount', 10, 2);
            $table->date('due_date');
            $table->string('status')->default('pending'); // pending, paid, overdue
            $table->date('paid_date')->nullable();
            $table->timestamps();

            $table->foreign('franchisee_id')->references('id')->on('franchisees')->onDelete('cascade');
        });

        // 8. Platform Settings (key-value store for super admin)
        Schema::create('platform_settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->text('value')->nullable();
            $table->string('group')->default('general');
            $table->string('label')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['e_points', 'pending_epoints', 'first_booking_discount']);
        });
        Schema::dropIfExists('platform_settings');
        Schema::dropIfExists('royalty_payments');
        Schema::dropIfExists('blog_posts');
        Schema::dropIfExists('notifications_log');
        Schema::dropIfExists('feedback_reviews');
        Schema::dropIfExists('support_tickets');
        Schema::dropIfExists('wallet_transactions');
    }
};
