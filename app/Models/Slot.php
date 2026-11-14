<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Slot extends Model
{
    use HasFactory;

    protected $table = 'franchisee_master_slot';

    protected $fillable = [
        'franchisee_id',
        'date',
        'time_range',
        'max_bookings',
        'current_bookings',
        'status',
    ];

    protected $appends = ['is_full'];

    public function getIsFullAttribute()
    {
        return (int) ($this->current_bookings ?? 0) >= (int) ($this->max_bookings ?? 1);
    }

    public function franchisee()
    {
        return $this->belongsTo(Franchisee::class);
    }
}
