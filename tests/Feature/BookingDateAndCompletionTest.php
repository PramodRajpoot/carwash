<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Booking;
use App\Models\Franchisee;
use App\Models\ServicePackage;
use App\Models\Vehicle;
use App\Models\Washer;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

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

    public function test_washer_cannot_complete_wash_without_photos_video_and_review()
    {
        Storage::fake('public');

        $washerUser = User::create([
            'name' => 'Test Washer',
            'email' => 'washer_test_' . uniqid() . '@example.com',
            'password' => bcrypt('password'),
            'role' => 'washer',
        ]);

        $washer = Washer::create([
            'user_id' => $washerUser->id,
            'franchisee_id' => $this->franchisee->id,
            'status' => 'active',
        ]);

        $this->actingAs($washerUser, 'sanctum');

        $booking = Booking::create([
            'customer_id' => $this->customer->id,
            'vehicle_id' => $this->vehicle->id,
            'franchisee_id' => $this->franchisee->id,
            'washer_id' => $washer->id,
            'package_id' => $this->package->id,
            'booking_date' => '2026-10-27',
            'slot_time' => '09:00 AM - 11:00 AM',
            'address' => 'Connaught Place, Delhi',
            'total_price' => 499.00,
            'status' => 'ongoing',
            'payment_status' => 'paid',
            'payment_method' => 'online',
        ]);

        // Attempt completion with empty payload
        $response = $this->postJson("/api/washer/tasks/{$booking->id}/status", [
            'status' => 'completed',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['review', 'photos', 'video']);
    }

    public function test_washer_successfully_completes_wash_with_photos_video_and_review()
    {
        Storage::fake('public');

        $washerUser = User::create([
            'name' => 'Test Washer 2',
            'email' => 'washer_test2_' . uniqid() . '@example.com',
            'password' => bcrypt('password'),
            'role' => 'washer',
        ]);

        $washer = Washer::create([
            'user_id' => $washerUser->id,
            'franchisee_id' => $this->franchisee->id,
            'status' => 'active',
        ]);

        $this->actingAs($washerUser, 'sanctum');

        $booking = Booking::create([
            'customer_id' => $this->customer->id,
            'vehicle_id' => $this->vehicle->id,
            'franchisee_id' => $this->franchisee->id,
            'washer_id' => $washer->id,
            'package_id' => $this->package->id,
            'booking_date' => '2026-10-27',
            'slot_time' => '09:00 AM - 11:00 AM',
            'address' => 'Connaught Place, Delhi',
            'total_price' => 499.00,
            'status' => 'ongoing',
            'payment_status' => 'paid',
            'payment_method' => 'online',
        ]);

        $photo1 = UploadedFile::fake()->image('exterior_clean.jpg');
        $photo2 = UploadedFile::fake()->image('interior_clean.jpg');
        $video  = UploadedFile::fake()->create('walkaround_clean.mp4', 1024, 'video/mp4');

        $response = $this->post("/api/washer/tasks/{$booking->id}/complete", [
            'status' => 'completed',
            'review' => 'Complete foam wash and interior sanitization done. Wheels dressed and glass polished.',
            'photos' => [$photo1, $photo2],
            'video'  => $video,
        ]);

        $response->assertStatus(200);

        $booking->refresh();
        $this->assertEquals('completed', $booking->status);
        $this->assertNotNull($booking->washer_review);
        $this->assertStringContainsString('Complete foam wash', $booking->washer_review);
        $this->assertIsArray($booking->service_photos);
        $this->assertCount(2, $booking->service_photos);
        $this->assertNotNull($booking->service_video);
        $this->assertStringContainsString('/storage/service_proofs/videos/', $booking->service_video);
    }

    public function test_franchisee_washers_list_returns_only_active_washers_for_center()
    {
        // Active washer in this franchisee
        $activeUser = User::create([
            'name' => 'Active Washer',
            'email' => 'active_w_' . uniqid() . '@example.com',
            'password' => bcrypt('password'),
            'role' => 'washer',
            'status' => 'active',
        ]);
        $activeWasher = Washer::create([
            'user_id' => $activeUser->id,
            'franchisee_id' => $this->franchisee->id,
            'status' => 'active',
        ]);

        // Inactive washer in this franchisee
        $inactiveUser = User::create([
            'name' => 'Inactive Washer',
            'email' => 'inactive_w_' . uniqid() . '@example.com',
            'password' => bcrypt('password'),
            'role' => 'washer',
            'status' => 'inactive',
        ]);
        $inactiveWasher = Washer::create([
            'user_id' => $inactiveUser->id,
            'franchisee_id' => $this->franchisee->id,
            'status' => 'inactive',
        ]);

        // Washer in another franchisee
        $otherFranchiseeUser = User::create([
            'name' => 'Other Fran',
            'email' => 'other_f_' . uniqid() . '@example.com',
            'password' => bcrypt('password'),
            'role' => 'franchisee',
            'status' => 'active',
        ]);
        $otherFranchisee = Franchisee::create([
            'user_id' => $otherFranchiseeUser->id,
            'center_name' => 'Other Center',
            'address' => '123 Other Street',
            'city' => 'Delhi',
            'royalty_percentage' => 10.0,
            'status' => 'active',
        ]);
        $otherWasherUser = User::create([
            'name' => 'Other Washer',
            'email' => 'other_w_' . uniqid() . '@example.com',
            'password' => bcrypt('password'),
            'role' => 'washer',
            'status' => 'active',
        ]);
        $otherWasher = Washer::create([
            'user_id' => $otherWasherUser->id,
            'franchisee_id' => $otherFranchisee->id,
            'status' => 'active',
        ]);

        $this->actingAs($this->franchiseeUser, 'sanctum');

        $response = $this->getJson('/api/franchisee/washers?status=active');
        $response->assertStatus(200);

        $washerIds = collect($response->json())->pluck('id')->all();
        $this->assertContains($activeWasher->id, $washerIds);
        $this->assertNotContains($inactiveWasher->id, $washerIds);
        $this->assertNotContains($otherWasher->id, $washerIds);
    }

    public function test_franchisee_cannot_assign_inactive_washer_or_washer_from_other_center()
    {
        $inactiveUser = User::create([
            'name' => 'Inactive Guy',
            'email' => 'inact_' . uniqid() . '@example.com',
            'password' => bcrypt('password'),
            'role' => 'washer',
            'status' => 'inactive',
        ]);
        $inactiveWasher = Washer::create([
            'user_id' => $inactiveUser->id,
            'franchisee_id' => $this->franchisee->id,
            'status' => 'inactive',
        ]);

        $booking = Booking::create([
            'customer_id'   => $this->customer->id,
            'vehicle_id'    => $this->vehicle->id,
            'franchisee_id' => $this->franchisee->id,
            'package_id'    => $this->package->id,
            'booking_date'  => '2026-10-27',
            'slot_time'     => '09:00 AM - 11:00 AM',
            'address'       => 'Test Address',
            'status'        => 'pending',
            'payment_status'=> 'paid',
            'total_price'   => 500,
        ]);

        $this->actingAs($this->franchiseeUser, 'sanctum');

        // Attempt assigning via orders/{id}/status
        $response = $this->putJson("/api/franchisee/orders/{$booking->id}/status", [
            'status'    => 'pending',
            'washer_id' => $inactiveWasher->id,
        ]);
        $response->assertStatus(422);

        // Attempt assigning via orders/{id}/assign-washer
        $response2 = $this->postJson("/api/franchisee/orders/{$booking->id}/assign-washer", [
            'washer_id' => $inactiveWasher->id,
        ]);
        $response2->assertStatus(422);
    }

    public function test_franchisee_successfully_assigns_active_washer_to_order()
    {
        $activeUser = User::create([
            'name' => 'Active Tech',
            'email' => 'tech_' . uniqid() . '@example.com',
            'password' => bcrypt('password'),
            'role' => 'washer',
            'status' => 'active',
        ]);
        $activeWasher = Washer::create([
            'user_id' => $activeUser->id,
            'franchisee_id' => $this->franchisee->id,
            'status' => 'active',
        ]);

        $booking = Booking::create([
            'customer_id'   => $this->customer->id,
            'vehicle_id'    => $this->vehicle->id,
            'franchisee_id' => $this->franchisee->id,
            'package_id'    => $this->package->id,
            'booking_date'  => '2026-10-27',
            'slot_time'     => '09:00 AM - 11:00 AM',
            'address'       => 'Test Address',
            'status'        => 'pending',
            'payment_status'=> 'paid',
            'total_price'   => 500,
        ]);

        $this->actingAs($this->franchiseeUser, 'sanctum');

        $response = $this->putJson("/api/franchisee/orders/{$booking->id}/status", [
            'status'    => 'assigned',
            'washer_id' => $activeWasher->id,
        ]);
        $response->assertStatus(200);

        $booking->refresh();
        $this->assertEquals($activeWasher->id, $booking->washer_id);
    }

    public function test_washer_completes_wash_with_cash_collected()
    {
        Storage::fake('public');

        $washerUser = User::create([
            'name'     => 'Cash Washer',
            'email'    => 'cash_w_' . uniqid() . '@example.com',
            'password' => bcrypt('password'),
            'role'     => 'washer',
            'status'   => 'active',
        ]);
        $washer = Washer::create([
            'user_id'       => $washerUser->id,
            'franchisee_id' => $this->franchisee->id,
            'status'        => 'active',
        ]);

        $booking = Booking::create([
            'customer_id'    => $this->customer->id,
            'vehicle_id'     => $this->vehicle->id,
            'franchisee_id'  => $this->franchisee->id,
            'washer_id'      => $washer->id,
            'package_id'     => $this->package->id,
            'booking_date'   => '2026-10-27',
            'slot_time'      => '09:00 AM - 11:00 AM',
            'address'        => 'Test Address',
            'status'         => 'ongoing',
            'payment_status' => 'unpaid',
            'payment_method' => 'cod',
            'total_price'    => 600,
            'paid_amount'    => 0,
        ]);

        $this->actingAs($washerUser, 'sanctum');

        $photo = UploadedFile::fake()->image('wash.jpg');
        $video = UploadedFile::fake()->create('clip.mp4', 500, 'video/mp4');

        $response = $this->post("/api/washer/tasks/{$booking->id}/complete", [
            'status'         => 'completed',
            'review'         => 'Vehicle cleaned thoroughly and cash received.',
            'photos'         => [$photo],
            'video'          => $video,
            'cash_collected' => 1,
        ]);

        $response->assertStatus(200);

        $booking->refresh();
        $this->assertEquals('completed', $booking->status);
        $this->assertEquals('paid', $booking->payment_status);
        $this->assertEquals(600, $booking->paid_amount);
    }

    public function test_franchisee_approves_order_as_completed()
    {
        $booking = Booking::create([
            'customer_id'    => $this->customer->id,
            'vehicle_id'     => $this->vehicle->id,
            'franchisee_id'  => $this->franchisee->id,
            'package_id'     => $this->package->id,
            'booking_date'   => '2026-10-27',
            'slot_time'      => '09:00 AM - 11:00 AM',
            'address'        => 'Test Address',
            'status'         => 'ongoing',
            'payment_status' => 'paid',
            'total_price'    => 500,
            'service_photos' => ['/storage/service_proofs/photos/test.jpg'],
            'service_video'  => '/storage/service_proofs/videos/test.mp4',
            'washer_review'  => 'Done properly',
        ]);

        $this->actingAs($this->franchiseeUser, 'sanctum');

        $response = $this->putJson("/api/franchisee/orders/{$booking->id}/status", [
            'status'         => 'completed',
            'payment_status' => 'paid',
        ]);

        $response->assertStatus(200);

        $booking->refresh();
        $this->assertEquals('completed', $booking->status);
    }
}
