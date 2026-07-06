<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\ServicePartner;
use Illuminate\Support\Facades\File;

class ServicePartnerController extends Controller
{
    public function index()
    {
        return response()->json(ServicePartner::where('is_active', true)->orderBy('order')->get());
    }

    public function adminIndex()
    {
        return response()->json(ServicePartner::orderBy('order')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'order' => 'integer',
            'is_active' => 'boolean',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:5120',
        ]);
        
        if (!isset($validated['order'])) {
            $validated['order'] = ServicePartner::max('order') + 1;
        }

        if ($request->hasFile('image')) {
            $file = $request->file('image');
            $filename = time() . '_partner.' . $file->getClientOriginalExtension();
            $destinationPath = public_path('images/partners');
            if (!File::exists($destinationPath)) {
                File::makeDirectory($destinationPath, 0755, true);
            }
            $file->move($destinationPath, $filename);
            $validated['image_path'] = '/images/partners/' . $filename;
        }

        $partner = ServicePartner::create($validated);
        return response()->json(['status' => 'success', 'partner' => $partner]);
    }

    public function update(Request $request, $id)
    {
        $partner = ServicePartner::findOrFail($id);
        
        $validated = $request->validate([
            'name' => 'string|max:255',
            'order' => 'integer',
            'is_active' => 'boolean',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:5120',
        ]);

        if ($request->hasFile('image')) {
            // Delete old image
            if ($partner->image_path && File::exists(public_path($partner->image_path))) {
                File::delete(public_path($partner->image_path));
            }

            $file = $request->file('image');
            $filename = time() . '_partner.' . $file->getClientOriginalExtension();
            $destinationPath = public_path('images/partners');
            if (!File::exists($destinationPath)) {
                File::makeDirectory($destinationPath, 0755, true);
            }
            $file->move($destinationPath, $filename);
            $validated['image_path'] = '/images/partners/' . $filename;
        }

        if (isset($validated['is_active']) && is_string($validated['is_active'])) {
             $validated['is_active'] = filter_var($validated['is_active'], FILTER_VALIDATE_BOOLEAN);
        }

        $partner->update($validated);
        return response()->json(['status' => 'success', 'partner' => $partner]);
    }

    public function destroy($id)
    {
        $partner = ServicePartner::findOrFail($id);
        if ($partner->image_path && File::exists(public_path($partner->image_path))) {
            File::delete(public_path($partner->image_path));
        }
        $partner->delete();
        return response()->json(['status' => 'success']);
    }
}
