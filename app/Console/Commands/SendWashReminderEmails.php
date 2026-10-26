<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use App\Models\ServicePackage;
use App\Models\Booking;
use App\Models\Subscription;
use App\Models\NotificationLog;
use App\Mail\WashReminderMail;
use Illuminate\Support\Facades\Mail;
use Carbon\Carbon;

class SendWashReminderEmails extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'carwash:send-wash-reminders {--force : Send reminder emails regardless of the 15-day interval check} {--customer= : Target a specific customer ID}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send wash reminder emails to customers who have active multi-wash packages where not all washes have been completed (e.g. 1/4, 2/4, 3/4) every 15 days.';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $force = (bool) $this->option('force');
        $this->info("Scanning for customers with incomplete multi-wash packages...");

        // 1. Gather all potential targets (customer_id + package_id)
        $targets = [];

        // Active subscriptions
        $activeSubs = Subscription::with(['customer', 'package'])
            ->where('status', 'active')
            ->get();

        foreach ($activeSubs as $sub) {
            if ($sub->package && $sub->package->max_bookings > 1 && $sub->customer) {
                $key = $sub->customer_id . '_' . $sub->package_id;
                $targets[$key] = [
                    'customer'     => $sub->customer,
                    'package'      => $sub->package,
                    'subscription' => $sub,
                ];
            }
        }

        // Bookings with multi-wash packages
        $completedBookings = Booking::with(['customer', 'package', 'vehicle'])
            ->where('status', 'completed')
            ->whereNotNull('customer_id')
            ->whereNotNull('package_id')
            ->get();

        foreach ($completedBookings as $b) {
            if ($b->package && $b->package->max_bookings > 1 && $b->customer) {
                $key = $b->customer_id . '_' . $b->package_id;
                if (!isset($targets[$key])) {
                    $targets[$key] = [
                        'customer'     => $b->customer,
                        'package'      => $b->package,
                        'subscription' => null,
                    ];
                }
            }
        }

        if (empty($targets)) {
            $this->info("No active multi-wash package customers found.");
            return Command::SUCCESS;
        }

        $sentCount = 0;
        $skippedCount = 0;

        $targetCustomerId = $this->option('customer');

        foreach ($targets as $target) {
            $customer = $target['customer'];
            $package  = $target['package'];
            $sub      = $target['subscription'];

            if ($targetCustomerId && (string) $customer->id !== (string) $targetCustomerId) {
                continue;
            }

            if (empty($customer->email)) {
                continue;
            }

            $totalWashes = (int) $package->max_bookings;
            if ($totalWashes <= 1) {
                continue;
            }

            // Retrieve all completed bookings for this customer and package
            $custBookings = Booking::with('vehicle')
                ->where('customer_id', $customer->id)
                ->where('package_id', $package->id)
                ->where('status', 'completed')
                ->orderBy('booking_date', 'desc')
                ->orderBy('id', 'desc')
                ->get();

            $completedCount = $custBookings->count();

            // Determine wash count based on subscription or completed bookings
            $usedWashesRaw = ($sub && $sub->booking_count > $completedCount)
                ? $sub->booking_count
                : $completedCount;

            if ($usedWashesRaw <= $totalWashes) {
                $usedWashes = $usedWashesRaw;
            } else {
                $usedWashes = $usedWashesRaw % $totalWashes;
                if ($usedWashes === 0) {
                    $usedWashes = $totalWashes;
                }
            }

            // CRITICAL RULE:
            // Send ONLY when washes have started (used > 0) AND NOT ALL WASHES ARE COMPLETED (used < total).
            // For example, send for 1/4, 2/4, 3/4. Do NOT send for 4/4 or 0/4.
            if ($usedWashes <= 0 || $usedWashes >= $totalWashes) {
                $skippedCount++;
                continue;
            }

            $remainingWashes = $totalWashes - $usedWashes;

            // Determine date of last wash
            $lastWash = $custBookings->first();
            if ($lastWash && $lastWash->booking_date) {
                $lastWashCarbon = Carbon::parse($lastWash->booking_date);
            } elseif ($sub && $sub->starts_at) {
                $lastWashCarbon = Carbon::parse($sub->starts_at);
            } else {
                $lastWashCarbon = now()->subDays(15);
            }

            $daysSinceLastWash = (int) $lastWashCarbon->diffInDays(now());

            // 15-day interval check & duplicate suppression
            if (!$force) {
                // Must be at least 15 days since the last wash
                if ($daysSinceLastWash < 15) {
                    $skippedCount++;
                    continue;
                }

                // Check if a reminder was already sent within the last 14 days
                $recentLog = NotificationLog::where('user_id', $customer->id)
                    ->where('type', 'wash_reminder_15_days')
                    ->where('created_at', '>=', now()->subDays(14))
                    ->exists();

                if ($recentLog) {
                    $skippedCount++;
                    continue;
                }
            }

            // Vehicle details
            $vehicle = $lastWash?->vehicle ?? $customer->vehicles()->first();
            $vehicleName = $vehicle
                ? "{$vehicle->make_model}" . ($vehicle->plate_number ? " ({$vehicle->plate_number})" : '')
                : ($package->vehicle_type ? ucfirst(str_replace('_', ' ', $package->vehicle_type)) : 'Registered Vehicle');

            $lastWashDateFormatted = $lastWashCarbon ? $lastWashCarbon->format('d M Y') : null;

            try {
                // Send reminder email
                Mail::to($customer->email)->send(new WashReminderMail(
                    customer: $customer,
                    packageName: $package->name,
                    vehicleName: $vehicleName,
                    usedWashes: $usedWashes,
                    totalWashes: $totalWashes,
                    remainingWashes: $remainingWashes,
                    daysSinceLastWash: $daysSinceLastWash,
                    lastWashDate: $lastWashDateFormatted
                ));

                // Log in notifications
                NotificationLog::create([
                    'user_id' => $customer->id,
                    'type'    => 'wash_reminder_15_days',
                    'title'   => "Time for Your Next Wash! ({$usedWashes}/{$totalWashes} Used)",
                    'body'    => "It has been {$daysSinceLastWash} days since your last wash. You have {$remainingWashes} washes remaining in your {$package->name} plan.",
                ]);

                $this->info("✓ Reminder sent to {$customer->email} [{$customer->name}] — {$usedWashes}/{$totalWashes} Washes ({$remainingWashes} remaining)");
                $sentCount++;
            } catch (\Throwable $e) {
                $this->error("✗ Failed to send reminder to {$customer->email}: " . $e->getMessage());
                \Log::error("Wash reminder email failure: " . $e->getMessage(), [
                    'customer_id' => $customer->id,
                    'package_id'  => $package->id,
                    'exception'   => $e,
                ]);
            }
        }

        $this->info("Completed: {$sentCount} reminder email(s) sent, {$skippedCount} skipped.");
        return Command::SUCCESS;
    }
}
