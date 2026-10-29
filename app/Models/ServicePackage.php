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
        'image_path',
    ];

    protected $casts = [
        'is_addon' => 'boolean',
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
