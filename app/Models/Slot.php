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

    protected $appends = ['is_full', 'is_past'];

    public function getIsPastAttribute()
    {
        if (array_key_exists('is_past', $this->attributes)) {
            return (bool) $this->attributes['is_past'];
        }
        if (!empty($this->date) && !empty($this->time_range)) {
            return \App\Http\Controllers\BookingController::isSlotPassed($this->date, $this->time_range);
        }
        return false;
    }

    public function getIsFullAttribute()
    {
        if (array_key_exists('is_full', $this->attributes)) {
            return (bool) $this->attributes['is_full'];
        }
        $bookingsFull = (int) ($this->current_bookings ?? 0) >= (int) ($this->max_bookings ?? 1);
        return $bookingsFull || $this->getIsPastAttribute();
    }

    public function franchisee()
    {
        return $this->belongsTo(Franchisee::class);
    }
}
