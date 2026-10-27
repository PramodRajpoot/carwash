<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Booking;
use App\Models\Franchisee;
use App\Models\ServicePackage;
use App\Models\Vehicle;
use Illuminate\Foundation\Testing\DatabaseTransactions;

class BookingDateAndCompletionTest extends TestCase
{
    use DatabaseTransactions;

    protected $customer;
    protected $admin;
    protected $franchiseeUser;
    protected $franchisee;
    protected $package;
    protected $vehicle;

    protected function setUp(): void
    {
        parent::setUp();

        $this->customer = User::create([
            'name' => 'Test Customer',
            'email' => 'cust_' . uniqid() . '@example.com',
            'password' => bcrypt('password'),
            'role' => 'customer',
        ]);

        $this->admin = User::create([
            'name' => 'Platform Admin',
            'email' => 'admin_' . uniqid() . '@example.com',
            'password' => bcrypt('password'),
            'role' => 'admin',
        ]);

        $this->franchiseeUser = User::create([
            'name' => 'Franchisee Manager',
            'email' => 'franchise_' . uniqid() . '@example.com',
            'password' => bcrypt('password'),
            'role' => 'franchisee',
        ]);

        $this->franchisee = Franchisee::create([
            'user_id' => $this->franchiseeUser->id,
            'center_name' => 'Test Wash Center',
            'city' => 'Noida',
            'address' => 'Sector 62',
            'phone' => '9876543210',
            'royalty_percentage' => 10.00,
            'status' => 'active',
        ]);

        $this->vehicle = Vehicle::create([
            'customer_id' => $this->customer->id,
            'make_model' => 'Maruti Swift',
            'vehicle_type' => 'hatchback',
            'plate_number' => 'UP16AB1234',
        ]);

        $this->package = ServicePackage::create([
            'name' => 'Standard Foam Wash',
            'vehicle_type' => 'hatchback',
            'price' => 499.00,
            'duration_minutes' => 45,
            'description' => 'Exterior foam wash and wipe',
            'status' => 'active',
        ]);
    }

