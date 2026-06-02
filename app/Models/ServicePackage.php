<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ServicePackage extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'vehicle_type',
        'price',
        'frequency_days',
        'max_bookings',
    ];

    public function subscriptions()
    {
        return $this->hasMany(Subscription::class, 'package_id');
    }

    public function bookings()
    {
        return $this->hasMany(Booking::class, 'package_id');
    }
}
