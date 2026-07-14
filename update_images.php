\App\Models\ServicePackage::where('name', 'Basic Exterior Wash')->update(['image_path' => 'services/car_exterior.png']);
\App\Models\ServicePackage::where('name', 'Premium Exterior Wash')->update(['image_path' => 'services/car_exterior.png']);
\App\Models\ServicePackage::where('name', 'Interior Vacuum & Wipe')->update(['image_path' => 'services/car_interior.png']);
echo "Updated image paths.\n";