    public function test_customer_can_create_booking_with_date_before_today()
    {
        $this->actingAs($this->customer, 'sanctum');

        $pastDate = '2026-10-01';

        $response = $this->postJson('/api/bookings', [
            'vehicle_id' => $this->vehicle->id,
            'franchisee_id' => $this->franchisee->id,
            'package_id' => $this->package->id,
            'booking_date' => $pastDate,
            'slot_time' => '09:00 AM - 11:00 AM',
            'address' => '123 Test Street, Noida',
            'payment_method' => 'cod',
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('bookings', [
            'customer_id' => $this->customer->id,
            'booking_date' => $pastDate,
            'status' => 'pending',
        ]);
    }

    public function test_completed_booking_cannot_be_postponed_by_customer()
    {
        $this->actingAs($this->customer, 'sanctum');

        $booking = Booking::create([
            'customer_id' => $this->customer->id,
            'vehicle_id' => $this->vehicle->id,
            'franchisee_id' => $this->franchisee->id,
            'package_id' => $this->package->id,
            'booking_date' => '2026-10-15',
            'slot_time' => '09:00 AM - 11:00 AM',
            'address' => '123 Test Street, Noida',
            'total_price' => 499.00,
            'status' => 'completed',
            'payment_status' => 'paid',
            'payment_method' => 'cod',
        ]);

        $response = $this->postJson("/api/bookings/{$booking->id}/postpone", [
            'booking_date' => '2026-10-27',
            'slot_time' => '11:00 AM - 01:00 PM',
        ]);

        $response->assertStatus(422);
        $this->assertEquals('Completed wash bookings cannot be edited or rescheduled.', $response->json('message'));
    }

    public function test_pending_booking_can_be_postponed_to_past_or_future_date()
    {
        $this->actingAs($this->customer, 'sanctum');

        $booking = Booking::create([
            'customer_id' => $this->customer->id,
            'vehicle_id' => $this->vehicle->id,
            'franchisee_id' => $this->franchisee->id,
            'package_id' => $this->package->id,
            'booking_date' => '2026-10-20',
            'slot_time' => '09:00 AM - 11:00 AM',
            'address' => '123 Test Street, Noida',
            'total_price' => 499.00,
            'status' => 'pending',
            'payment_status' => 'unpaid',
            'payment_method' => 'cod',
        ]);

        $newDate = '2026-10-05';
        $response = $this->postJson("/api/bookings/{$booking->id}/postpone", [
            'booking_date' => $newDate,
            'slot_time' => '01:00 PM - 03:00 PM',
        ]);

        $response->assertStatus(200);
        $booking->refresh();
        $this->assertEquals($newDate, $booking->booking_date);
        $this->assertEquals('postponed', $booking->status);
    }

    public function test_completed_booking_cannot_be_modified_by_admin()
    {
        $this->actingAs($this->admin, 'sanctum');

        $booking = Booking::create([
            'customer_id' => $this->customer->id,
            'vehicle_id' => $this->vehicle->id,
            'franchisee_id' => $this->franchisee->id,
            'package_id' => $this->package->id,
            'booking_date' => '2026-10-15',
            'slot_time' => '09:00 AM - 11:00 AM',
            'address' => '123 Test Street, Noida',
            'total_price' => 499.00,
            'status' => 'completed',
            'payment_status' => 'paid',
            'payment_method' => 'online',
        ]);

        $response = $this->putJson("/api/admin/orders/{$booking->id}", [
            'booking_date' => '2026-10-28',
            'status' => 'pending',
        ]);

        $response->assertStatus(422);
        $this->assertEquals('Completed or cancelled wash bookings cannot be edited.', $response->json('message'));
    }

    public function test_completed_booking_cannot_be_rescheduled_by_franchisee()
    {
        $this->actingAs($this->franchiseeUser, 'sanctum');

        $booking = Booking::create([
            'customer_id' => $this->customer->id,
            'vehicle_id' => $this->vehicle->id,
            'franchisee_id' => $this->franchisee->id,
            'package_id' => $this->package->id,
            'booking_date' => '2026-10-15',
            'slot_time' => '09:00 AM - 11:00 AM',
            'address' => '123 Test Street, Noida',
            'total_price' => 499.00,
            'status' => 'completed',
            'payment_status' => 'paid',
            'payment_method' => 'cod',
        ]);

        $response = $this->postJson("/api/franchisee/orders/{$booking->id}/reschedule", [
            'booking_date' => '2026-10-28',
            'slot_time' => '11:00 AM - 01:00 PM',
        ]);

        $response->assertStatus(422);
        $this->assertEquals('Completed or cancelled wash bookings cannot be edited or rescheduled.', $response->json('message'));
    }

    public function test_completed_booking_cannot_be_rescheduled_by_super_admin()
    {
        $superAdmin = User::create([
            'name' => 'Super Admin User',
            'email' => 'superadmin_' . uniqid() . '@example.com',
            'password' => bcrypt('password'),
            'role' => 'super_admin',
        ]);

        $this->actingAs($superAdmin, 'sanctum');

        $booking = Booking::create([
            'customer_id' => $this->customer->id,
            'vehicle_id' => $this->vehicle->id,
            'franchisee_id' => $this->franchisee->id,
            'package_id' => $this->package->id,
            'booking_date' => '2026-10-15',
            'slot_time' => '09:00 AM - 11:00 AM',
            'address' => '123 Test Street, Noida',
            'total_price' => 499.00,
            'status' => 'completed',
            'payment_status' => 'paid',
            'payment_method' => 'cod',
        ]);

        $response = $this->putJson("/api/super-admin/orders/{$booking->id}/reschedule", [
            'booking_date' => '2026-10-28',
            'slot_time' => '11:00 AM - 01:00 PM',
        ]);

        $response->assertStatus(422);
        $this->assertEquals('Completed or cancelled wash bookings cannot be edited or rescheduled.', $response->json('message'));
    }

    public function test_cancelled_booking_cannot_be_postponed_or_payment_method_changed_by_customer()
    {
        $this->actingAs($this->customer, 'sanctum');

        $booking = Booking::create([
            'customer_id' => $this->customer->id,
            'vehicle_id' => $this->vehicle->id,
            'franchisee_id' => $this->franchisee->id,
            'package_id' => $this->package->id,
            'booking_date' => '2026-10-15',
            'slot_time' => '09:00 AM - 11:00 AM',
            'address' => '123 Test Street, Noida',
            'total_price' => 499.00,
            'status' => 'cancelled',
            'payment_status' => 'unpaid',
            'payment_method' => 'online',
        ]);

        $rescheduleResp = $this->postJson("/api/bookings/{$booking->id}/postpone", [
            'booking_date' => '2026-10-28',
            'slot_time' => '11:00 AM - 01:00 PM',
        ]);
        $rescheduleResp->assertStatus(422);

        $paymentResp = $this->postJson("/api/bookings/{$booking->id}/payment-method", [
            'payment_method' => 'cod',
        ]);
        $paymentResp->assertStatus(400);
    }

    public function test_cancelled_booking_cannot_be_modified_by_admin()
    {
        $this->actingAs($this->admin, 'sanctum');

        $booking = Booking::create([
            'customer_id' => $this->customer->id,
            'vehicle_id' => $this->vehicle->id,
            'franchisee_id' => $this->franchisee->id,
            'package_id' => $this->package->id,
            'booking_date' => '2026-10-15',
            'slot_time' => '09:00 AM - 11:00 AM',
            'address' => '123 Test Street, Noida',
            'total_price' => 499.00,
            'status' => 'cancelled',
            'payment_status' => 'unpaid',
            'payment_method' => 'online',
        ]);

        $response = $this->putJson("/api/admin/orders/{$booking->id}", [
            'booking_date' => '2026-10-28',
            'status' => 'pending',
        ]);

        $response->assertStatus(422);
        $this->assertEquals('Completed or cancelled wash bookings cannot be edited.', $response->json('message'));
    }

    public function test_cancelled_or_completed_booking_cannot_be_updated_by_franchisee()
    {
        $this->actingAs($this->franchiseeUser, 'sanctum');

        $cancelledBooking = Booking::create([
            'customer_id' => $this->customer->id,
            'vehicle_id' => $this->vehicle->id,
            'franchisee_id' => $this->franchisee->id,
            'package_id' => $this->package->id,
            'booking_date' => '2026-10-15',
            'slot_time' => '09:00 AM - 11:00 AM',
            'address' => '123 Test Street, Noida',
            'total_price' => 499.00,
            'status' => 'cancelled',
            'payment_status' => 'unpaid',
            'payment_method' => 'cod',
        ]);

        $resp1 = $this->putJson("/api/franchisee/orders/{$cancelledBooking->id}/status", [
            'status' => 'assigned',
        ]);
        $resp1->assertStatus(422);

        $completedBooking = Booking::create([
            'customer_id' => $this->customer->id,
            'vehicle_id' => $this->vehicle->id,
            'franchisee_id' => $this->franchisee->id,
            'package_id' => $this->package->id,
            'booking_date' => '2026-10-15',
            'slot_time' => '09:00 AM - 11:00 AM',
            'address' => '123 Test Street, Noida',
            'total_price' => 499.00,
            'status' => 'completed',
            'payment_status' => 'paid',
            'payment_method' => 'cod',
        ]);

        $resp2 = $this->putJson("/api/franchisee/orders/{$completedBooking->id}/status", [
            'status' => 'ongoing',
        ]);
        $resp2->assertStatus(422);

        $resp3 = $this->postJson("/api/franchisee/orders/{$cancelledBooking->id}/reschedule", [
            'booking_date' => '2026-10-28',
            'slot_time' => '11:00 AM - 01:00 PM',
        ]);
        $resp3->assertStatus(422);
    }

    public function test_cancelled_or_completed_booking_cannot_be_edited_by_super_admin()
    {
        $superAdmin = User::create([
            'name' => 'Super Admin User 2',
            'email' => 'superadmin2_' . uniqid() . '@example.com',
            'password' => bcrypt('password'),
            'role' => 'super_admin',
        ]);

        $this->actingAs($superAdmin, 'sanctum');

        $cancelledBooking = Booking::create([
            'customer_id' => $this->customer->id,
            'vehicle_id' => $this->vehicle->id,
            'franchisee_id' => $this->franchisee->id,
            'package_id' => $this->package->id,
            'booking_date' => '2026-10-15',
            'slot_time' => '09:00 AM - 11:00 AM',
            'address' => '123 Test Street, Noida',
            'total_price' => 499.00,
            'status' => 'cancelled',
            'payment_status' => 'unpaid',
            'payment_method' => 'cod',
        ]);

        // Assign
        $assignResp = $this->putJson("/api/super-admin/orders/{$cancelledBooking->id}/assign", [
            'franchisee_id' => $this->franchisee->id,
        ]);
        $assignResp->assertStatus(422);

        // Reschedule
        $rescheduleResp = $this->putJson("/api/super-admin/orders/{$cancelledBooking->id}/reschedule", [
            'booking_date' => '2026-10-28',
            'slot_time' => '11:00 AM - 01:00 PM',
        ]);
        $rescheduleResp->assertStatus(422);

        // Change plan
        $planResp = $this->putJson("/api/super-admin/orders/{$cancelledBooking->id}/change-plan", [
            'package_id' => $this->package->id,
            'total_price' => 599.00,
        ]);
        $planResp->assertStatus(422);

        // Cancel again
        $cancelResp = $this->putJson("/api/super-admin/orders/{$cancelledBooking->id}/cancel");
        $cancelResp->assertStatus(422);
    }
}
