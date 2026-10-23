<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password - CleanAt Doorstep</title>
</head>
<body style="margin:0; padding:0; background-color:#f0f4f8; font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">

    <!-- Outer wrapper -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f4f8; padding:40px 20px;">
        <tr>
            <td align="center">

                <!-- Email card -->
                <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.08); max-width:600px; width:100%;">

                    <!-- ═══ Header Banner ═══ -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #0ea5e9 0%, #6366f1 50%, #8b5cf6 100%); padding:40px 40px 36px; text-align:center;">
                            <div style="margin-bottom:16px;">
                                @if(file_exists(public_path('logo.png')))
                                    <img src="{{ $message->embed(public_path('logo.png')) }}" alt="CleanAt Doorstep" width="80" height="80" style="display:inline-block; background:rgba(255,255,255,0.95); border-radius:14px; padding:8px;">
                                @else
                                    <div style="display:inline-block; width:64px; height:64px; line-height:64px; border-radius:14px; background:rgba(255,255,255,0.2); font-size:32px;">🔑</div>
                                @endif
                            </div>
                            <h1 style="margin:0 0 6px; color:#ffffff; font-size:26px; font-weight:700; letter-spacing:-0.5px;">
                                Password Reset Request
                            </h1>
                            <p style="margin:0; color:rgba(255,255,255,0.9); font-size:15px; font-weight:400;">
                                Secure access to your CleanAt Doorstep account
                            </p>
                        </td>
                    </tr>

                    <!-- ═══ Greeting & Content ═══ -->
                    <tr>
                        <td style="padding:36px 40px 0;">
                            <p style="margin:0 0 6px; color:#6366f1; font-size:14px; font-weight:600; text-transform:uppercase; letter-spacing:1px;">
                                Hello {{ $user->name ?? 'User' }} 👋
                            </p>
                            <h2 style="margin:0 0 14px; color:#1e293b; font-size:19px; font-weight:600;">
                                Reset Your Account Password
                            </h2>
                            <p style="margin:0 0 16px; color:#475569; font-size:15px; line-height:1.7;">
                                We received a request to reset the password for your CleanAt Doorstep account. Click the button below to choose your new password.
                            </p>
                        </td>
                    </tr>

                    <!-- ═══ Action Button ═══ -->
                    <tr>
                        <td style="padding:16px 40px 24px; text-align:center;">
                            <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
                                <tr>
                                    <td align="center" style="border-radius:10px; background:linear-gradient(135deg, #0ea5e9, #6366f1);">
                                        <a href="{{ $url }}" target="_blank" style="display:inline-block; padding:14px 38px; color:#ffffff; font-size:16px; font-weight:700; text-decoration:none; border-radius:10px;">
                                            Reset Password
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <div style="margin-top:20px; display:inline-block; background:#fef3c7; border:1px solid #fde68a; border-radius:8px; padding:8px 18px;">
                                <p style="margin:0; color:#b45309; font-size:13px; font-weight:600;">
                                    ⏱️ This link will expire in {{ $expireMinutes ?? 10 }} minutes
                                </p>
                            </div>
                        </td>
                    </tr>

                    <!-- ═══ Fallback Link ═══ -->
                    <tr>
                        <td style="padding:0 40px 24px;">
                            <p style="margin:0 0 6px; color:#64748b; font-size:13px; line-height:1.6;">
                                If you're having trouble clicking the button, copy and paste the URL below into your web browser:
                            </p>
                            <p style="margin:0; word-break:break-all;">
                                <a href="{{ $url }}" target="_blank" style="color:#6366f1; font-size:12px; text-decoration:underline;">
                                    {{ $url }}
                                </a>
                            </p>
                        </td>
                    </tr>

                    <!-- ═══ Divider ═══ -->
                    <tr>
                        <td style="padding:0 40px;">
                            <div style="height:1px; background:#e2e8f0;"></div>
                        </td>
                    </tr>

                    <!-- ═══ Security Notice ═══ -->
                    <tr>
                        <td style="padding:20px 40px 0;">
                            <p style="margin:0; color:#94a3b8; font-size:12px; line-height:1.6;">
                                🔒 <strong>Security Notice:</strong> If you did not request this password reset, no further action is required. Your password will remain unchanged and your account is secure.
                            </p>
                        </td>
                    </tr>

                    <!-- ═══ Footer ═══ -->
                    <tr>
                        <td style="padding:24px 40px 36px; text-align:center;">
                            <p style="margin:0 0 6px; color:#1e293b; font-size:15px; font-weight:700;">
                                CleanAt Doorstep
                            </p>
                            <p style="margin:0 0 12px; color:#94a3b8; font-size:12px; line-height:1.5;">
                                Professional car wash services at your doorstep.<br>
                                Quality • Convenience • Trust
                            </p>
                            <p style="margin:0; color:#cbd5e1; font-size:11px; line-height:1.5;">
                                © {{ date('Y') }} CleanAt Doorstep. All rights reserved.
                            </p>
                        </td>
                    </tr>

                </table>
                <!-- /Email card -->

            </td>
        </tr>
    </table>

</body>
</html>
