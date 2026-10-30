<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ServicePackage extends Model
{
    use HasFactory;

    protected $fillable = [
        'category_id',
        'name',
        'description',
        'vehicle_type',
        'price',
        'frequency_days',
        'max_bookings',
        'custom_badge',
        'is_addon',
        'is_subscription',
        'image_path',
    ];

    protected $casts = [
        'is_addon' => 'boolean',
        'is_subscription' => 'boolean',
        'price' => 'float',
    ];

    public function scopeOnlyMain($query)
    {
        return $query->where('is_addon', false);
    }

    public function scopeOnlyAddons($query)
    {
        return $query->where('is_addon', true);
    }

    public function scopeOnlySubscriptions($query)
    {
        return $query->where(function($q) {
            $q->where('is_subscription', true)
              ->orWhere(function($sub) {
                  $sub->where('is_addon', false)
                      ->where('frequency_days', '>=', 30)
                      ->where('max_bookings', '>', 1);
              });
        });
    }

    public function category()
    {
        return $this->belongsTo(ServiceCategory::class, 'category_id');
    }

    public function subscriptions()
    {
        return $this->hasMany(Subscription::class, 'package_id');
    }

    public function bookings()
    {
        return $this->hasMany(Booking::class, 'package_id');
    }

    public function addons()
    {
        return $this->belongsToMany(ServicePackage::class, 'service_package_addons', 'package_id', 'addon_id');
    }

    public function parentPackages()
    {
        return $this->belongsToMany(ServicePackage::class, 'service_package_addons', 'addon_id', 'package_id');
    }
}
