<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MasterSlot extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'time_range',
        'default_max_bookings',
        'status',
    ];

}
