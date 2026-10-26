<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Booking;
use App\Models\Franchisee;
use App\Models\ServicePackage;
use App\Models\Vehicle;
use App\Models\NotificationLog;
use App\Mail\WashReminderMail;
use Illuminate\Support\Facades\Mail;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Carbon\Carbon;

class WashReminderEmailTest extends TestCase
{
    use DatabaseTransactions;

    protected User $customer;
    protected User $franchiseeUser;
    protected Franchisee $franchisee;
    protected ServicePackage $package4Washes;
    protected Vehicle $vehicle;

    protected function setUp(): void
    {
        parent::setUp();

        $this->customer = User::create([
            'name'     => 'Rahul Sharma',
            'email'    => 'rahul_' . uniqid() . '@example.com',
            'password' => bcrypt('password'),
            'role'     => 'customer',
        ]);

        $this->franchiseeUser = User::create([
            'name'     => 'Franchisee Lead',
            'email'    => 'fran_' . uniqid() . '@example.com',
            'password' => bcrypt('password'),
            'role'     => 'franchisee',
        ]);

        $this->franchisee = Franchisee::create([
            'user_id'            => $this->franchiseeUser->id,
            'center_name'        => 'Noida Clean Hub',
            'city'               => 'Noida',
            'address'            => 'Sector 18',
            'phone'              => '9876543210',
            'royalty_percentage' => 10.00,
            'status'             => 'active',
        ]);

        $this->package4Washes = ServicePackage::create([
            'name'           => 'Premium Monthly 4-Pack',
            'description'    => '4 comprehensive washes per month.',
            'vehicle_type'   => 'suv',
            'price'          => 1299.00,
            'frequency_days' => 30,
            'max_bookings'   => 4,
        ]);

        $this->vehicle = Vehicle::create([
            'customer_id'  => $this->customer->id,
            'vehicle_type' => 'suv',
            'make_model'   => 'Hyundai Creta (Black)',
            'plate_number' => 'UP-16-AB-9999',
        ]);
    }

    /**
     * Test mailable content and view rendering.
     */
    public function test_wash_reminder_mail_renders_correctly()
    {
        $mail = new WashReminderMail(
            customer: $this->customer,
            packageName: $this->package4Washes->name,
            vehicleName: 'Hyundai Creta (Black) (UP-16-AB-9999)',
            usedWashes: 1,
            totalWashes: 4,
            remainingWashes: 3,
            daysSinceLastWash: 15,
            lastWashDate: '10 Oct 2026'
        );

        $html = $mail->render();

        $this->assertStringContainsString('Time for Your Next Car Wash!', $html);
        $this->assertStringContainsString('Rahul Sharma', $html);
        $this->assertStringContainsString('Premium Monthly 4-Pack', $html);
        $this->assertStringContainsString('1', $html);
        $this->assertStringContainsString('4', $html);
        $this->assertStringContainsString('#10b981', $html); // Green for used
        $this->assertStringContainsString('#ef4444', $html); // Red for total / remaining
        $this->assertStringContainsString('Book Your Next Wash Now', $html);
        $this->assertEquals(
            '🚗 Time for Your Next Wash! (1/4 Washes Used) — CleanAt Doorstep',
            $mail->envelope()->subject
        );
    }

    /**
     * Test command sends email when 1 out of 4 washes is used and 15+ days elapsed.
     */
    public function test_command_sends_reminder_when_1_of_4_washes_completed_after_15_days()
    {
        Mail::fake();

        // 1 completed booking 16 days ago
        Booking::create([
            'customer_id'    => $this->customer->id,
            'vehicle_id'     => $this->vehicle->id,
            'franchisee_id'  => $this->franchisee->id,
            'package_id'     => $this->package4Washes->id,
            'booking_date'   => Carbon::now()->subDays(16)->toDateString(),
            'slot_time'      => '10:00 AM - 12:00 PM',
            'status'         => 'completed',
            'payment_status' => 'paid',
            'payment_method' => 'online',
            'total_price'    => 1299.00,
        ]);

        $this->artisan('carwash:send-wash-reminders')
            ->expectsOutputToContain('1/4 Washes')
            ->assertExitCode(0);

        Mail::assertSent(WashReminderMail::class, function ($mail) {
            return $mail->customer->id === $this->customer->id
                && $mail->usedWashes === 1
                && $mail->totalWashes === 4
                && $mail->remainingWashes === 3;
        });

        $this->assertDatabaseHas('notifications_log', [
            'user_id' => $this->customer->id,
            'type'    => 'wash_reminder_15_days',
        ]);
    }

