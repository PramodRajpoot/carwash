<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\Franchisee;
use App\Models\Vehicle;
use App\Models\ServicePackage;
use App\Models\Subscription;
use App\Models\Booking;
use App\Models\Slot;
use App\Models\Expense;
use App\Models\Coupon;
use App\Models\Wishlist;
use Carbon\Carbon;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Seed Users
        $superAdmin = User::create([
            'name' => 'Super Admin',
            'email' => 'superadmin@carwash.com',
            'phone' => '9999999991',
            'password' => Hash::make('password'),
            'role' => 'super_admin',
            'status' => 'active',
        ]);

        $admin = User::create([
            'name' => 'Customer Care Admin',
            'email' => 'admin@carwash.com',
            'phone' => '9999999992',
            'password' => Hash::make('password'),
            'role' => 'admin',
            'status' => 'active',
        ]);

        $franchiseeUser = User::create([
            'name' => 'John Franchisee',
            'email' => 'franchisee@carwash.com',
            'phone' => '9999999993',
            'password' => Hash::make('password'),
            'role' => 'franchisee',
            'status' => 'active',
        ]);

        $customerUser = User::create([
            'name' => 'David Customer',
            'email' => 'customer@carwash.com',
            'phone' => '9999999994',
            'password' => Hash::make('password'),
            'role' => 'customer',
            'status' => 'active',
            'referral_code' => 'DAVID100',
            'referral_coins' => 500,
            'reward_coins' => 250,
        ]);

        // 2. Seed Franchisee Details
        $franchisee = Franchisee::create([
            'user_id' => $franchiseeUser->id,
            'center_name' => 'Hydro Cleaners, Mumbai',
            'address' => 'Linking Road, Bandra West',
            'city' => 'Mumbai',
            'latitude' => 19.0596,
            'longitude' => 72.8295,
            'royalty_percentage' => 10.0,
            'status' => 'active',
        ]);

        // 3. Seed Service Packages
        $pkg1 = ServicePackage::create([
            'name' => 'Eco Hatchback Wash',
            'description' => 'Exterior waterless foam wash, tire dressing, and vacuuming.',
            'vehicle_type' => 'hatchback',
            'price' => 299.00,
            'frequency_days' => 0,
            'max_bookings' => 1,
        ]);

        $pkg2 = ServicePackage::create([
            'name' => 'Premium Hatchback Monthly',
            'description' => '4 detailed foam washes per month, deep interior vacuuming, dashboard polish.',
            'vehicle_type' => 'hatchback',
            'price' => 999.00,
            'frequency_days' => 30,
            'max_bookings' => 4,
        ]);

        $pkg3 = ServicePackage::create([
            'name' => 'Eco Sedan Wash',
            'description' => 'Eco-friendly waterless pressure wash, interior vacuuming and perfume spray.',
            'vehicle_type' => 'sedan',
            'price' => 399.00,
            'frequency_days' => 0,
            'max_bookings' => 1,
        ]);

        $pkg4 = ServicePackage::create([
            'name' => 'Premium Sedan Monthly',
            'description' => '4 complete detailing washes, wax coating, deep carpet vacuuming and glass cleaning.',
            'vehicle_type' => 'sedan',
            'price' => 1299.00,
            'frequency_days' => 30,
            'max_bookings' => 4,
        ]);

        $pkg5 = ServicePackage::create([
            'name' => 'Eco SUV Wash',
            'description' => 'Pressure wash, mud removal, underbody spray, vacuuming and tire glaze.',
            'vehicle_type' => 'suv',
            'price' => 499.00,
            'frequency_days' => 0,
            'max_bookings' => 1,
        ]);

        $pkg6 = ServicePackage::create([
            'name' => 'Premium SUV Monthly',
            'description' => '4 premium underbody & exterior washes, complete leather conditioning, and wheel detailing.',
            'vehicle_type' => 'suv',
            'price' => 1499.00,
            'frequency_days' => 30,
            'max_bookings' => 4,
        ]);

        $pkg7 = ServicePackage::create([
            'name' => 'Eco Commercial Wash',
            'description' => 'High-efficiency pressure wash for light commercial vans, cabin dusting, outer cleaning.',
            'vehicle_type' => 'commercial',
            'price' => 699.00,
            'frequency_days' => 0,
            'max_bookings' => 1,
        ]);

        $pkg8 = ServicePackage::create([
            'name' => 'Bus Wash Standard',
            'description' => 'Heavy duty exterior pressure wash, wheels wash, and basic windows spray.',
            'vehicle_type' => 'bus',
            'price' => 1499.00,
            'frequency_days' => 0,
            'max_bookings' => 1,
        ]);

        $pkg9 = ServicePackage::create([
            'name' => 'Volvo Bus Luxury Wash',
            'description' => 'Detailed multi-stage pressure wash, windshield buffing, side panel wax coating, interior deodorizing.',
            'vehicle_type' => 'volvo_bus',
            'price' => 2499.00,
            'frequency_days' => 0,
            'max_bookings' => 1,
        ]);

        // 4. Seed Vehicles
        $vehicle1 = Vehicle::create([
            'customer_id' => $customerUser->id,
            'vehicle_type' => 'suv',
            'make_model' => 'Toyota Fortuner (Black)',
            'plate_number' => 'MH-01-AB-1234',
        ]);

        $vehicle2 = Vehicle::create([
            'customer_id' => $customerUser->id,
            'vehicle_type' => 'hatchback',
            'make_model' => 'Hyundai i20 (White)',
            'plate_number' => 'MH-01-CD-5678',
        ]);

        // 5. Seed Subscriptions
        $subscription = Subscription::create([
            'customer_id' => $customerUser->id,
            'package_id' => $pkg6->id,
            'status' => 'active',
            'booking_count' => 1,
            'starts_at' => Carbon::now()->subDays(5),
            'expires_at' => Carbon::now()->addDays(25),
        ]);

        // 6. Seed Slots for next 5 days
        $slotsData = [
            '09:00 AM - 11:00 AM',
            '11:00 AM - 01:00 PM',
            '01:00 PM - 03:00 PM',
            '03:00 PM - 05:00 PM'
        ];

        for ($i = 0; $i < 5; $i++) {
            $date = Carbon::today()->addDays($i);
            foreach ($slotsData as $time) {
                Slot::create([
                    'franchisee_id' => $franchisee->id,
                    'date' => $date->toDateString(),
                    'time_range' => $time,
                    'max_bookings' => 3,
                    'current_bookings' => ($i == 0 && $time == '11:00 AM - 01:00 PM') ? 1 : 0, // Booked count
                ]);
            }
        }

        // 7. Seed Bookings
        // Past Completed Booking (Subscription-based)
        Booking::create([
            'customer_id' => $customerUser->id,
            'vehicle_id' => $vehicle1->id,
            'franchisee_id' => $franchisee->id,
            'package_id' => $pkg6->id,
            'booking_date' => Carbon::today()->subDays(5)->toDateString(),
            'slot_time' => '11:00 AM - 01:00 PM',
            'status' => 'completed',
            'payment_status' => 'paid',
            'payment_method' => 'subscription',
            'total_price' => 0.00,
        ]);

        // Past Completed Booking (COD-based)
        Booking::create([
            'customer_id' => $customerUser->id,
            'vehicle_id' => $vehicle2->id,
            'franchisee_id' => $franchisee->id,
            'package_id' => $pkg1->id,
            'booking_date' => Carbon::today()->subDays(10)->toDateString(),
            'slot_time' => '03:00 PM - 05:00 PM',
            'status' => 'completed',
            'payment_status' => 'paid',
            'payment_method' => 'cod',
            'total_price' => 299.00,
        ]);

        // Upcoming Booking (Subscription-based, scheduled for tomorrow)
        Booking::create([
            'customer_id' => $customerUser->id,
            'vehicle_id' => $vehicle1->id,
            'franchisee_id' => $franchisee->id,
            'package_id' => $pkg6->id,
            'booking_date' => Carbon::today()->addDay()->toDateString(),
            'slot_time' => '09:00 AM - 11:00 AM',
            'status' => 'assigned',
            'payment_status' => 'paid',
            'payment_method' => 'subscription',
            'total_price' => 0.00,
        ]);

        // 8. Seed Expenses
        Expense::create([
            'franchisee_id' => $franchisee->id,
            'category' => 'salary',
            'amount' => 12000.00,
            'description' => 'Monthly salary paid to Washer Amit',
            'expense_date' => Carbon::today()->subDays(2)->toDateString(),
        ]);

        Expense::create([
            'franchisee_id' => $franchisee->id,
            'category' => 'chemical',
            'amount' => 3500.00,
            'description' => 'Chemical wax shampoo refill pack (50L)',
            'expense_date' => Carbon::today()->subDays(4)->toDateString(),
        ]);

        Expense::create([
            'franchisee_id' => $franchisee->id,
            'category' => 'maintenance',
            'amount' => 1200.00,
            'description' => 'Pressure motor pump servicing and oil change',
            'expense_date' => Carbon::today()->subDays(7)->toDateString(),
        ]);

        // 9. Seed Coupons
        Coupon::create([
            'code' => 'WELCOME10',
            'discount_type' => 'percentage',
            'discount_value' => 10.00,
            'expires_at' => Carbon::today()->addMonth(),
            'status' => 'active',
        ]);

        Coupon::create([
            'code' => 'CLEAN50',
            'discount_type' => 'fixed',
            'discount_value' => 50.00,
            'expires_at' => Carbon::today()->addMonth(),
            'status' => 'active',
        ]);

        // 10. Seed Wishlists
        Wishlist::create([
            'customer_id' => $customerUser->id,
            'package_id' => $pkg2->id,
        ]);
    }
}
