<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\NewsletterSubscriber;
use Illuminate\Support\Facades\Mail;
use App\Mail\NewsletterWelcome;
use App\Mail\NewsletterAdminNotification;

class NewsletterController extends Controller
{
    public function subscribe(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email|max:255',
        ]);

        $subscriber = NewsletterSubscriber::where('email', $validated['email'])->first();

        if ($subscriber) {
            if (!$subscriber->is_subscribed) {
                $subscriber->is_subscribed = true;
                $subscriber->save();
                
                // Send emails even on resubscribe
                $this->dispatchEmails($validated['email']);

                return response()->json(['message' => 'Welcome back! You have successfully resubscribed to our newsletter.']);
            }
            return response()->json(['message' => 'You are already subscribed to our newsletter.'], 409); // Conflict or already exists
        }

        NewsletterSubscriber::create([
            'email' => $validated['email'],
            'is_subscribed' => true
        ]);

        $this->dispatchEmails($validated['email']);

        return response()->json(['message' => 'Thank you for subscribing to our newsletter!']);
    }

    private function dispatchEmails($email)
    {
        try {
            // Send welcome email to subscriber
            Mail::to($email)->send(new NewsletterWelcome($email));
            
            // Notify Admin
            $adminEmail = config('mail.from.address') ?: 'hello@cleanatdoorstep.com';
            Mail::to($adminEmail)->send(new NewsletterAdminNotification($email));
        } catch (\Exception $e) {
            \Log::error('Failed to send newsletter emails: ' . $e->getMessage());
        }
    }

    public function index()
    {
        $subscribers = NewsletterSubscriber::orderBy('created_at', 'desc')->get();
        return response()->json($subscribers);
    }
}
