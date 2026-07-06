<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class NewsletterAdminNotification extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public $email;

    public function __construct($email)
    {
        $this->email = $email;
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: '🎉 New Newsletter Subscription!',
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'emails.newsletter.admin_notification',
            with: [
                'email' => $this->email,
            ],
        );
    }
}
