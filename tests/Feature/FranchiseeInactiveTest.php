<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Franchisee;
use Laravel\Sanctum\Sanctum;
use Illuminate\Foundation\Testing\DatabaseTransactions;

class FranchiseeInactiveTest extends TestCase
{
    use DatabaseTransactions;

    protected $admin;
    protected $franchiseeUser;
    protected $franchisee;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::create([
            'name'     => 'Platform Admin',
            'email'    => 'admin_' . uniqid() . '@example.com',
            'password' => bcrypt('secret123'),
            'role'     => 'admin',
            'status'   => 'active',
        ]);

        $this->franchiseeUser = User::create([
            'name'     => 'Franchisee Manager',
            'email'    => 'franchise_' . uniqid() . '@example.com',
            'password' => bcrypt('secret123'),
            'role'     => 'franchisee',
            'status'   => 'active',
        ]);

        $this->franchisee = Franchisee::create([
            'user_id'            => $this->franchiseeUser->id,
            'center_name'        => 'Test Center',
            'city'               => 'Noida',
            'address'            => 'Sector 62',
            'phone'              => '9876543210',
            'royalty_percentage' => 10.00,
            'status'             => 'active',
        ]);
    }

    public function test_admin_can_update_franchisee_status_to_inactive(): void
    {
        Sanctum::actingAs($this->admin);

        $response = $this->putJson("/api/admin/franchisees/{$this->franchisee->id}/status", [
            'status' => 'inactive',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'status'  => 'success',
                'message' => 'Franchise status updated.',
            ]);

        $this->assertDatabaseHas('franchisees', [
            'id'     => $this->franchisee->id,
            'status' => 'inactive',
        ]);

        // User account status must stay active so they can log in
        $this->assertDatabaseHas('users', [
            'id'     => $this->franchiseeUser->id,
            'status' => 'active',
        ]);
    }

    public function test_inactive_franchisee_can_login(): void
    {
        $this->franchisee->update(['status' => 'inactive']);
        $this->franchiseeUser->update(['status' => 'active']);

        $response = $this->postJson('/api/auth/login', [
            'email'    => $this->franchiseeUser->email,
            'password' => 'secret123',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'status'  => 'success',
                'message' => 'Logged in successfully',
            ])
            ->assertJsonStructure([
                'access_token',
                'user' => [
                    'id',
                    'role',
                    'franchisee' => ['status'],
                ],
            ]);

        $this->assertEquals('inactive', $response->json('user.franchisee.status'));
    }

    public function test_inactive_franchisee_can_access_dashboard(): void
    {
        $this->franchisee->update(['status' => 'inactive']);
        Sanctum::actingAs($this->franchiseeUser);

        $response = $this->getJson('/api/franchisee/dashboard');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'franchisee' => ['id', 'status'],
            ]);

        $this->assertEquals('inactive', $response->json('franchisee.status'));
    }

    public function test_inactive_franchisee_cannot_access_orders(): void
    {
        $this->franchisee->update(['status' => 'inactive']);
        Sanctum::actingAs($this->franchiseeUser);

        $response = $this->getJson('/api/franchisee/orders');

        $response->assertStatus(403)
            ->assertJson([
                'status'  => 'error',
                'message' => 'Your franchise account is inactive. Operations are restricted.',
            ]);
    }

    public function test_inactive_franchisee_cannot_access_expenses(): void
    {
        $this->franchisee->update(['status' => 'inactive']);
        Sanctum::actingAs($this->franchiseeUser);

        $response = $this->getJson('/api/franchisee/expenses');

        $response->assertStatus(403)
            ->assertJson([
                'status'  => 'error',
                'message' => 'Your franchise account is inactive. Operations are restricted.',
            ]);
    }

    public function test_suspended_franchisee_cannot_login(): void
    {
        Sanctum::actingAs($this->admin);

        // Admin suspends franchisee
        $this->putJson("/api/admin/franchisees/{$this->franchisee->id}/status", [
            'status' => 'suspended',
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email'    => $this->franchiseeUser->email,
            'password' => 'secret123',
        ]);

        $response->assertStatus(403);
    }

    public function test_admin_can_reactivate_franchisee_and_operations_are_restored(): void
    {
        // First set to inactive
        $this->franchisee->update(['status' => 'inactive']);

        Sanctum::actingAs($this->admin);
        $updateResp = $this->putJson("/api/admin/franchisees/{$this->franchisee->id}/status", [
            'status' => 'active',
        ]);
        $updateResp->assertStatus(200);

        // Now operations should work
        Sanctum::actingAs($this->franchiseeUser);
        $ordersResp = $this->getJson('/api/franchisee/orders');
        $ordersResp->assertStatus(200);
    }
}
