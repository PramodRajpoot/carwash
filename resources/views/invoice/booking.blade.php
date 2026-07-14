<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice - Booking #{{ $booking->id }}</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; line-height: 1.6; margin: 0; padding: 0; background: #f9f9f9; }
        .invoice-container { max-width: 800px; margin: 2rem auto; background: #fff; padding: 2rem 3rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #eaeaea; padding-bottom: 1.5rem; margin-bottom: 2rem; }
        .logo { font-size: 1.8rem; font-weight: 800; color: #2563eb; margin: 0; }
        .company-details { text-align: right; font-size: 0.9rem; color: #666; }
        .title { font-size: 2rem; font-weight: 700; color: #1e293b; margin: 0; text-transform: uppercase; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 2rem; }
        .info-box h4 { margin: 0 0 0.5rem; font-size: 1rem; color: #475569; border-bottom: 1px solid #eaeaea; padding-bottom: 0.25rem; }
        .info-box p { margin: 0.25rem 0; font-size: 0.95rem; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 2rem; }
        th, td { padding: 0.75rem; text-align: left; border-bottom: 1px solid #eaeaea; }
        th { background: #f8fafc; font-weight: 600; color: #475569; }
        .totals { display: flex; justify-content: flex-end; }
        .totals-table { width: 50%; }
        .totals-table td { border: none; padding: 0.5rem 0.75rem; }
        .totals-table tr:last-child { border-top: 2px solid #eaeaea; font-weight: 700; font-size: 1.1rem; }
        .footer { text-align: center; font-size: 0.85rem; color: #94a3b8; margin-top: 3rem; border-top: 1px solid #eaeaea; padding-top: 1rem; }
        .status-badge { display: inline-block; padding: 0.25rem 0.75rem; border-radius: 999px; font-size: 0.8rem; font-weight: 600; text-transform: uppercase; }
        .paid { background: #dcfce7; color: #166534; }
        .unpaid { background: #fee2e2; color: #991b1b; }
        .refunded { background: #f3e8ff; color: #6b21a8; }
        @media print {
            body { background: #fff; }
            .invoice-container { box-shadow: none; margin: 0; padding: 0; max-width: 100%; }
            .no-print { display: none; }
        }
        .btn-print { background: #2563eb; color: #fff; border: none; padding: 0.75rem 1.5rem; border-radius: 6px; font-weight: 600; cursor: pointer; text-decoration: none; display: inline-block; }
    </style>
</head>
<body>
    <div class="invoice-container">
        <div class="no-print" style="margin-bottom: 2rem; text-align: right;">
            <button onclick="window.print()" class="btn-print">Print Invoice</button>
        </div>
        
        <div class="header">
            <div>
                <h1 class="logo">CleanAtDoorstep</h1>
                <p style="color: #666; margin: 0.25rem 0 0;">Premium Car Wash Services</p>
            </div>
            <div class="company-details">
                <h2 class="title">INVOICE</h2>
                <p style="margin-top: 0.5rem;"><strong>Invoice #:</strong> INV-{{ sprintf('%06d', $booking->id) }}</p>
                <p><strong>Date:</strong> {{ \Carbon\Carbon::parse($booking->created_at)->format('M d, Y') }}</p>
            </div>
        </div>

        <div class="info-grid">
            <div class="info-box">
                <h4>Bill To</h4>
                <p><strong>{{ $booking->customer->name ?? 'N/A' }}</strong></p>
                <p>{{ $booking->customer->email ?? 'N/A' }}</p>
                <p>{{ $booking->customer->phone ?? 'N/A' }}</p>
            </div>
            <div class="info-box">
                <h4>Service Details</h4>
                <p><strong>Date:</strong> {{ \Carbon\Carbon::parse($booking->booking_date)->format('M d, Y') }}</p>
                <p><strong>Time Slot:</strong> {{ $booking->slot_time }}</p>
                <p><strong>Vehicle:</strong> {{ $booking->vehicle->make_model ?? 'N/A' }} ({{ $booking->vehicle->plate_number ?? 'N/A' }})</p>
            </div>
        </div>

        <table>
            <thead>
                <tr>
                    <th>Description</th>
                    <th>Status</th>
                    <th>Payment</th>
                    <th style="text-align: right;">Total Amount</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>
                        <strong>{{ $booking->package->name ?? 'Custom Service' }}</strong><br>
                        <span style="font-size: 0.85rem; color: #666;">
                            Assigned to: {{ $booking->franchisee->center_name ?? 'Unassigned' }}
                        </span>
                    </td>
                    <td>
                        {{ ucfirst($booking->status) }}
                    </td>
                    <td>
                        <span class="status-badge {{ strtolower($booking->payment_status) }}">
                            {{ $booking->payment_status }}
                        </span>
                    </td>
                    <td style="text-align: right;">₹{{ number_format($booking->total_price, 2) }}</td>
                </tr>
            </tbody>
        </table>

        <div class="totals">
            <table class="totals-table">
                <tr>
                    <td style="text-align: right; color: #475569;">Subtotal:</td>
                    <td style="text-align: right;">₹{{ number_format($booking->total_price, 2) }}</td>
                </tr>
                <tr>
                    <td style="text-align: right; color: #475569;">Tax (0%):</td>
                    <td style="text-align: right;">₹0.00</td>
                </tr>
                <tr>
                    <td style="text-align: right;"><strong>Total Due:</strong></td>
                    <td style="text-align: right;"><strong>₹{{ number_format($booking->total_price, 2) }}</strong></td>
                </tr>
            </table>
        </div>

        <div class="footer">
            <p>Thank you for choosing CleanAtDoorstep! For any inquiries, please contact support@cleanatdoorstep.com</p>
        </div>
    </div>
    
    <script>
        // Auto-print prompt when window loads
        window.onload = function() {
            // Uncomment the line below to auto-trigger print dialogue
            // window.print();
        };
    </script>
</body>
</html>
