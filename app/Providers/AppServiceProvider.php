<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Auth\Notifications\ResetPassword;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        ResetPassword::createUrlUsing(function (object $notifiable, string $token) {
            $baseUrl = request()->header('origin') ?: request()->getSchemeAndHttpHost() ?: config('app.url');
            return rtrim($baseUrl, '/') . '/reset-password?token=' . $token . '&email=' . urlencode($notifiable->getEmailForPasswordReset());
        });

        ResetPassword::toMailUsing(function (object $notifiable, string $token) {
            $baseUrl = request()->header('origin') ?: request()->getSchemeAndHttpHost() ?: config('app.url');
            $url = rtrim($baseUrl, '/') . '/reset-password?token=' . $token . '&email=' . urlencode($notifiable->getEmailForPasswordReset());
            $expireMinutes = config('auth.passwords.'.config('auth.defaults.passwords').'.expire', 10);

            $appName = (config('app.name') && config('app.name') !== 'Laravel') ? config('app.name') : 'CleanAtDoorstep';

            return (new \Illuminate\Notifications\Messages\MailMessage)
                ->subject('Reset Your Password - ' . $appName)
                ->greeting('Hello ' . ($notifiable->name ?? '') . '!')
                ->line('We received a request to reset the password for your CleanAtDoorstep account.')
                ->action('Reset Password', $url)
                ->line('This password reset link will expire in ' . $expireMinutes . ' minutes.')
                ->line('If you did not request a password reset, you can safely ignore this email.');
        });
    }
}
