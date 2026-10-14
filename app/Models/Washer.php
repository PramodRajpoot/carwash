<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Washer extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'franchisee_id',
        'status',
        'notes',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function franchisee()
    {
        return $this->belongsTo(Franchisee::class);
    }

    public function bookings()
    {
        return $this->hasMany(Booking::class, 'washer_id');
    }
}
