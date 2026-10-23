<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Booking extends Model
{
    use HasFactory;

    protected $fillable = [
        'customer_id',
        'vehicle_id',
        'franchisee_id',
        'washer_id',
        'package_id',
        'booking_date',
        'slot_time',
        'address',
        'status',
        'payment_status',
        'payment_method',
        'total_price',
        'addon_services',
        'addon_price',
        'cashfree_order_id',
        'cashfree_payment_session_id',
        'cashfree_payment_id',
        'epoints_used',
        'earning_money_used',
        'payment_type',
        'advance_amount',
        'paid_amount',
        'coupon_code',
        'coupon_discount',
    ];

    protected $casts = [
        'addon_services' => 'array',
        'earning_money_used' => 'decimal:2',
        'advance_amount' => 'decimal:2',
        'paid_amount' => 'decimal:2',
        'coupon_discount' => 'decimal:2',
    ];

    public function customer()
    {
        return $this->belongsTo(User::class, 'customer_id');
    }

    public function vehicle()
    {
        return $this->belongsTo(Vehicle::class);
    }

    public function franchisee()
    {
        return $this->belongsTo(Franchisee::class);
    }

    public function washer()
    {
        return $this->belongsTo(Washer::class);
    }

    public function package()
    {
        return $this->belongsTo(ServicePackage::class, 'package_id');
    }
}
