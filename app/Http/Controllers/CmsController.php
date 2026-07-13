<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\PlatformSetting;

class CmsController extends Controller
{
    public function getAboutUs()
    {
        $aboutUs = PlatformSetting::get('cms_about_us');
        
        if (!$aboutUs) {
            $data = [
                'title' => 'About <span class="text-gradient">CleanAtDoorstep</span>',
                'description' => 'We are India\'s most trusted doorstep car wash and detailing service. Since our inception, we have been committed to providing top-tier vehicle care while saving millions of liters of water using our advanced eco-friendly solutions.',
                'image_url' => 'https://images.unsplash.com/photo-1601362840469-51e4d8d58785?auto=format&fit=crop&q=80&w=800',
                'points' => [
                    '✅ Trained & Verified Professionals',
                    '✅ Eco-Friendly & Water Efficient',
                    '✅ No Hidden Charges or Hassle'
                ]
            ];
        } else {
            $data = json_decode($aboutUs, true);
        }

        return response()->json($data);
    }

    public function updateAboutUs(Request $request)
    {
        $request->validate([
            'title' => 'required|string',
            'description' => 'required|string',
            'image_url' => 'required|url',
            'points' => 'array',
            'points.*' => 'string'
        ]);

        $data = [
            'title' => $request->title,
            'description' => $request->description,
            'image_url' => $request->image_url,
            'points' => $request->points ?? []
        ];

        PlatformSetting::set('cms_about_us', json_encode($data), 'cms');

        return response()->json([
            'message' => 'About Us section updated successfully!',
            'data' => $data
        ]);
    }

    public function getPrivacyPolicy()
    {
        $privacyPolicy = PlatformSetting::get('cms_privacy_policy');
        
        if (!$privacyPolicy) {
            $html = <<<HTML
<h3 style="margin-bottom:0.75rem">1. Information We Collect</h3>
<p class="text-muted" style="margin-bottom:1.5rem">We collect: (a) Personal information such as name, email, phone, and address when you register; (b) Vehicle information added to your profile; (c) Booking and transaction history; (d) Device information and usage data for app improvements.</p>

<h3 style="margin-bottom:0.75rem">2. How We Use Your Information</h3>
<p class="text-muted" style="margin-bottom:1.5rem">Your information is used to: process bookings and payments, communicate service confirmations and reminders, manage referral rewards and E-Points, improve our platform, comply with legal obligations, and send promotional offers (with your consent).</p>

<h3 style="margin-bottom:0.75rem">3. Data Sharing</h3>
<p class="text-muted" style="margin-bottom:1.5rem">We share your data with franchise partners to fulfill service bookings, payment processors for transactions, and SMS/email service providers for notifications. We do not sell personal data to third parties.</p>

<h3 style="margin-bottom:0.75rem">4. Data Security</h3>
<p class="text-muted" style="margin-bottom:1.5rem">We implement industry-standard security measures including SSL encryption, hashed passwords, and access controls. However, no transmission over the internet is 100% secure.</p>

<h3 style="margin-bottom:0.75rem">5. Cookies</h3>
<p class="text-muted" style="margin-bottom:1.5rem">We use cookies and local storage for authentication tokens and user preferences (such as dark/light mode). These are essential for platform functionality.</p>

<h3 style="margin-bottom:0.75rem">6. Your Rights</h3>
<p class="text-muted" style="margin-bottom:1.5rem">You have the right to: access your personal data, request correction of inaccurate data, request deletion of your account, opt out of marketing communications, and port your data in machine-readable format.</p>

<h3 style="margin-bottom:0.75rem">7. Retention</h3>
<p class="text-muted" style="margin-bottom:1.5rem">We retain your data for as long as your account is active or as required by law. Booking and financial records are retained for 7 years for compliance purposes.</p>

<h3 style="margin-bottom:0.75rem">8. Contact Us</h3>
<p class="text-muted">For privacy-related queries, contact us at <strong style="color:var(--accent-cyan)">privacy@cleanatdoorstep.in</strong> or reach out through our Contact page.</p>
HTML;
            $data = [
                'content' => $html
            ];
        } else {
            $data = json_decode($privacyPolicy, true);
        }

        return response()->json($data);
    }

    public function updatePrivacyPolicy(Request $request)
    {
        $validated = $request->validate([
            'content' => 'required|string',
        ]);

        PlatformSetting::set('cms_privacy_policy', json_encode($validated));

        return response()->json([
            'message' => 'Privacy Policy updated successfully',
            'data' => $validated
        ]);
    }

