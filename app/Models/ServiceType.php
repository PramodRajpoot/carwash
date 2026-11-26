<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ServiceType extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'code',
        'description',
        'status',
    ];

    public function packages()
    {
        return $this->hasMany(ServicePackage::class, 'vehicle_type', 'code');
    }
}

