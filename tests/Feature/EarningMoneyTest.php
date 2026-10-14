<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Booking;
use App\Models\Franchisee;
use App\Models\ServicePackage;
use App\Models\Vehicle;
use App\Models\WalletTransaction;
use App\Models\WithdrawalRequest;
use Illuminate\Foundation\Testing\DatabaseTransactions;

class EarningMoneyTest extends TestCase
{
    use DatabaseTransactions;

    protected $customer;
    protected $referrer;
    protected $franchisee;
    protected $franchiseeUser;
    protected $package;
    protected $vehicle;

    protected function setUp(): void
    {
        parent::setUp();

        // Create a referrer user
        $this->referrer = User::create([
            'name' => 'Referrer User',
            'email' => 'referrer_' . uniqid() . '@example.com',
            'password' => bcrypt('password'),
            'role' => 'customer',
            'referral_code' => 'REF' . strtoupper(uniqid()),
        ]);

        $this->customer = User::create([
            'name' => 'Customer User',
            'email' => 'customer_' . uniqid() . '@example.com',
            'password' => bcrypt('password'),
            'role' => 'customer',
            'referred_by' => $this->referrer->id,
            'first_booking_discount' => true,
        ]);

        // Create franchisee user
        $this->franchiseeUser = User::create([
            'name' => 'Franchisee User',
            'email' => 'franchisee_' . uniqid() . '@example.com',
            'password' => bcrypt('password'),
            'role' => 'franchisee',
        ]);

        $this->franchisee = Franchisee::create([
            'user_id' => $this->franchiseeUser->id,
            'center_name' => 'Test Franchisee Center',
            'address' => '123 Street',
            'city' => 'City',
            'status' => 'active',
            'royalty_percentage' => 10,
        ]);

        // Create a package
        $this->package = ServicePackage::create([
            'name' => 'Basic Sedan Wash',
            'description' => 'Sedan washing package',
            'price' => 500.00,
            'duration' => 45,
            'vehicle_type' => 'sedan',
        ]);

        // Create a vehicle for customer
        $this->vehicle = Vehicle::create([
            'customer_id' => $this->customer->id,
            'make_model' => 'Honda Civic',
            'plate_number' => 'PLATE123',
            'vehicle_type' => 'sedan',
        ]);
    }

    public function test_referral_commission_earning_money()
    {
        // Arrange
        $booking = Booking::create([
            'customer_id' => $this->customer->id,
            'vehicle_id' => $this->vehicle->id,
            'franchisee_id' => $this->franchisee->id,
            'package_id' => $this->package->id,
            'booking_date' => now()->toDateString(),
            'slot_time' => '10:00 - 11:00',
            'status' => 'pending',
            'payment_method' => 'online',
            'payment_status' => 'paid',
            'total_price' => 500.00,
        ]);

        $this->actingAs($this->franchiseeUser, 'sanctum');

        // Act - complete booking to trigger referral commission
        $response = $this->putJson("/api/franchisee/orders/{$booking->id}/status", [
            'status' => 'completed',
        ]);

        $response->assertStatus(200);

        // Assert referrer received 10% commission in earning_money
        $this->referrer->refresh();
        $this->assertEquals(50.00, (float) $this->referrer->earning_money);

        // Assert transaction was recorded
        $transaction = WalletTransaction::where('user_id', $this->referrer->id)
            ->where('source', 'referral_commission')
            ->first();
        $this->assertNotNull($transaction);
        $this->assertEquals(50.00, (float) $transaction->amount);
        $this->assertEquals('credit', $transaction->type);
    }

