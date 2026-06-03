<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FeedbackReview extends Model
{
    protected $fillable = [
        'booking_id', 'customer_id', 'rating', 'comment', 'image_path', 'video_path',
    ];

    public function booking()
    {
        return $this->belongsTo(Booking::class);
    }

    public function customer()
    {
        return $this->belongsTo(User::class, 'customer_id');
    }
}
