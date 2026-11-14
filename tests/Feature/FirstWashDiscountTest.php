<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Booking;
use App\Models\Franchisee;
use App\Models\ServicePackage;
use App\Models\Vehicle;
use App\Models\Coupon;
use Illuminate\Foundation\Testing\DatabaseTransactions;

class FirstWashDiscountTest extends TestCase
{
    use DatabaseTransactions;

    protected $customer;
    protected $franchisee;
    protected $franchiseeUser;
    protected $package;
    protected $vehicle;

    protected function setUp(): void
    {
        parent::setUp();

        $this->customer = User::create([
            'name' => 'First Time Customer',
            'email' => 'first_' . uniqid() . '@example.com',
            'password' => bcrypt('password'),
            'role' => 'customer',
            'status' => 'active',
            'e_points' => 50,
            'earning_money' => 100.00,
        ]);

        $this->franchiseeUser = User::create([
            'name' => 'Franchise Partner',
            'email' => 'fp_' . uniqid() . '@example.com',
            'password' => bcrypt('password'),
            'role' => 'franchisee',
        ]);

        $this->franchisee = Franchisee::create([
            'user_id' => $this->franchiseeUser->id,
            'center_name' => 'Doorstep Wash Hub',
            'address' => '456 Hub Road',
            'city' => 'Noida',
            'status' => 'active',
            'royalty_percentage' => 10,
        ]);

        $this->package = ServicePackage::create([
            'name' => 'Standard SUV Wash',
            'description' => 'Comprehensive SUV doorstep cleaning',
            'price' => 2000.00,
            'duration' => 60,
            'vehicle_type' => 'suv',
        ]);

        $this->vehicle = Vehicle::create([
            'customer_id' => $this->customer->id,
            'make_model' => 'Hyundai Creta',
            'plate_number' => 'DL01AB1234',
            'vehicle_type' => 'suv',
        ]);
    }

    public function test_customer_dashboard_indicates_first_wash_status()
    {
        $this->actingAs($this->customer, 'sanctum');

        $response = $this->getJson('/api/customer/dashboard');
        $response->assertStatus(200);

        $data = $response->json();
        $this->assertTrue($data['is_first_wash']);
        $this->assertFalse($data['has_completed_first_wash']);
        $this->assertEquals(0, $data['completed_washes_count']);
    }

    public function test_first_wash_gets_automatic_10_percent_discount_and_cannot_use_epoints_or_earning_money()
    {
        $this->actingAs($this->customer, 'sanctum');

        // Request includes use_epoints and use_earning_money, but on first wash, only 10% discount is applied!
        $response = $this->postJson('/api/bookings', [
            'vehicle_id' => $this->vehicle->id,
            'franchisee_id' => $this->franchisee->id,
            'package_id' => $this->package->id,
            'booking_date' => now()->addDay()->toDateString(),
            'slot_time' => '10:00 - 11:00',
            'payment_method' => 'online',
            'address' => '789 First Wash Lane, Delhi',
            'use_epoints' => true,
            'use_earning_money' => true,
        ]);

        $response->assertStatus(201);
        $data = $response->json();

        // Base price = 2000.00
        // 10% discount = 200.00 => Taxable subtotal = 1800.00
        // GST (18%) = 324.00 => Total = 2124.00
        $this->assertDatabaseHas('bookings', [
            'id' => $data['booking']['id'],
            'customer_id' => $this->customer->id,
            'coupon_code' => 'FIRSTWASH10',
            'coupon_discount' => 200.00,
            'epoints_used' => 0,
            'earning_money_used' => 0.00,
            'total_price' => 2124.00,
            'gst_amount' => 324.00,
        ]);

        // Points and earning money must remain untouched
        $this->customer->refresh();
        $this->assertEquals(50, $this->customer->e_points);
        $this->assertEquals(100.00, (float)$this->customer->earning_money);
    }

