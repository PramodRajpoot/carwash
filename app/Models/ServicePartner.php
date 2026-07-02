<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ServicePartner extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'is_active', 'order', 'image_path'];
}
