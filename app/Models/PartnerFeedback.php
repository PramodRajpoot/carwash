<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PartnerFeedback extends Model
{
    use HasFactory;

    protected $fillable = ['city', 'quote', 'thumbnail_path', 'video_path', 'is_active'];

    protected $casts = [
        'is_active' => 'boolean',
    ];
}
