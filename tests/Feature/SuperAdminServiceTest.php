<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\ServiceCategory;
use App\Models\ServicePackage;
use Illuminate\Foundation\Testing\DatabaseTransactions;

class SuperAdminServiceTest extends TestCase
{
    use DatabaseTransactions;

    protected User $superAdmin;
    protected ServiceCategory $category;
    protected ServicePackage $service;

    protected function setUp(): void
    {
        parent::setUp();

        $this->superAdmin = User::factory()->create([
            'role' => 'super_admin',
            'status' => 'active',
        ]);

        $this->category = ServiceCategory::create([
            'name' => 'Test Category',
            'status' => 'active',
        ]);

        $this->service = ServicePackage::create([
            'category_id' => $this->category->id,
            'name' => 'Original Teflon Coating',
            'description' => 'Original description',
            'vehicle_type' => 'hatchback',
            'price' => 2000,
            'frequency_days' => 1,
            'max_bookings' => 1,
            'is_addon' => false,
            'is_subscription' => false,
        ]);
    }

    public function test_super_admin_can_update_service_with_boolean_strings_and_extra_fields(): void
    {
        $response = $this->actingAs($this->superAdmin, 'sanctum')
            ->postJson("/api/super-admin/services/{$this->service->id}", [
                'name' => 'Teflon Coating Updated',
                'category_id' => $this->category->id,
                'description' => 'Updated description',
                'vehicle_type' => 'hatchback',
                'price' => 2500,
                'frequency_days' => 1,
                'max_bookings' => 2000,
                'is_addon' => '0',
                'is_subscription' => 'false',
                'category' => '[object Object]',
                'addons' => '[object Object]',
                'extra_dummy_key' => 'irrelevant',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'message' => 'Service updated successfully.',
            ]);

        $this->service->refresh();
        $this->assertEquals('Teflon Coating Updated', $this->service->name);
        $this->assertEquals(2500, $this->service->price);
        $this->assertEquals(2000, $this->service->max_bookings);
        $this->assertFalse($this->service->is_addon);
        $this->assertFalse($this->service->is_subscription);
    }

    public function test_super_admin_can_create_service_with_boolean_strings(): void
    {
        $response = $this->actingAs($this->superAdmin, 'sanctum')
            ->postJson('/api/super-admin/services', [
                'name' => 'Brand New Ceramic Coating',
                'category_id' => $this->category->id,
                'description' => 'Brand new ceramic description',
                'vehicle_type' => 'sedan',
                'price' => 4500,
                'frequency_days' => 30,
                'max_bookings' => 4,
                'is_addon' => '0',
                'is_subscription' => 'false',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'message' => 'Service created successfully.',
            ]);

        $this->assertDatabaseHas('service_packages', [
            'name' => 'Brand New Ceramic Coating',
            'price' => 4500,
            'is_addon' => false,
            'is_subscription' => false,
        ]);
    }
}
