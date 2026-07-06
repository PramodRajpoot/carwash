<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Testimonial;

class TestimonialSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $testimonials = [
            [
                'name' => 'Rahul Sharma',
                'role' => 'SUV Owner, Mumbai',
                'text' => 'Absolutely love the waterless wash! My Fortuner looks brand new every week. The monthly package is amazing value.',
                'is_active' => true,
            ],
            [
                'name' => 'Priya Patel',
                'role' => 'Sedan Owner, Delhi',
                'text' => 'Reliable, on-time, and professional. The team always goes above and beyond. Best car wash service I have used.',
                'is_active' => true,
            ],
            [
                'name' => 'Amit Kumar',
                'role' => 'Fleet Manager, Pune',
                'text' => 'Managing 20+ commercial vehicles is easy with CleanAt Doorstep. Their franchise team handles everything perfectly.',
                'is_active' => true,
            ],
        ];

        foreach ($testimonials as $testimonial) {
            Testimonial::create($testimonial);
        }
    }
}
