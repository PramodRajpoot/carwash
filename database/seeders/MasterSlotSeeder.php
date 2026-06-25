<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

use App\Models\MasterSlot;
use App\Models\Franchisee;

class MasterSlotSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $slots = [
            ['name' => 'Morning Slot 1', 'time_range' => '09:00 AM - 11:00 AM'],
            ['name' => 'Morning Slot 2', 'time_range' => '11:00 AM - 01:00 PM'],
            ['name' => 'Afternoon Slot 1', 'time_range' => '01:00 PM - 03:00 PM'],
            ['name' => 'Afternoon Slot 2', 'time_range' => '03:00 PM - 05:00 PM'],
        ];

        $masterSlotIds = [];
        foreach ($slots as $slot) {
            $masterSlot = MasterSlot::updateOrCreate(
                ['time_range' => $slot['time_range']],
                ['name' => $slot['name'], 'default_max_bookings' => 3, 'status' => 'active']
            );
            $masterSlotIds[] = $masterSlot->id;
        }

        // Assign all master slots to existing franchisees to prevent breaking current app behavior
        $franchisees = Franchisee::all();
        foreach ($franchisees as $franchisee) {
            $franchisee->masterSlots()->syncWithoutDetaching($masterSlotIds);
        }
    }
}
