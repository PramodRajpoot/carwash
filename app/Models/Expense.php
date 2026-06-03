<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Expense extends Model
{
    use HasFactory;

    protected $fillable = [
        'franchisee_id',
        'category',
        'amount',
        'description',
        'expense_date',
    ];

    public function franchisee()
    {
        return $this->belongsTo(Franchisee::class);
    }
}
