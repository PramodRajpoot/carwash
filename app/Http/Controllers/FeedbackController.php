<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\FeedbackReview;
use App\Models\Booking;

class FeedbackController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'booking_id' => 'required|exists:bookings,id',
            'rating'     => 'required|integer|min:1|max:5',
            'comment'    => 'nullable|string|max:1000',
            'image'      => 'nullable|file|image|max:5120',
            'video'      => 'nullable|file|mimes:mp4,mov,avi|max:51200',
        ]);

        $user = $request->user();

        // Ensure the booking belongs to this customer and is completed
        $booking = Booking::where('id', $request->booking_id)
            ->where('customer_id', $user->id)
            ->where('status', 'completed')
            ->firstOrFail();

        // Prevent duplicate review
        if (FeedbackReview::where('booking_id', $booking->id)->exists()) {
            return response()->json([
                'status'  => 'error',
                'message' => 'You have already submitted feedback for this booking.',
            ], 409);
        }

        $imagePath = null;
        $videoPath = null;

        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('feedback/images', 'public');
        }

        if ($request->hasFile('video')) {
            $videoPath = $request->file('video')->store('feedback/videos', 'public');
        }

        $review = FeedbackReview::create([
            'booking_id'  => $booking->id,
            'customer_id' => $user->id,
            'rating'      => $request->rating,
            'comment'     => $request->comment,
            'image_path'  => $imagePath,
            'video_path'  => $videoPath,
        ]);

        return response()->json([
            'status'  => 'success',
            'message' => 'Thank you for your feedback!',
            'review'  => $review,
        ], 201);
    }

    public function show(Request $request, $bookingId)
    {
        $review = FeedbackReview::where('booking_id', $bookingId)
            ->where('customer_id', $request->user()->id)
            ->first();

        return response()->json($review);
    }

    // Admin: all reviews
    public function adminIndex()
    {
        $reviews = FeedbackReview::with(['customer:id,name', 'booking:id,booking_date'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($reviews);
    }
}
