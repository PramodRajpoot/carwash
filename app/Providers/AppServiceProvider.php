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
            return url('/reset-password?token='.$token.'&email='.$notifiable->getEmailForPasswordReset());
        });

        ResetPassword::toMailUsing(function (object $notifiable, string $token) {
            $url = url('/reset-password?token='.$token.'&email='.$notifiable->getEmailForPasswordReset());

            return (new \Illuminate\Notifications\Messages\MailMessage)
                ->subject('Reset Your Password - ' . config('app.name'))
                ->greeting('Hello ' . ($notifiable->name ?? '') . '!')
                ->line('We received a request to reset the password for your CleanAtDoorstep account.')
                ->action('Reset Password', $url)
                ->line('This password reset link will expire in '.config('auth.passwords.'.config('auth.defaults.passwords').'.expire').' minutes.')
                ->line('If you did not request a password reset, you can safely ignore this email.');
        });
    }
}
