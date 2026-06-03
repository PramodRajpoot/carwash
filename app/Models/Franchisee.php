<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Franchisee extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'center_name',
        'address',
        'city',
        'latitude',
        'longitude',
        'royalty_percentage',
        'status',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function bookings()
    {
        return $this->hasMany(Booking::class);
    }

    public function slots()
    {
        return $this->hasMany(Slot::class);
    }

    public function expenses()
    {
        return $this->hasMany(Expense::class);
    }
}
