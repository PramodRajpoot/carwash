<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to CleanAt Doorstep</title>
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
                                Welcome to CleanAt Doorstep!
                            </h1>
                            <p style="margin:0; color:rgba(255,255,255,0.85); font-size:16px; font-weight:400;">
                                Your car deserves the best care — right at your doorstep.
                            </p>
                        </td>
                    </tr>

                    <!-- ═══ Greeting ═══ -->
                    <tr>
                        <td style="padding:40px 40px 0;">
                            <p style="margin:0 0 6px; color:#6366f1; font-size:14px; font-weight:600; text-transform:uppercase; letter-spacing:1px;">
                                Hello there 👋
                            </p>
                            <h2 style="margin:0 0 16px; color:#1e293b; font-size:24px; font-weight:700;">
                                {{ $userName }}
                            </h2>
                            <p style="margin:0; color:#475569; font-size:15px; line-height:1.7;">
                                Thank you for joining <strong style="color:#0ea5e9;">CleanAt Doorstep</strong>! We're thrilled to have you on board.
                                Your account is all set up and ready to go. Book your first professional car wash service and experience the convenience of doorstep cleaning.
                            </p>
                        </td>
                    </tr>

                    <!-- ═══ Feature Cards ═══ -->
                    <tr>
                        <td style="padding:32px 40px 0;">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <!-- Feature 1 -->
                                    <td width="48%" style="background:#f0f9ff; border-radius:12px; padding:20px; vertical-align:top;">
                                        <div style="font-size:28px; margin-bottom:8px;">📅</div>
                                        <h3 style="margin:0 0 6px; color:#0c4a6e; font-size:14px; font-weight:700;">Easy Booking</h3>
                                        <p style="margin:0; color:#64748b; font-size:13px; line-height:1.5;">
                                            Schedule a wash in just a few taps. Choose your time, we'll be there!
                                        </p>
                                    </td>
                                    <td width="4%"></td>
                                    <!-- Feature 2 -->
                                    <td width="48%" style="background:#fdf4ff; border-radius:12px; padding:20px; vertical-align:top;">
                                        <div style="font-size:28px; margin-bottom:8px;">💎</div>
                                        <h3 style="margin:0 0 6px; color:#581c87; font-size:14px; font-weight:700;">Earn Rewards</h3>
                                        <p style="margin:0; color:#64748b; font-size:13px; line-height:1.5;">
                                            Collect E-Points with every wash and unlock exclusive discounts!
                                        </p>
                                    </td>
                                </tr>
                                <tr><td colspan="3" style="height:12px;"></td></tr>
                                <tr>
                                    <!-- Feature 3 -->
                                    <td width="48%" style="background:#f0fdf4; border-radius:12px; padding:20px; vertical-align:top;">
                                        <div style="font-size:28px; margin-bottom:8px;">🏠</div>
                                        <h3 style="margin:0 0 6px; color:#14532d; font-size:14px; font-weight:700;">Doorstep Service</h3>
                                        <p style="margin:0; color:#64748b; font-size:13px; line-height:1.5;">
                                            No need to go anywhere. We come to your location — hassle-free!
                                        </p>
                                    </td>
                                    <td width="4%"></td>
                                    <!-- Feature 4 -->
                                    <td width="48%" style="background:#fff7ed; border-radius:12px; padding:20px; vertical-align:top;">
                                        <div style="font-size:28px; margin-bottom:8px;">🛡️</div>
                                        <h3 style="margin:0 0 6px; color:#7c2d12; font-size:14px; font-weight:700;">Premium Quality</h3>
                                        <p style="margin:0; color:#64748b; font-size:13px; line-height:1.5;">
                                            Trained professionals using eco-friendly products for a spotless finish.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- ═══ CTA Button ═══ -->
                    <tr>
                        <td style="padding:36px 40px 0; text-align:center;">
                            <a href="{{ $appUrl }}" target="_blank"
                               style="display:inline-block; background:linear-gradient(135deg,#0ea5e9,#6366f1); color:#ffffff; text-decoration:none; padding:16px 48px; border-radius:50px; font-size:16px; font-weight:700; letter-spacing:0.5px; box-shadow:0 4px 14px rgba(99,102,241,0.4);">
                                🚀 Book Your First Wash
                            </a>
                        </td>
                    </tr>

                    <!-- ═══ Referral Code Box ═══ -->
                    <tr>
                        <td style="padding:32px 40px 0;">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                                   style="background:linear-gradient(135deg,#ede9fe,#e0f2fe); border-radius:12px; border:2px dashed #a78bfa;">
                                <tr>
                                    <td style="padding:24px; text-align:center;">
                                        <p style="margin:0 0 4px; color:#6366f1; font-size:13px; font-weight:600; text-transform:uppercase; letter-spacing:1px;">
                                            🎁 Your Referral Code
                                        </p>
                                        <p style="margin:0 0 8px; color:#1e293b; font-size:28px; font-weight:800; letter-spacing:3px; font-family:'Courier New',Courier,monospace;">
                                            {{ $referralCode }}
                                        </p>
                                        <p style="margin:0; color:#64748b; font-size:13px; line-height:1.5;">
                                            Share this code with friends & family. When they sign up and book,
                                            <strong style="color:#6366f1;">you both earn rewards!</strong>
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- ═══ Account Details ═══ -->
                    <tr>
                        <td style="padding:32px 40px 0;">
                            <p style="margin:0 0 12px; color:#94a3b8; font-size:12px; font-weight:600; text-transform:uppercase; letter-spacing:1px;">
                                Your Account Details
                            </p>
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                                   style="background:#f8fafc; border-radius:10px; overflow:hidden;">
                                <tr>
                                    <td style="padding:14px 20px; border-bottom:1px solid #e2e8f0;">
                                        <span style="color:#94a3b8; font-size:13px;">Name</span>
                                    </td>
                                    <td style="padding:14px 20px; border-bottom:1px solid #e2e8f0; text-align:right;">
                                        <span style="color:#1e293b; font-size:14px; font-weight:600;">{{ $userName }}</span>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding:14px 20px;">
                                        <span style="color:#94a3b8; font-size:13px;">Email</span>
                                    </td>
                                    <td style="padding:14px 20px; text-align:right;">
                                        <span style="color:#1e293b; font-size:14px; font-weight:600;">{{ $userEmail }}</span>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- ═══ Divider ═══ -->
                    <tr>
                        <td style="padding:32px 40px 0;">
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
                            <!-- Social icons placeholder -->
                            <p style="margin:0 0 20px;">
                                <a href="#" style="display:inline-block; margin:0 6px; width:36px; height:36px; line-height:36px; background:#f1f5f9; border-radius:50%; text-decoration:none; font-size:16px;">📘</a>
                                <a href="#" style="display:inline-block; margin:0 6px; width:36px; height:36px; line-height:36px; background:#f1f5f9; border-radius:50%; text-decoration:none; font-size:16px;">📸</a>
                                <a href="#" style="display:inline-block; margin:0 6px; width:36px; height:36px; line-height:36px; background:#f1f5f9; border-radius:50%; text-decoration:none; font-size:16px;">🐦</a>
                            </p>
                            <p style="margin:0; color:#cbd5e1; font-size:11px; line-height:1.6;">
                                © {{ date('Y') }} CleanAt Doorstep. All rights reserved.<br>
                                You received this email because you created an account on our platform.<br>
                                <a href="{{ $appUrl }}" style="color:#6366f1; text-decoration:underline;">Visit our website</a>
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
