<?php

namespace Tests\Feature;

use App\Models\ServicePackage;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class AdminSubscriptionPackagesTest extends TestCase
{
    use DatabaseTransactions;

    protected User $superAdmin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->superAdmin = User::factory()->create([
            'role' => 'super_admin',
            'email' => 'superadmintest@carwash.com',
        ]);
    }

    public function test_packages_api_returns_only_subscription_plans()
    {
        // One-time service
        $singleWash = ServicePackage::create([
            'name' => 'Single Test Wash',
            'vehicle_type' => 'sedan',
            'price' => 350.00,
            'frequency_days' => 0,
            'max_bookings' => 1,
            'is_addon' => false,
            'is_subscription' => false,
        ]);

        // Add-on service
        $addon = ServicePackage::create([
            'name' => 'Addon Test Polish',
            'vehicle_type' => 'all',
            'price' => 70.00,
            'frequency_days' => 1,
            'max_bookings' => 1,
            'is_addon' => true,
            'is_subscription' => false,
        ]);

        // Subscription plan
        $subscriptionPlan = ServicePackage::create([
            'name' => 'Gold Monthly Test Plan',
            'vehicle_type' => 'sedan',
            'price' => 1199.00,
            'frequency_days' => 30,
            'max_bookings' => 4,
            'is_addon' => false,
            'is_subscription' => true,
        ]);

        $response = $this->actingAs($this->superAdmin, 'sanctum')
            ->getJson('/api/admin/packages');

        $response->assertStatus(200);

        $returnedIds = collect($response->json())->pluck('id')->all();

        $this->assertContains($subscriptionPlan->id, $returnedIds);
        $this->assertNotContains($singleWash->id, $returnedIds);
        $this->assertNotContains($addon->id, $returnedIds);
    }

    public function test_creating_package_via_admin_api_sets_is_subscription_true()
    {
        $payload = [
            'name' => 'Platinum Bi-Weekly Test Plan',
            'description' => 'Unlimited exterior washes for 60 days',
            'vehicle_type' => 'suv',
            'price' => 1999.00,
            'frequency_days' => 60,
            'max_bookings' => 8,
        ];

        $response = $this->actingAs($this->superAdmin, 'sanctum')
            ->postJson('/api/admin/packages', $payload);

        $response->assertStatus(201);
        $packageId = $response->json('package.id');

        $package = ServicePackage::find($packageId);
        $this->assertNotNull($package);
        $this->assertTrue((bool)$package->is_subscription);
        $this->assertFalse((bool)$package->is_addon);

        // Verify it is returned in /api/admin/packages
        $listResponse = $this->actingAs($this->superAdmin, 'sanctum')
            ->getJson('/api/admin/packages');

        $returnedIds = collect($listResponse->json())->pluck('id')->all();
        $this->assertContains($packageId, $returnedIds);
    }
}
