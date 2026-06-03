<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RoyaltyPayment extends Model
{
    protected $fillable = [
        'franchisee_id', 'amount', 'due_date', 'status', 'paid_date',
    ];

    protected $casts = [
        'due_date' => 'date',
        'paid_date' => 'date',
    ];

    public function franchisee()
    {
        return $this->belongsTo(Franchisee::class);
    }
}
