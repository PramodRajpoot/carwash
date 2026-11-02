<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice - Booking #{{ $booking->id }}</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; line-height: 1.6; margin: 0; padding: 0; background: #f9f9f9; }
        .invoice-container { max-width: 800px; margin: 2rem auto; background: #fff; padding: 2rem 3rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1); border-radius: 8px; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #eaeaea; padding-bottom: 1.5rem; margin-bottom: 2rem; }
        .invoice-logo { height: 68px; max-width: 220px; object-fit: contain; display: block; margin-bottom: 0.35rem; }
        .company-details { text-align: right; font-size: 0.9rem; color: #666; }
        .title { font-size: 2rem; font-weight: 700; color: #1e293b; margin: 0; text-transform: uppercase; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 2rem; }
        .info-box h4 { margin: 0 0 0.5rem; font-size: 1rem; color: #475569; border-bottom: 1px solid #eaeaea; padding-bottom: 0.25rem; }
        .info-box p { margin: 0.25rem 0; font-size: 0.95rem; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 1.5rem; }
        th, td { padding: 0.75rem; text-align: left; border-bottom: 1px solid #eaeaea; }
        th { background: #f8fafc; font-weight: 600; color: #475569; }
        .totals { display: flex; justify-content: flex-end; margin-bottom: 1.5rem; }
        .totals-table { width: 60%; }
        .totals-table td { border: none; padding: 0.4rem 0.75rem; }
        .footer { text-align: center; font-size: 0.85rem; color: #94a3b8; margin-top: 2.5rem; border-top: 1px solid #eaeaea; padding-top: 1rem; }
        .status-badge { display: inline-block; padding: 0.25rem 0.75rem; border-radius: 999px; font-size: 0.8rem; font-weight: 600; text-transform: uppercase; }
        .paid { background: #dcfce7; color: #166534; }
        .unpaid { background: #fee2e2; color: #991b1b; }
        .pending_payment { background: #fef3c7; color: #92400e; }
        .partially_paid { background: #e0f2fe; color: #0369a1; }
        .refunded { background: #f3e8ff; color: #6b21a8; }
        .gst-badge { display: inline-block; background: #eef2ff; color: #4338ca; font-size: 0.75rem; font-weight: 600; padding: 0.15rem 0.5rem; border-radius: 4px; margin-left: 0.4rem; }
        @media print {
            body { background: #fff; }
            .invoice-container { box-shadow: none; margin: 0; padding: 0; max-width: 100%; }
            .no-print { display: none; }
            .invoice-logo { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
        .btn-print { background: #2563eb; color: #fff; border: none; padding: 0.75rem 1.5rem; border-radius: 6px; font-weight: 600; cursor: pointer; text-decoration: none; display: inline-block; }
    </style>
</head>
<body>
    @php
        $logoPath = public_path('logo.png');
        $logoSrc = file_exists($logoPath) ? 'data:image/png;base64,' . base64_encode(file_get_contents($logoPath)) : asset('logo.png');
        
        $basePrice = (float)($booking->package->price ?? 0);
        $addonServices = is_array($booking->addon_services) ? $booking->addon_services : (json_decode($booking->addon_services, true) ?? []);

        // Taxable subtotal and GST
        $gstAmount = (float)($booking->gst_amount ?? 0);
        $totalPrice = (float)$booking->total_price;
        if ($gstAmount > 0) {
            $taxableSubtotal = max(0, $totalPrice - $gstAmount);
            $cgst = round($gstAmount / 2, 2);
            $sgst = round($gstAmount - $cgst, 2);
        } else {
            if ($booking->payment_method !== 'subscription' && $totalPrice > 0) {
                $taxableSubtotal = round($totalPrice / 1.18, 2);
                $gstAmount = round($totalPrice - $taxableSubtotal, 2);
                $cgst = round($gstAmount / 2, 2);
                $sgst = round($gstAmount - $cgst, 2);
            } else {
                $taxableSubtotal = $totalPrice;
                $cgst = 0;
                $sgst = 0;
            }
        }
    @endphp
    <div class="invoice-container">
        <div class="no-print" style="margin-bottom: 2rem; text-align: right;">
            <button onclick="window.print()" class="btn-print">Print Invoice</button>
        </div>
        
        <div class="header">
            <div>
                <img src="{{ $logoSrc }}" alt="CleanAtDoorstep" class="invoice-logo">
                <p style="color: #666; margin: 0.25rem 0 0; font-size: 0.95rem;">Premium Doorstep Car Wash Services</p>
                <p style="color: #64748b; margin: 0.15rem 0 0; font-size: 0.85rem;">GSTIN: 07AAACC4111H1Z5 (18% GST Applicable)</p>
            </div>
            <div class="company-details">
                <h2 class="title">TAX INVOICE</h2>
                <p style="margin-top: 0.5rem;"><strong>Invoice #:</strong> INV-{{ sprintf('%06d', $booking->id) }}</p>
                <p><strong>Booking ID:</strong> #{{ $booking->id }}</p>
                <p><strong>Date:</strong> {{ \Carbon\Carbon::parse($booking->created_at ?? now())->format('M d, Y') }}</p>
            </div>
        </div>

        <div class="info-grid">
            <div class="info-box">
                <h4>Bill To (Customer)</h4>
                <p><strong>{{ $booking->customer->name ?? 'N/A' }}</strong></p>
                <p>{{ $booking->customer->email ?? 'N/A' }}</p>
                <p>{{ $booking->customer->phone ?? 'N/A' }}</p>
                @if(!empty($booking->address))
                <p style="color: #64748b; font-size: 0.85rem;"><strong>Service Address:</strong> {{ $booking->address }}</p>
                @endif
            </div>
            <div class="info-box">
                <h4>Service & Vehicle Details</h4>
                <p><strong>Service Date:</strong> {{ \Carbon\Carbon::parse($booking->booking_date)->format('M d, Y') }}</p>
                <p><strong>Slot Time:</strong> {{ $booking->slot_time }}</p>
                <p><strong>Vehicle:</strong> {{ $booking->vehicle->make_model ?? 'N/A' }} ({{ $booking->vehicle->plate_number ?? 'N/A' }})</p>
                <p><strong>Service Center:</strong> {{ $booking->franchisee->center_name ?? 'CleanAtDoorstep Network' }}</p>
                <p>
                    <strong>Payment:</strong>
                    <span class="status-badge {{ strtolower(str_replace(' ', '_', $booking->payment_status)) }}">
                        {{ ucwords(str_replace('_', ' ', $booking->payment_status)) }}
                    </span>
                    <span style="font-size: 0.85rem; color: #64748b; margin-left: 0.5rem;">
                        via {{ strtoupper($booking->payment_method ?? 'COD') }}
                    </span>
                </p>
            </div>
        </div>

        <table>
            <thead>
                <tr>
                    <th style="width: 55%;">Item / Description</th>
                    <th style="text-align: center; width: 10%;">Qty</th>
                    <th style="text-align: right; width: 15%;">Rate</th>
                    <th style="text-align: right; width: 20%;">Amount</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>
                        <strong>{{ $booking->package->name ?? 'Custom Car Wash Service' }}</strong>
                        <span class="gst-badge">GST 18%</span>
                        <br>
                        <span style="font-size: 0.85rem; color: #64748b;">
                            Vehicle Type: {{ ucfirst($booking->vehicle->vehicle_type ?? 'Car') }}
                        </span>
                    </td>
                    <td style="text-align: center;">1</td>
                    <td style="text-align: right;">₹{{ number_format($basePrice, 2) }}</td>
                    <td style="text-align: right;">₹{{ number_format($basePrice, 2) }}</td>
                </tr>
                @foreach($addonServices as $addon)
                @php
                    $addonName = is_array($addon) ? ($addon['name'] ?? 'Add-on') : $addon;
                    $addonRate = is_array($addon) ? (float)($addon['price'] ?? 0) : 0;
                @endphp
                <tr>
                    <td>
                        <span style="color: #334155;">+ Add-on: {{ $addonName }}</span>
                        <span class="gst-badge">GST 18%</span>
                    </td>
                    <td style="text-align: center;">1</td>
                    <td style="text-align: right;">₹{{ number_format($addonRate, 2) }}</td>
                    <td style="text-align: right;">₹{{ number_format($addonRate, 2) }}</td>
                </tr>
                @endforeach
                @if($booking->coupon_discount > 0)
                <tr style="color: #16a34a; background-color: #f0fdf4;">
                    <td colspan="3">Coupon Discount ({{ $booking->coupon_code }}):</td>
                    <td style="text-align: right;">- ₹{{ number_format($booking->coupon_discount, 2) }}</td>
                </tr>
                @endif
                @if($booking->epoints_used > 0)
                <tr style="color: #16a34a; background-color: #f0fdf4;">
                    <td colspan="3">E-Points Redeemed ({{ $booking->epoints_used }} pts):</td>
                    <td style="text-align: right;">- ₹{{ number_format($booking->epoints_used, 2) }}</td>
                </tr>
                @endif
                @if($booking->earning_money_used > 0)
                <tr style="color: #16a34a; background-color: #f0fdf4;">
                    <td colspan="3">Earning Money Redeemed:</td>
                    <td style="text-align: right;">- ₹{{ number_format($booking->earning_money_used, 2) }}</td>
                </tr>
                @endif
            </tbody>
        </table>

        <div class="totals">
            <table class="totals-table">
                <tr>
                    <td style="text-align: right; color: #475569;">Taxable Subtotal:</td>
                    <td style="text-align: right; font-weight: 500;">₹{{ number_format($taxableSubtotal, 2) }}</td>
                </tr>
                <tr>
                    <td style="text-align: right; color: #475569;">CGST (9.0%):</td>
                    <td style="text-align: right;">₹{{ number_format($cgst, 2) }}</td>
                </tr>
                <tr>
                    <td style="text-align: right; color: #475569;">SGST (9.0%):</td>
                    <td style="text-align: right;">₹{{ number_format($sgst, 2) }}</td>
                </tr>
                <tr style="border-top: 1px dashed #cbd5e1; font-weight: 600;">
                    <td style="text-align: right; color: #1e293b;">Total GST (18.0%):</td>
                    <td style="text-align: right; color: #1e293b;">₹{{ number_format($gstAmount, 2) }}</td>
                </tr>
                <tr style="border-top: 2px solid #1e293b; font-size: 1.15rem; font-weight: 700; color: #1e293b;">
                    <td style="text-align: right;">Grand Total (incl. GST):</td>
                    <td style="text-align: right;">₹{{ number_format($totalPrice, 2) }}</td>
                </tr>
                @if($booking->payment_type === 'partial')
                <tr>
                    <td style="text-align: right; color: #0284c7; padding-top: 0.5rem; font-weight: 500;">Advance Paid:</td>
                    <td style="text-align: right; color: #0284c7; padding-top: 0.5rem; font-weight: 500;">₹{{ number_format($booking->paid_amount, 2) }}</td>
                </tr>
                <tr>
                    <td style="text-align: right; color: #dc2626; font-weight: 600;">Balance Due at Wash:</td>
                    <td style="text-align: right; color: #dc2626; font-weight: 600;">₹{{ number_format(max(0, $totalPrice - $booking->paid_amount), 2) }}</td>
                </tr>
                @else
                <tr>
                    <td style="text-align: right; color: #475569; padding-top: 0.5rem;">Amount Paid:</td>
                    <td style="text-align: right; padding-top: 0.5rem; font-weight: 500;">₹{{ number_format($booking->paid_amount, 2) }}</td>
                </tr>
                @endif
            </table>
        </div>

        <div class="footer">
            <p>This is a computer-generated invoice and requires no physical signature.</p>
            <p>Thank you for choosing CleanAtDoorstep! For any queries or support, reach us at support@cleanatdoorstep.com</p>
        </div>
    </div>
</body>
</html>
