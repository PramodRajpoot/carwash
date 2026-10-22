<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Franchisee extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'center_name',
        'address',
        'city',
        'latitude',
        'longitude',
        'royalty_percentage',
        'status',
        'agreement_expires_at',
        'document_path',
        'documents',
    ];

    protected $casts = [
        'agreement_expires_at' => 'date',
        'documents'            => 'array',
    ];

    public function getDocumentsAttribute($value)
    {
        if (is_array($value)) {
            $docs = $value;
        } elseif (is_string($value)) {
            $docs = json_decode($value, true) ?: [];
        } else {
            $docs = [];
        }

        if (empty($docs) && !empty($this->document_path)) {
            $docs[] = [
                'id'          => 'legacy_1',
                'name'        => basename($this->document_path),
                'path'        => $this->document_path,
                'uploaded_at' => null,
            ];
        }
        return $docs;
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function bookings()
    {
        return $this->hasMany(Booking::class);
    }

    public function slots()
    {
        return $this->hasMany(Slot::class);
    }

    public function expenses()
    {
        return $this->hasMany(Expense::class);
    }

    public function washers()
    {
        return $this->hasMany(Washer::class);
    }
}