    /**
     * Test command sends reminder when 2 or 3 washes out of 4 are used and 15+ days elapsed.
     */
    public function test_command_sends_reminder_for_intermediate_washes_used()
    {
        Mail::fake();

        // 2 completed bookings
        for ($i = 1; $i <= 2; $i++) {
            Booking::create([
                'customer_id'    => $this->customer->id,
                'vehicle_id'     => $this->vehicle->id,
                'franchisee_id'  => $this->franchisee->id,
                'package_id'     => $this->package4Washes->id,
                'booking_date'   => Carbon::now()->subDays(20 - $i)->toDateString(),
                'slot_time'      => '10:00 AM - 12:00 PM',
                'status'         => 'completed',
                'payment_status' => 'paid',
                'payment_method' => 'online',
                'total_price'    => 1299.00,
            ]);
        }

        $this->artisan("carwash:send-wash-reminders --customer={$this->customer->id}")
            ->expectsOutputToContain('2/4 Washes')
            ->assertExitCode(0);

        Mail::assertSent(WashReminderMail::class, function ($mail) {
            return $mail->customer->id === $this->customer->id
                && $mail->usedWashes === 2
                && $mail->totalWashes === 4
                && $mail->remainingWashes === 2;
        });
    }

    /**
     * Test command does NOT send email when ALL washes have completed (e.g. 4/4).
     */
    public function test_command_does_not_send_reminder_when_all_washes_are_completed()
    {
        Mail::fake();

        // Create 4 completed bookings for the 4-wash package
        for ($i = 1; $i <= 4; $i++) {
            Booking::create([
                'customer_id'    => $this->customer->id,
                'vehicle_id'     => $this->vehicle->id,
                'franchisee_id'  => $this->franchisee->id,
                'package_id'     => $this->package4Washes->id,
                'booking_date'   => Carbon::now()->subDays(20 - $i)->toDateString(),
                'slot_time'      => '10:00 AM - 12:00 PM',
                'status'         => 'completed',
                'payment_status' => 'paid',
                'payment_method' => 'online',
                'total_price'    => 1299.00,
            ]);
        }

        $this->artisan("carwash:send-wash-reminders --force --customer={$this->customer->id}")
            ->assertExitCode(0);

        Mail::assertNotSent(WashReminderMail::class, function ($mail) {
            return $mail->customer->id === $this->customer->id;
        });
    }

    /**
     * Test command does NOT send email when 0 washes have been completed (0/4).
     */
    public function test_command_does_not_send_reminder_when_zero_washes_completed()
    {
        Mail::fake();

        // Customer has a pending booking, 0 completed
        Booking::create([
            'customer_id'    => $this->customer->id,
            'vehicle_id'     => $this->vehicle->id,
            'franchisee_id'  => $this->franchisee->id,
            'package_id'     => $this->package4Washes->id,
            'booking_date'   => Carbon::now()->addDays(2)->toDateString(),
            'slot_time'      => '10:00 AM - 12:00 PM',
            'status'         => 'pending',
            'payment_status' => 'pending_payment',
            'payment_method' => 'online',
            'total_price'    => 1299.00,
        ]);

        $this->artisan("carwash:send-wash-reminders --force --customer={$this->customer->id}")
            ->assertExitCode(0);

        Mail::assertNotSent(WashReminderMail::class, function ($mail) {
            return $mail->customer->id === $this->customer->id;
        });
    }

    /**
     * Test command does NOT send reminder if last wash was less than 15 days ago.
     */
    public function test_command_does_not_send_if_last_wash_less_than_15_days_ago()
    {
        Mail::fake();

        // 1 completed booking only 5 days ago
        Booking::create([
            'customer_id'    => $this->customer->id,
            'vehicle_id'     => $this->vehicle->id,
            'franchisee_id'  => $this->franchisee->id,
            'package_id'     => $this->package4Washes->id,
            'booking_date'   => Carbon::now()->subDays(5)->toDateString(),
            'slot_time'      => '10:00 AM - 12:00 PM',
            'status'         => 'completed',
            'payment_status' => 'paid',
            'payment_method' => 'online',
            'total_price'    => 1299.00,
        ]);

        $this->artisan("carwash:send-wash-reminders --customer={$this->customer->id}")
            ->assertExitCode(0);

        Mail::assertNotSent(WashReminderMail::class, function ($mail) {
            return $mail->customer->id === $this->customer->id;
        });
    }

    /**
     * Test command suppresses duplicate if reminder was already sent within last 14 days.
     */
    public function test_command_suppresses_duplicate_reminder_within_14_days()
    {
        Mail::fake();

        // 1 completed booking 25 days ago
        Booking::create([
            'customer_id'    => $this->customer->id,
            'vehicle_id'     => $this->vehicle->id,
            'franchisee_id'  => $this->franchisee->id,
            'package_id'     => $this->package4Washes->id,
            'booking_date'   => Carbon::now()->subDays(25)->toDateString(),
            'slot_time'      => '10:00 AM - 12:00 PM',
            'status'         => 'completed',
            'payment_status' => 'paid',
            'payment_method' => 'online',
            'total_price'    => 1299.00,
        ]);

        // Prior notification logged 6 days ago
        NotificationLog::create([
            'user_id'    => $this->customer->id,
            'type'       => 'wash_reminder_15_days',
            'title'      => 'Time for Your Next Wash!',
            'body'       => 'Reminder sent',
            'created_at' => Carbon::now()->subDays(6),
        ]);

        $this->artisan("carwash:send-wash-reminders --customer={$this->customer->id}")
            ->assertExitCode(0);

        Mail::assertNotSent(WashReminderMail::class, function ($mail) {
            return $mail->customer->id === $this->customer->id;
        });
    }
}
