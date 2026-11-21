<?php

namespace App\Http\Controllers;

use App\Models\PartnerValuableFeedback;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class PartnerValuableFeedbackController extends Controller
{
    public function index()
    {
        return response()->json(
            PartnerValuableFeedback::where('is_active', true)->latest()->get()
        );
    }

    public function adminIndex()
    {
        return response()->json(PartnerValuableFeedback::latest()->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:255',
            'quote' => 'required|string',
            'is_active' => 'boolean',
            'thumbnail' => 'nullable|image|max:2048',
            'video' => 'nullable|mimes:mp4,webm,ogg,mov|max:51200',
        ]);

        $data = [
            'name' => $validated['name'] ?? null,
            'city' => $validated['city'] ?? null,
            'quote' => $validated['quote'],
            'is_active' => $validated['is_active'] ?? true,
        ];

        if ($request->hasFile('thumbnail')) {
            $path = $request->file('thumbnail')->store('public/partner-feedback/thumbnails');
            $data['thumbnail_path'] = Storage::url($path);
        }

        if ($request->hasFile('video')) {
            $path = $request->file('video')->store('public/partner-feedback/videos');
            $data['video_path'] = Storage::url($path);
        }

        $feedback = PartnerValuableFeedback::create($data);
        return response()->json($feedback, 201);
    }

    public function update(Request $request, $id)
    {
        $feedback = PartnerValuableFeedback::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|nullable|string|max:255',
            'city' => 'sometimes|nullable|string|max:255',
            'quote' => 'sometimes|string',
            'is_active' => 'boolean',
            'thumbnail' => 'nullable|image|max:2048',
            'video' => 'nullable|mimes:mp4,webm,ogg,mov|max:51200',
        ]);

        foreach (['name', 'city', 'quote', 'is_active'] as $field) {
            if (array_key_exists($field, $validated)) {
                $feedback->{$field} = $validated[$field];
            }
        }

        if ($request->hasFile('thumbnail')) {
            $path = $request->file('thumbnail')->store('public/partner-feedback/thumbnails');
            $feedback->thumbnail_path = Storage::url($path);
        }

        if ($request->hasFile('video')) {
            $path = $request->file('video')->store('public/partner-feedback/videos');
            $feedback->video_path = Storage::url($path);
        }

        $feedback->save();
        return response()->json($feedback);
    }

    public function destroy($id)
    {
        $feedback = PartnerValuableFeedback::findOrFail($id);
        $feedback->delete();
        return response()->json(['message' => 'Deleted successfully']);
    }
}
