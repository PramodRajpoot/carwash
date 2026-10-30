<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\Franchisee;
use App\Models\ServicePackage;
use App\Models\User;
use App\Models\Vehicle;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BookingGstAndInvoiceTest extends TestCase
{
    use RefreshDatabase;

    protected User $customer;
    protected Franchisee $franchisee;
    protected ServicePackage $package;
    protected ServicePackage $addon;
    protected Vehicle $vehicle;

    protected function setUp(): void
    {
        parent::setUp();

        $this->customer = User::factory()->create([
            'role' => 'customer',
            'phone' => '9876543210',
            'email' => 'gstcustomer@test.com',
            'e_points' => 0,
            'earning_money' => 0.00,
        ]);

        $franchiseeUser = User::factory()->create(['role' => 'franchisee']);
        $this->franchisee = Franchisee::create([
            'user_id' => $franchiseeUser->id,
            'center_name' => 'South Delhi Center',
            'address' => 'Hauz Khas, New Delhi',
            'city' => 'Delhi',
            'state' => 'Delhi',
            'pincode' => '110016',
            'contact_number' => '9999988888',
            'royalty_percentage' => 10.00,
            'status' => 'active',
        ]);

        $this->package = ServicePackage::create([
            'name' => 'Premium Foam Wash',
            'vehicle_type' => 'sedan',
            'price' => 500.00,
            'service_type' => 'one_time',
            'is_addon' => false,
            'status' => 'active',
        ]);

        $this->addon = ServicePackage::create([
            'name' => 'Windshield Polish',
            'vehicle_type' => 'all',
            'price' => 100.00,
            'service_type' => 'one_time',
            'is_addon' => true,
            'status' => 'active',
        ]);

        $this->vehicle = Vehicle::create([
            'customer_id' => $this->customer->id,
            'make_model' => 'Honda City',
            'plate_number' => 'DL10AB1234',
            'vehicle_type' => 'sedan',
        ]);
    }

    public function test_booking_calculates_18_percent_gst_and_stores_gst_amount()
    {
        // Base: 500, Add-on: 100 => Subtotal: 600.
        // 18% GST on 600 = 108.00.
        // Total price = 708.00.
        $response = $this->actingAs($this->customer, 'sanctum')->postJson('/api/bookings', [
            'vehicle_id' => $this->vehicle->id,
            'franchisee_id' => $this->franchisee->id,
            'package_id' => $this->package->id,
            'addon_ids' => [$this->addon->id],
            'booking_date' => now()->addDay()->toDateString(),
            'slot_time' => '11:00 AM - 01:00 PM',
            'payment_method' => 'cod',
            'payment_type' => 'full',
            'address' => 'Flat 101, Delhi',
        ]);

        $response->assertStatus(201);
        $data = $response->json();
        $this->assertEquals('success', $data['status']);

        $booking = Booking::find($data['booking']['id']);
        $this->assertNotNull($booking);
        $this->assertEquals(708.00, (float)$booking->total_price);
        $this->assertEquals(108.00, (float)$booking->gst_amount);
        $this->assertEquals(100.00, (float)$booking->addon_price);
    }

    public function test_customer_can_download_and_view_invoice_with_gst_breakdown()
    {
        // Create booking with 18% GST
        $booking = Booking::create([
            'customer_id' => $this->customer->id,
            'vehicle_id' => $this->vehicle->id,
            'franchisee_id' => $this->franchisee->id,
            'package_id' => $this->package->id,
            'booking_date' => now()->toDateString(),
            'slot_time' => '09:00 AM - 11:00 AM',
            'address' => '123 Park Avenue',
            'status' => 'completed',
            'payment_status' => 'paid',
            'payment_method' => 'cod',
            'payment_type' => 'full',
            'advance_amount' => 590.00,
            'paid_amount' => 590.00,
            'total_price' => 590.00, // 500 base + 90 GST
            'gst_amount' => 90.00,
        ]);

        $response = $this->actingAs($this->customer, 'sanctum')->get("/api/bookings/{$booking->id}/invoice");

        $response->assertStatus(200);
        $response->assertSee('TAX INVOICE');
        $response->assertSee('GST 18%');
        $response->assertSee('Taxable Subtotal:');
        $response->assertSee('₹500.00');
        $response->assertSee('CGST (9.0%):');
        $response->assertSee('₹45.00');
        $response->assertSee('SGST (9.0%):');
        $response->assertSee('₹45.00');
        $response->assertSee('Total GST (18.0%):');
        $response->assertSee('₹90.00');
        $response->assertSee('Grand Total (incl. GST):');
        $response->assertSee('₹590.00');
    }

    public function test_customer_cannot_view_another_customers_invoice()
    {
        $otherCustomer = User::factory()->create(['role' => 'customer']);
        $booking = Booking::create([
            'customer_id' => $otherCustomer->id,
            'vehicle_id' => $this->vehicle->id,
            'franchisee_id' => $this->franchisee->id,
            'package_id' => $this->package->id,
            'booking_date' => now()->toDateString(),
            'slot_time' => '09:00 AM - 11:00 AM',
            'address' => 'Another address',
            'status' => 'pending',
            'payment_status' => 'unpaid',
            'payment_method' => 'cod',
            'payment_type' => 'full',
            'total_price' => 590.00,
            'gst_amount' => 90.00,
        ]);

        $response = $this->actingAs($this->customer, 'sanctum')->get("/api/bookings/{$booking->id}/invoice");
        $response->assertStatus(404);
    }
}