    public function test_first_wash_rejects_additional_coupons()
    {
        $this->actingAs($this->customer, 'sanctum');

        Coupon::create([
            'code' => 'EXTRA15',
            'discount_type' => 'percentage',
            'discount_value' => 15,
            'vehicle_type' => 'all',
            'status' => 'active',
        ]);

        $response = $this->postJson('/api/bookings/apply-coupon', [
            'code' => 'EXTRA15',
            'price' => 2000,
        ]);

        $response->assertStatus(400);
        $this->assertStringContainsString('First wash already includes 10% discount', $response->json('message'));
    }

    public function test_after_first_wash_is_completed_customer_can_use_epoints_and_earning_money()
    {
        // 1. First wash is completed
        $firstBooking = Booking::create([
            'customer_id' => $this->customer->id,
            'vehicle_id' => $this->vehicle->id,
            'franchisee_id' => $this->franchisee->id,
            'package_id' => $this->package->id,
            'booking_date' => now()->subDay()->toDateString(),
            'slot_time' => '10:00 - 11:00',
            'status' => 'completed',
            'payment_method' => 'online',
            'payment_status' => 'paid',
            'coupon_code' => 'FIRSTWASH10',
            'coupon_discount' => 200.00,
            'total_price' => 2124.00,
            'gst_amount' => 324.00,
        ]);

        $this->actingAs($this->customer, 'sanctum');

        // Dashboard now reflects completed wash
        $dashResponse = $this->getJson('/api/customer/dashboard');
        $dashData = $dashResponse->json();
        $this->assertFalse($dashData['is_first_wash']);
        $this->assertTrue($dashData['has_completed_first_wash']);
        $this->assertEquals(1, $dashData['completed_washes_count']);

        // 2. Book 2nd wash: customer can now use both E-Points (50 pts) AND Earning Money (100.00)!
        $response = $this->postJson('/api/bookings', [
            'vehicle_id' => $this->vehicle->id,
            'franchisee_id' => $this->franchisee->id,
            'package_id' => $this->package->id,
            'booking_date' => now()->addDay()->toDateString(),
            'slot_time' => '11:00 - 12:00',
            'payment_method' => 'online',
            'address' => '789 Second Wash Lane, Delhi',
            'use_epoints' => true,
            'use_earning_money' => true,
        ]);

        $response->assertStatus(201);
        $data = $response->json();

        // Base price = 2000.00
        // E-Points max allowed (12.5% of 2000 = 250, user has 50) => 50 deducted => price = 1950.00
        // Earning Money used = min(100, 1950) = 100 => price = 1850.00
        // GST (18%) on 1850.00 = 333.00 => Total = 2183.00
        $this->assertDatabaseHas('bookings', [
            'id' => $data['booking']['id'],
            'customer_id' => $this->customer->id,
            'epoints_used' => 50,
            'earning_money_used' => 100.00,
            'total_price' => 2183.00,
            'gst_amount' => 333.00,
        ]);

        $this->customer->refresh();
        $this->assertEquals(0, $this->customer->e_points);
        $this->assertEquals(0.00, (float)$this->customer->earning_money);
    }

