<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\MasterSlot;
use App\Models\Franchisee;
use App\Models\Slot;

class SuperAdminSlotController extends Controller
{
    public function getMasterSlots()
    {
        $slots = MasterSlot::orderBy('id', 'asc')->get();
        return response()->json($slots);
    }

    public function createMasterSlot(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'time_range' => 'required|string|max:255|unique:master_slots,time_range',
            'default_max_bookings' => 'required|integer|min:1',
            'status' => 'required|string|in:active,inactive',
        ]);

        $slot = MasterSlot::create($request->all());
        return response()->json(['message' => 'Master slot created successfully.', 'slot' => $slot]);
    }

    public function updateMasterSlot(Request $request, $id)
    {
        $slot = MasterSlot::findOrFail($id);

        $request->validate([
            'name' => 'required|string|max:255',
            'time_range' => 'required|string|max:255|unique:master_slots,time_range,' . $id,
            'default_max_bookings' => 'required|integer|min:1',
            'status' => 'required|string|in:active,inactive',
        ]);

        $slot->update($request->all());
        return response()->json(['message' => 'Master slot updated successfully.', 'slot' => $slot]);
    }

    public function deleteMasterSlot($id)
    {
        $slot = MasterSlot::findOrFail($id);
        $slot->delete();
        return response()->json(['message' => 'Master slot deleted successfully.']);
    }

    public function getAssignedSlots($franchiseeId)
    {
        $franchisee = Franchisee::findOrFail($franchiseeId);

        // Get distinct time_ranges assigned to this franchise from the slots table
        $assignedTimeRanges = Slot::where('franchisee_id', $franchiseeId)
            ->select('time_range')
            ->distinct()
            ->pluck('time_range')
            ->toArray();

        // Return all master slots with an "assigned" flag
        $masterSlots = MasterSlot::orderBy('id')->get()->map(function ($slot) use ($assignedTimeRanges) {
            $slot->assigned = in_array($slot->time_range, $assignedTimeRanges);
            return $slot;
        });

        return response()->json($masterSlots);
    }

    public function assignSlots(Request $request, $franchiseeId)
    {
        $request->validate([
            'master_slot_ids' => 'array',
            'master_slot_ids.*' => 'exists:master_slots,id'
        ]);

        $franchisee = Franchisee::findOrFail($franchiseeId);
        $selectedIds = $request->master_slot_ids ?? [];

        // Get master slots for the selected IDs
        $selectedMasterSlots = MasterSlot::whereIn('id', $selectedIds)->get();
        $selectedTimeRanges = $selectedMasterSlots->pluck('time_range')->toArray();

        // Remove slots whose time_range is NOT in the selected list (and have no bookings)
        Slot::where('franchisee_id', $franchiseeId)
            ->whereNotIn('time_range', $selectedTimeRanges)
            ->where('current_bookings', 0)
            ->delete();

        // For each selected master slot, ensure at least a default entry exists (today's date)
        $today = now()->format('Y-m-d');
        foreach ($selectedMasterSlots as $ms) {
            Slot::firstOrCreate(
                ['franchisee_id' => $franchiseeId, 'date' => $today, 'time_range' => $ms->time_range],
                ['max_bookings' => $ms->default_max_bookings, 'current_bookings' => 0]
            );
        }

        return response()->json(['message' => 'Slots assigned successfully.']);
    }
}
