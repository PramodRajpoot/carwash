<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Time for Your Next Car Wash</title>
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
<body style="margin:0; padding:0; background-color:#f1f5f9; font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif; -webkit-font-smoothing:antialiased;">

    <!-- Outer Wrapper -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9; padding:40px 16px;">
        <tr>
            <td align="center">

                <!-- Main Card -->
                <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 10px 30px rgba(0,0,0,0.06); max-width:600px; width:100%;">

                    <!-- ═══ Header Banner ═══ -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #0ea5e9 0%, #3b82f6 50%, #6366f1 100%); padding:40px 32px 36px; text-align:center;">
                            <!-- App Badge -->
                            <div style="display:inline-block; background:rgba(255,255,255,0.18); border:1px solid rgba(255,255,255,0.3); border-radius:24px; padding:6px 16px; margin-bottom:16px;">
                                <span style="color:#ffffff; font-size:12px; font-weight:700; letter-spacing:1px; text-transform:uppercase;">
                                    ✨ CleanAt Doorstep
                                </span>
                            </div>
                            <h1 style="margin:0 0 10px; color:#ffffff; font-size:26px; font-weight:800; letter-spacing:-0.5px; line-height:1.25;">
                                Time for Your Next Car Wash! 🚗🧼
                            </h1>
                            <p style="margin:0; color:rgba(255,255,255,0.9); font-size:15px; font-weight:400; line-height:1.5;">
                                It's been {{ $daysSinceLastWash }} days since your last wash. Keep your car looking showroom fresh!
                            </p>
                        </td>
                    </tr>

                    <!-- ═══ Body Section ═══ -->
                    <tr>
                        <td style="padding:36px 36px 20px;">
                            <p style="margin:0 0 6px; color:#6366f1; font-size:13px; font-weight:700; text-transform:uppercase; letter-spacing:1px;">
                                Service Reminder 👋
                            </p>
                            <h2 style="margin:0 0 14px; color:#0f172a; font-size:22px; font-weight:700;">
                                Hello, {{ $userName }}!
                            </h2>
                            <p style="margin:0 0 24px; color:#475569; font-size:15px; line-height:1.65;">
                                We noticed you’ve used <strong>{{ $usedWashes }}</strong> of your <strong>{{ $totalWashes }}</strong> washes for your <strong>{{ $packageName }}</strong> plan. You still have <strong style="color:#10b981;">{{ $remainingWashes }} washes remaining</strong>!
                            </p>

                            <!-- ═══ Progress & Status Card ═══ -->
                            <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:14px; padding:24px; margin-bottom:28px;">
                                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                                    <span style="font-size:13px; font-weight:700; color:#64748b; text-transform:uppercase; letter-spacing:0.5px;">
                                        Wash Package Usage
                                    </span>
                                    <!-- Numbering Badge: Red & Green -->
                                    <span style="display:inline-block; background:#ffffff; border:1px solid #cbd5e1; border-radius:20px; padding:4px 12px; font-size:14px; font-weight:800;">
                                        <span style="color:#10b981;">{{ $usedWashes }}</span>
                                        <span style="color:#94a3b8; font-weight:400; margin:0 2px;">/</span>
                                        <span style="color:#ef4444;">{{ $totalWashes }}</span>
                                        <span style="color:#64748b; font-size:12px; font-weight:600; margin-left:4px;">Washes</span>
                                    </span>
                                </div>

                                <!-- Progress Bar -->
                                @php
                                    $pct = $totalWashes > 0 ? min(100, max(0, round(($usedWashes / $totalWashes) * 100))) : 0;
                                @endphp
                                <div style="background:#e2e8f0; height:10px; border-radius:6px; overflow:hidden; margin-bottom:18px;">
                                    <div style="background:linear-gradient(90deg, #10b981 0%, #06b6d4 100%); width:{{ $pct }}%; height:100%; border-radius:6px;"></div>
                                </div>

                                <!-- Details Table -->
                                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">
                                    <tr>
                                        <td style="padding:6px 0; color:#64748b;">📦 Package:</td>
                                        <td align="right" style="padding:6px 0; font-weight:700; color:#0f172a;">{{ $packageName }}</td>
                                    </tr>
                                    @if($vehicleName)
                                    <tr>
                                        <td style="padding:6px 0; color:#64748b;">🚗 Vehicle:</td>
                                        <td align="right" style="padding:6px 0; font-weight:700; color:#0f172a;">{{ $vehicleName }}</td>
                                    </tr>
                                    @endif
                                    <tr>
                                        <td style="padding:6px 0; color:#64748b;">✅ Completed Washes:</td>
                                        <td align="right" style="padding:6px 0; font-weight:800; color:#10b981;">{{ $usedWashes }} Wash</td>
                                    </tr>
                                    <tr>
                                        <td style="padding:6px 0; color:#64748b;">⏳ Remaining Washes:</td>
                                        <td align="right" style="padding:6px 0; font-weight:800; color:#ef4444;">{{ $remainingWashes }} Washes Left</td>
                                    </tr>
                                    @if($lastWashDate)
                                    <tr>
                                        <td style="padding:6px 0; color:#64748b;">📅 Last Wash Completed:</td>
                                        <td align="right" style="padding:6px 0; font-weight:600; color:#475569;">{{ date('d M Y', strtotime($lastWashDate)) }} ({{ $daysSinceLastWash }} days ago)</td>
                                    </tr>
                                    @endif
                                </table>
                            </div>

                            <!-- ═══ Primary CTA Button ═══ -->
                            <div style="text-align:center; margin:32px 0 28px;">
                                <a href="{{ $bookingUrl }}" target="_blank" style="display:inline-block; background:linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%); color:#ffffff; font-size:16px; font-weight:700; text-decoration:none; padding:16px 36px; border-radius:12px; box-shadow:0 4px 15px rgba(14,165,233,0.35); letter-spacing:0.3px;">
                                    📅 Book Your Next Wash Now →
                                </a>
                                <div style="margin-top:10px; font-size:12px; color:#94a3b8;">
                                    Doorstep service • Choose your preferred time slot & center
                                </div>
                            </div>

                            <!-- ═══ Maintenance Tip ═══ -->
                            <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:12px; padding:18px 20px; margin-top:20px;">
                                <div style="display:flex; align-items:flex-start;">
                                    <span style="font-size:22px; margin-right:12px; line-height:1;">💡</span>
                                    <div>
                                        <div style="font-weight:700; color:#166534; font-size:13px; margin-bottom:4px;">
                                            Why wash every 15 days?
                                        </div>
                                        <div style="font-size:13px; color:#15803d; line-height:1.5;">
                                            Road grime, bird droppings, and dust accumulation can oxidize car clear-coat if left over 2 weeks. A quick doorstep foam wash keeps your car protected and looking brand new.
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </td>
                    </tr>

                    <!-- ═══ Need Assistance ═══ -->
                    <tr>
                        <td style="padding:20px 36px 32px; border-top:1px solid #f1f5f9; text-align:center;">
                            <p style="margin:0 0 8px; font-size:13px; color:#64748b;">
                                Need help or want to reschedule? Contact us anytime.
                            </p>
                            <p style="margin:0; font-size:13px;">
                                <a href="{{ $appUrl }}/customer/support" style="color:#0ea5e9; text-decoration:none; font-weight:600;">Support Desk</a>
                                <span style="color:#cbd5e1; margin:0 8px;">•</span>
                                <a href="mailto:support@cleanatdoorstep.com" style="color:#0ea5e9; text-decoration:none; font-weight:600;">support@cleanatdoorstep.com</a>
                            </p>
                        </td>
                    </tr>

                    <!-- ═══ Footer ═══ -->
                    <tr>
                        <td style="background:#0f172a; padding:24px 32px; text-align:center;">
                            <p style="margin:0 0 6px; color:#94a3b8; font-size:12px;">
                                © {{ date('Y') }} CleanAt Doorstep. All rights reserved.
                            </p>
                            <p style="margin:0; color:#64748b; font-size:11px;">
                                You received this service reminder because you have an active package with remaining washes.
                            </p>
                        </td>
                    </tr>

                </table>

            </td>
        </tr>
    </table>

</body>
</html>
