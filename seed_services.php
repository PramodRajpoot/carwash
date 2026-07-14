

$cat1 = \App\Models\ServiceCategory::firstOrCreate(
    ['name' => 'Exterior Wash'],
    ['description' => 'Comprehensive exterior washing services', 'status' => 'active']
);

$cat2 = \App\Models\ServiceCategory::firstOrCreate(
    ['name' => 'Interior Cleaning'],
    ['description' => 'Deep cleaning for the vehicle interior', 'status' => 'active']
);

$cat3 = \App\Models\ServiceCategory::firstOrCreate(
    ['name' => 'Full Detailing'],
    ['description' => 'Complete detailing service for the whole car', 'status' => 'active']
);

\App\Models\ServicePackage::firstOrCreate(
    ['name' => 'Basic Exterior Wash'],
    [
        'category_id' => $cat1->id,
        'description' => 'Quick wash, tire shine, and exterior window wipe down.',
        'vehicle_type' => 'sedan',
        'price' => 299,
        'frequency_days' => 7,
        'max_bookings' => 20,
    ]
);

\App\Models\ServicePackage::firstOrCreate(
    ['name' => 'Premium Exterior Wash'],
    [
        'category_id' => $cat1->id,
        'description' => 'Includes basic exterior wash plus hand wax and rim cleaning.',
        'vehicle_type' => 'suv',
        'price' => 499,
        'frequency_days' => 15,
        'max_bookings' => 15,
    ]
);

\App\Models\ServicePackage::firstOrCreate(
    ['name' => 'Interior Vacuum & Wipe'],
    [
        'category_id' => $cat2->id,
        'description' => 'Vacuum carpets and seats, wipe dashboard and console.',
        'vehicle_type' => 'hatchback',
        'price' => 199,
        'frequency_days' => 15,
        'max_bookings' => 20,
    ]
);

echo "Dummy data seeded successfully!\n";
