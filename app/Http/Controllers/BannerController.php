<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Banner;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\File;

class BannerController extends Controller
{
    // Public endpoint
    public function index()
    {
        return response()->json(Banner::where('is_active', true)->orderBy('order')->get());
    }

    // SuperAdmin endpoint
    public function adminIndex()
    {
        return response()->json(Banner::orderBy('order')->get());
    }

    public function store(Request $request)
    {
        $request->validate([
            'image' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:5120',
        ]);

        $file = $request->file('image');
        $filename = time() . '_banner.' . $file->getClientOriginalExtension();
        $destinationPath = public_path('images/banners');
        
        if (!File::exists($destinationPath)) {
            File::makeDirectory($destinationPath, 0755, true);
        }
        
        $file->move($destinationPath, $filename);

        $banner = Banner::create([
            'image_path' => '/images/banners/' . $filename,
            'order' => Banner::max('order') + 1,
            'is_active' => true,
        ]);

        return response()->json(['status' => 'success', 'banner' => $banner]);
    }

    public function update(Request $request, $id)
    {
        $banner = Banner::findOrFail($id);
        $request->validate([
            'order' => 'integer',
            'is_active' => 'boolean'
        ]);

        $banner->update($request->only('order', 'is_active'));
        return response()->json(['status' => 'success', 'banner' => $banner]);
    }

    public function destroy($id)
    {
        $banner = Banner::findOrFail($id);
        $path = public_path($banner->image_path);
        if (File::exists($path)) {
            File::delete($path);
        }
        $banner->delete();
        return response()->json(['status' => 'success']);
    }
}