    public function getTermsAndConditions()
    {
        $terms = PlatformSetting::get('cms_terms');
        
        if (!$terms) {
            $html = <<<HTML
<h3 style="margin-bottom:0.75rem">1. Acceptance of Terms</h3>
<p class="text-muted" style="margin-bottom:1.5rem">By accessing or using the CleanAtDoorstep platform, you agree to be bound by these Terms and Conditions and all applicable laws. If you do not agree, please do not use our services.</p>

<h3 style="margin-bottom:0.75rem">2. Services</h3>
<p class="text-muted" style="margin-bottom:1.5rem">CleanAtDoorstep provides on-demand vehicle cleaning and detailing services through a network of franchise partners. Service availability is subject to your location and the availability of franchise partners in your area.</p>

<h3 style="margin-bottom:0.75rem">3. Booking & Cancellation</h3>
<p class="text-muted" style="margin-bottom:1.5rem">Bookings must be made in advance through the platform. Cancellations made 24 hours before the scheduled time will be fully refunded. Cancellations within 24 hours may be subject to a cancellation fee.</p>

<h3 style="margin-bottom:0.75rem">4. E-Points & Wallet</h3>
<p class="text-muted" style="margin-bottom:1.5rem">E-Points are earned through referrals and service bookings. Pending E-Points are confirmed once the referred customer completes their first booking. Minimum 1000 confirmed E-Points are required for redemption. E-Points have no cash value and cannot be transferred.</p>

<h3 style="margin-bottom:0.75rem">5. Referral Programme</h3>
<p class="text-muted" style="margin-bottom:1.5rem">Users earn 10 E-Points for each successful referral. A referral is considered successful when the referred customer completes their first service booking. Referred customers receive a 10% discount on their first booking only.</p>

<h3 style="margin-bottom:0.75rem">6. Franchise Partners</h3>
<p class="text-muted" style="margin-bottom:1.5rem">Franchise partners operate independently under the CleanAtDoorstep brand. They are responsible for service quality and timely delivery. Royalty payments are due monthly as per franchise agreement terms.</p>

<h3 style="margin-bottom:0.75rem">7. Privacy</h3>
<p class="text-muted" style="margin-bottom:1.5rem">Your use of the platform is also governed by our Privacy Policy. Personal data is processed in accordance with applicable data protection laws.</p>

<h3 style="margin-bottom:0.75rem">8. Limitation of Liability</h3>
<p class="text-muted" style="margin-bottom:1.5rem">CleanAtDoorstep is not liable for any indirect, incidental, or consequential damages arising from the use of our services. Maximum liability is limited to the amount paid for the specific service.</p>

<h3 style="margin-bottom:0.75rem">9. Changes to Terms</h3>
<p class="text-muted">We reserve the right to modify these terms at any time. Continued use of the platform after changes constitutes acceptance of the new terms.</p>
HTML;
            $data = [
                'content' => $html
            ];
        } else {
            $data = json_decode($terms, true);
        }

        return response()->json($data);
    }

    public function updateTermsAndConditions(Request $request)
    {
        $validated = $request->validate([
            'content' => 'required|string',
        ]);

        PlatformSetting::set('cms_terms', json_encode($validated));

        return response()->json([
            'message' => 'Terms and Conditions updated successfully',
            'data' => $validated
        ]);
    }

    public function getContactPage()
    {
        $contact = PlatformSetting::get('cms_contact');
        
        if (!$contact) {
            $html = <<<HTML
<h4 style="margin-bottom:1rem">Head Office</h4>
<div class="flex items-center gap-2" style="margin-bottom:0.75rem"><span>📍</span><span class="text-secondary" style="font-size:0.9rem">Linking Road, Bandra West, Mumbai - 400050</span></div>
<div class="flex items-center gap-2" style="margin-bottom:0.75rem"><span>📞</span><span class="text-secondary" style="font-size:0.9rem">+91 99999 99999</span></div>
<div class="flex items-center gap-2" style="margin-bottom:0.75rem"><span>✉️</span><span class="text-secondary" style="font-size:0.9rem">info@cleanatdoorstep.com</span></div>
<div class="flex items-center gap-2"><span>🕐</span><span class="text-secondary" style="font-size:0.9rem">Mon - Sat: 8AM - 8PM</span></div>
HTML;
            $data = [
                'content' => $html
            ];
        } else {
            $data = json_decode($contact, true);
        }

        return response()->json($data);
    }

    public function updateContactPage(Request $request)
    {
        $validated = $request->validate([
            'content' => 'required|string',
        ]);

        PlatformSetting::set('cms_contact', json_encode($validated));

        return response()->json([
            'message' => 'Contact Page updated successfully',
            'data' => $validated
        ]);
    }
}