    public function test_when_first_wash_has_paid_advance_slot_is_booked_and_second_wash_cannot_take_first_discount()
    {
        // 1. First wash has paid ₹99 slot advance (partially_paid)
        $firstBooking = Booking::create([
            'customer_id' => $this->customer->id,
            'vehicle_id' => $this->vehicle->id,
            'franchisee_id' => $this->franchisee->id,
            'package_id' => $this->package->id,
            'booking_date' => now()->addDay()->toDateString(),
            'slot_time' => '10:00 - 11:00',
            'status' => 'pending',
            'payment_method' => 'online',
            'payment_status' => 'partially_paid',
            'paid_amount' => 99.00,
            'coupon_code' => 'FIRSTWASH10',
            'coupon_discount' => 200.00,
            'total_price' => 2124.00,
            'gst_amount' => 324.00,
        ]);

        $this->actingAs($this->customer, 'sanctum');

        // Dashboard indicates customer has taken first wash discount (is_first_wash = false, can_use_points = true)
        // and upcoming_services contains this wash
        $dashResponse = $this->getJson('/api/customer/dashboard');
        $dashData = $dashResponse->json();
        $this->assertFalse($dashData['is_first_wash']);
        $this->assertTrue($dashData['can_use_points']);
        $this->assertCount(1, $dashData['upcoming_services']);

        // Coupon application is now allowed (not blocked by first wash restriction)
        Coupon::create([
            'code' => 'SAVE50',
            'discount_type' => 'fixed',
            'discount_value' => 50,
            'vehicle_type' => 'all',
            'status' => 'active',
        ]);
        $couponCheck = $this->postJson('/api/bookings/apply-coupon', [
            'code' => 'SAVE50',
            'price' => 2000,
        ]);
        $couponCheck->assertStatus(200);

        // 2. Book 2nd wash while first wash is still pending:
        // Customer does NOT get 10% discount again, and CAN use E-Points and Earning Money!
        $response = $this->postJson('/api/bookings', [
            'vehicle_id' => $this->vehicle->id,
            'franchisee_id' => $this->franchisee->id,
            'package_id' => $this->package->id,
            'booking_date' => now()->addDays(2)->toDateString(),
            'slot_time' => '14:00 - 15:00',
            'payment_method' => 'online',
            'address' => '789 Second Wash Lane, Delhi',
            'use_epoints' => true,
            'use_earning_money' => true,
        ]);

        $response->assertStatus(201);
        $data = $response->json();

        // Must NOT have FIRSTWASH10 coupon
        $this->assertNotEquals('FIRSTWASH10', $data['booking']['coupon_code']);
        // Must use E-Points and Earning Money
        $this->assertEquals(50, $data['booking']['epoints_used']);
        $this->assertEquals(100.00, (float)$data['booking']['earning_money_used']);
    }

    public function test_unpaid_pending_booking_does_not_consume_first_wash_discount_and_is_not_in_wash_list()
    {
        // 1. Customer initiates a booking but does NOT pay (paid_amount = 0, pending_payment, slot not booked)
        $unpaidBooking = Booking::create([
            'customer_id' => $this->customer->id,
            'vehicle_id' => $this->vehicle->id,
            'franchisee_id' => $this->franchisee->id,
            'package_id' => $this->package->id,
            'booking_date' => now()->addDay()->toDateString(),
            'slot_time' => '10:00 - 11:00',
            'status' => 'pending',
            'payment_method' => 'online',
            'payment_status' => 'pending_payment',
            'paid_amount' => 0.00,
            'total_price' => 2124.00,
            'gst_amount' => 324.00,
        ]);

        $this->actingAs($this->customer, 'sanctum');

        // Dashboard must still show is_first_wash = true because slot was never appointed and 99/full was never paid
        // And the Wash List (upcoming_services) must NOT display the unpaid booking!
        $dashResponse = $this->getJson('/api/customer/dashboard');
        $dashData = $dashResponse->json();
        $this->assertTrue($dashData['is_first_wash']);
        $this->assertFalse($dashData['can_use_points']);
        $this->assertCount(0, $dashData['upcoming_services']);

        // When placing a booking, customer STILL gets 10% first wash discount!
        $response = $this->postJson('/api/bookings', [
            'vehicle_id' => $this->vehicle->id,
            'franchisee_id' => $this->franchisee->id,
            'package_id' => $this->package->id,
            'booking_date' => now()->addDays(2)->toDateString(),
            'slot_time' => '14:00 - 15:00',
            'payment_method' => 'online',
            'address' => '789 Real Booking Lane, Delhi',
        ]);

        $response->assertStatus(201);
        $data = $response->json();
        $this->assertEquals('FIRSTWASH10', $data['booking']['coupon_code']);
        $this->assertEquals(200.00, (float)$data['booking']['coupon_discount']);
    }
}
