<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Login OTP - CleanAt Doorstep</title>
    <!--[if mso]>
    <noscript>
        <xml>
            <o:OfficeDocumentSettings>
                <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
        </xml>
    </noscript>
    <![endif]-->
</head>
<body style="margin:0; padding:0; background-color:#f0f4f8; font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">

    <!-- Outer wrapper -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f4f8; padding:40px 20px;">
        <tr>
            <td align="center">

                <!-- Email card -->
                <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.08);">

                    <!-- ═══ Header Banner ═══ -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #0ea5e9 0%, #6366f1 50%, #8b5cf6 100%); padding:48px 40px 40px; text-align:center;">
                            <!-- Car wash icon -->
                            <div style="margin-bottom:20px;">
                                <img src="{{ $message->embed(public_path('logo.png')) }}" alt="CleanAt Doorstep" width="100" height="100" style="display:inline-block; background:rgba(255,255,255,0.9); border-radius:16px; padding:10px;">
                            </div>
                            <h1 style="margin:0 0 8px; color:#ffffff; font-size:28px; font-weight:700; letter-spacing:-0.5px;">
                                Your Login OTP
                            </h1>
                            <p style="margin:0; color:rgba(255,255,255,0.85); font-size:16px; font-weight:400;">
                                Secure access to your CleanAt Doorstep account
                            </p>
                        </td>
                    </tr>

                    <!-- ═══ Greeting & OTP ═══ -->
                    <tr>
                        <td style="padding:40px 40px 0;">
                            <p style="margin:0 0 6px; color:#6366f1; font-size:14px; font-weight:600; text-transform:uppercase; letter-spacing:1px;">
                                Hello {{ explode(' ', $user->name)[0] }} 👋
                            </p>
                            <h2 style="margin:0 0 16px; color:#1e293b; font-size:20px; font-weight:600;">
                                Here is your One-Time Password
                            </h2>
                            <p style="margin:0; color:#475569; font-size:15px; line-height:1.7;">
                                Please use the following 4-digit code to complete your login. This OTP is valid for <strong>10 minutes</strong>.
                            </p>
                        </td>
                    </tr>

                    <!-- ═══ OTP Display Box ═══ -->
                    <tr>
                        <td style="padding:32px 40px 0; text-align:center;">
                            <div style="display:inline-block; background:linear-gradient(135deg,#ede9fe,#e0f2fe); border-radius:12px; border:2px dashed #a78bfa; padding:20px 40px;">
                                <p style="margin:0; color:#1e293b; font-size:36px; font-weight:800; letter-spacing:8px; font-family:'Courier New',Courier,monospace;">
                                    {{ $otp }}
                                </p>
                            </div>
                            <p style="margin:20px 0 0; color:#ef4444; font-size:13px; font-weight:600;">
                                Do not share this OTP with anyone!
                            </p>
                        </td>
                    </tr>

                    <!-- ═══ Divider ═══ -->
                    <tr>
                        <td style="padding:40px 40px 0;">
                            <div style="height:1px; background:linear-gradient(to right, transparent, #e2e8f0, transparent);"></div>
                        </td>
                    </tr>

                    <!-- ═══ Footer ═══ -->
                    <tr>
                        <td style="padding:24px 40px 36px; text-align:center;">
                            <p style="margin:0 0 8px; color:#1e293b; font-size:16px; font-weight:700;">
                                CleanAt Doorstep
                            </p>
                            <p style="margin:0 0 16px; color:#94a3b8; font-size:13px; line-height:1.5;">
                                Professional car wash services at your doorstep.<br>
                                Quality • Convenience • Trust
                            </p>
                            <p style="margin:0; color:#cbd5e1; font-size:11px; line-height:1.6;">
                                © {{ date('Y') }} CleanAt Doorstep. All rights reserved.<br>
                                If you did not request this OTP, please ignore this email.
                            </p>
                        </td>
                    </tr>

                </table>
                <!-- /Email card -->

            </td>
        </tr>
    </table>
    <!-- /Outer wrapper -->

</body>
</html>
