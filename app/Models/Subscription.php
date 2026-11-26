<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Subscription extends Model
{
    use HasFactory;

    protected $fillable = [
        'customer_id',
        'package_id',
        'status',
        'booking_count',
        'starts_at',
        'expires_at',
        'selected_month',
        'payment_status',
        'paid_amount',
        'payment_method',
        'is_refundable',
        'has_water_electricity',
        'cashfree_order_id',
        'schedules',
    ];

    protected $casts = [
        'starts_at' => 'datetime',
        'expires_at' => 'datetime',
        'booking_count' => 'integer',
        'paid_amount' => 'decimal:2',
        'is_refundable' => 'boolean',
        'has_water_electricity' => 'boolean',
        'schedules' => 'json',
    ];

    public function customer()
    {
        return $this->belongsTo(User::class, 'customer_id');
    }

    public function package()
    {
        return $this->belongsTo(ServicePackage::class, 'package_id');
    }
}
