<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\PartnerFeedback;

class PartnerFeedbackSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $feedbacks = [
            [
                'city' => 'Delhi',
                'quote' => 'Incredible support and a robust business model.',
                'thumbnail_path' => 'https://images.unsplash.com/photo-1556761175-5973dc0f32b7?auto=format&fit=crop&q=80&w=300',
                'video_path' => null,
                'is_active' => true,
            ],
            [
                'city' => 'Mumbai',
                'quote' => 'Our bookings grew 300% in the first quarter alone.',
                'thumbnail_path' => 'https://images.unsplash.com/photo-1542744094-24638ea095b4?auto=format&fit=crop&q=80&w=300',
                'video_path' => null,
                'is_active' => true,
            ],
            [
                'city' => 'Bangalore',
                'quote' => 'The tech platform makes managing operations a breeze.',
                'thumbnail_path' => 'https://images.unsplash.com/photo-1556761175-4b46a572b786?auto=format&fit=crop&q=80&w=300',
                'video_path' => null,
                'is_active' => true,
            ],
        ];

        foreach ($feedbacks as $feedback) {
            PartnerFeedback::create($feedback);
        }
    }
}