    public function test_booking_checkout_with_earning_money()
    {
        // Arrange - credit earning money to customer first
        $this->customer->earning_money = 300.00;
        $this->customer->save();

        $this->actingAs($this->customer, 'sanctum');

        // Act - book with use_earning_money = true
        $response = $this->postJson('/api/bookings', [
            'vehicle_id' => $this->vehicle->id,
            'franchisee_id' => $this->franchisee->id,
            'package_id' => $this->package->id,
            'booking_date' => now()->addDay()->toDateString(),
            'slot_time' => '11:00 - 12:00',
            'payment_method' => 'online',
            'use_earning_money' => true,
        ]);

        $response->assertStatus(201);
        $data = $response->json();

        // Total price is 500, customer has 300 earning money.
        // Discount should be 300, remaining total_price should be 200.
        $this->assertDatabaseHas('bookings', [
            'id' => $data['booking']['id'],
            'total_price' => 200.00,
            'earning_money_used' => 300.00,
        ]);

        $this->customer->refresh();
        $this->assertEquals(0.00, (float) $this->customer->earning_money);

        // Check debit transaction logged
        $transaction = WalletTransaction::where('user_id', $this->customer->id)
            ->where('source', 'booking_earning')
            ->first();
        $this->assertNotNull($transaction);
        $this->assertEquals(300.00, (float) $transaction->amount);
        $this->assertEquals('debit', $transaction->type);
    }

    public function test_booking_cancellation_refunds_earning_money()
    {
        // Arrange
        $booking = Booking::create([
            'customer_id' => $this->customer->id,
            'vehicle_id' => $this->vehicle->id,
            'franchisee_id' => $this->franchisee->id,
            'package_id' => $this->package->id,
            'booking_date' => now()->addDay()->toDateString(),
            'slot_time' => '10:00 - 11:00',
            'status' => 'pending',
            'payment_method' => 'online',
            'payment_status' => 'paid',
            'total_price' => 200.00,
            'earning_money_used' => 300.00,
        ]);

        $this->customer->earning_money = 0.00;
        $this->customer->save();

        // Create corresponding debit transaction
        WalletTransaction::create([
            'user_id' => $this->customer->id,
            'type' => 'debit',
            'amount' => 300.00,
            'source' => 'booking_payment',
            'status' => 'confirmed',
            'description' => 'Earning money used for booking #' . $booking->id,
        ]);

        $this->actingAs($this->customer, 'sanctum');

        // Act - cancel booking
        $response = $this->postJson("/api/bookings/{$booking->id}/cancel");

        $response->assertStatus(200);

        // Assert customer received earning_money back
        $this->customer->refresh();
        $this->assertEquals(300.00, (float) $this->customer->earning_money);

        // Assert refund transaction logged
        $transaction = WalletTransaction::where('user_id', $this->customer->id)
            ->where('source', 'booking_earning_refund')
            ->first();
        $this->assertNotNull($transaction);
        $this->assertEquals(300.00, (float) $transaction->amount);
        $this->assertEquals('credit', $transaction->type);
    }

    public function test_earning_money_withdrawal_flow()
    {
        // Arrange - customer requests withdrawal
        $this->customer->earning_money = 5000.00;
        $this->customer->save();

        $this->actingAs($this->customer, 'sanctum');

        // Act 1 - request withdrawal (min ₹2000)
        $response = $this->postJson('/api/wallet/withdraw', [
            'amount' => 2000.00,
        ]);

        $response->assertStatus(200);

        $this->customer->refresh();
        $this->assertEquals(3000.00, (float) $this->customer->earning_money);

        // Verify withdrawal request created
        $withdrawal = WithdrawalRequest::where('user_id', $this->customer->id)->latest()->first();
        $this->assertNotNull($withdrawal);
        $this->assertEquals(2000.00, (float) $withdrawal->amount);
        $this->assertEquals('earning_money', $withdrawal->type);
        $this->assertEquals('pending', $withdrawal->status);

        // Act 2 - admin rejects request
        $superAdmin = User::create([
            'name' => 'Super Admin',
            'email' => 'admin_' . uniqid() . '@example.com',
            'password' => bcrypt('password'),
            'role' => 'super_admin',
        ]);

        $this->actingAs($superAdmin, 'sanctum');

        $processResponse = $this->postJson("/api/super-admin/withdrawals/{$withdrawal->id}/process", [
            'status' => 'rejected',
            'admin_notes' => 'Invalid details',
        ]);

        $processResponse->assertStatus(200);

        // Assert refunded correctly to customer
        $this->customer->refresh();
        $this->assertEquals(5000.00, (float) $this->customer->earning_money);

        // Assert transaction shows failed and refund transaction created
        $refundTrx = WalletTransaction::where('user_id', $this->customer->id)
            ->where('source', 'earning_refund')
            ->first();
        $this->assertNotNull($refundTrx);
        $this->assertEquals(2000.00, (float) $refundTrx->amount);
    }
}
