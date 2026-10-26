<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use App\Models\User;

class WashReminderMail extends Mailable
{
    use Queueable, SerializesModels;

    public User $customer;
    public string $packageName;
    public string $vehicleName;
    public int $usedWashes;
    public int $totalWashes;
    public int $remainingWashes;
    public int $daysSinceLastWash;
    public ?string $lastWashDate;

    /**
     * Create a new message instance.
     */
    public function __construct(
        User $customer,
        string $packageName,
        string $vehicleName,
        int $usedWashes,
        int $totalWashes,
        int $remainingWashes,
        int $daysSinceLastWash = 15,
        ?string $lastWashDate = null
    ) {
        $this->customer = $customer;
        $this->packageName = $packageName;
        $this->vehicleName = $vehicleName;
        $this->usedWashes = $usedWashes;
        $this->totalWashes = $totalWashes;
        $this->remainingWashes = $remainingWashes;
        $this->daysSinceLastWash = $daysSinceLastWash;
        $this->lastWashDate = $lastWashDate;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "🚗 Time for Your Next Wash! ({$this->usedWashes}/{$this->totalWashes} Washes Used) — CleanAt Doorstep",
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.wash-reminder',
            with: [
                'customer'          => $this->customer,
                'userName'          => $this->customer->name,
                'packageName'       => $this->packageName,
                'vehicleName'       => $this->vehicleName,
                'usedWashes'        => $this->usedWashes,
                'totalWashes'       => $this->totalWashes,
                'remainingWashes'   => $this->remainingWashes,
                'daysSinceLastWash' => $this->daysSinceLastWash,
                'lastWashDate'      => $this->lastWashDate,
                'bookingUrl'        => rtrim(config('app.url', 'http://carwash.local'), '/') . '/customer/bookings?book=true',
                'appUrl'            => config('app.url', 'http://carwash.local'),
            ],
        );
    }

    /**
     * Get the attachments for the message.
     */
    public function attachments(): array
    {
        return [];
    }
}
