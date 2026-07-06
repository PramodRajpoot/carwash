<?php

namespace App\Http\Controllers;

use App\Models\PartnerFeedback;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class PartnerFeedbackController extends Controller
{
    // Public endpoint
    public function index()
    {
        $feedbacks = PartnerFeedback::where('is_active', true)->latest()->take(3)->get();
        return response()->json($feedbacks);
    }

    // Admin endpoints
    public function adminIndex()
    {
        $feedbacks = PartnerFeedback::latest()->get();
        return response()->json($feedbacks);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'city' => 'required|string|max:255',
            'quote' => 'required|string',
            'is_active' => 'boolean',
            'thumbnail' => 'nullable|image|max:2048',
            'video' => 'nullable|mimes:mp4,webm,ogg,mov|max:51200' // max 50MB
        ]);

        $feedbackData = [
            'city' => $validated['city'],
            'quote' => $validated['quote'],
            'is_active' => $validated['is_active'] ?? true,
        ];

        if ($request->hasFile('thumbnail')) {
            $path = $request->file('thumbnail')->store('public/feedback/thumbnails');
            $feedbackData['thumbnail_path'] = Storage::url($path);
        }

        if ($request->hasFile('video')) {
            $path = $request->file('video')->store('public/feedback/videos');
            $feedbackData['video_path'] = Storage::url($path);
        }

        $feedback = PartnerFeedback::create($feedbackData);
        return response()->json($feedback, 201);
    }

    public function update(Request $request, $id)
    {
        $feedback = PartnerFeedback::findOrFail($id);

        $validated = $request->validate([
            'city' => 'sometimes|string|max:255',
            'quote' => 'sometimes|string',
            'is_active' => 'boolean',
            'thumbnail' => 'nullable|image|max:2048',
            'video' => 'nullable|mimes:mp4,webm,ogg,mov|max:51200'
        ]);

        if (isset($validated['city'])) $feedback->city = $validated['city'];
        if (isset($validated['quote'])) $feedback->quote = $validated['quote'];
        if (isset($validated['is_active'])) $feedback->is_active = $validated['is_active'];

        if ($request->hasFile('thumbnail')) {
            $path = $request->file('thumbnail')->store('public/feedback/thumbnails');
            $feedback->thumbnail_path = Storage::url($path);
        }

        if ($request->hasFile('video')) {
            $path = $request->file('video')->store('public/feedback/videos');
            $feedback->video_path = Storage::url($path);
        }

        $feedback->save();
        return response()->json($feedback);
    }

    public function destroy($id)
    {
        $feedback = PartnerFeedback::findOrFail($id);
        $feedback->delete();
        return response()->json(['message' => 'Deleted successfully']);
    }
}
