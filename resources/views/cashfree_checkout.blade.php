<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Secure Payment | CleanAt Doorstep</title>
    <style>
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: #0f172a;
            color: #f8fafc;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 24px;
            text-align: center;
        }
        .container {
            max-width: 400px;
            width: 100%;
            background: #1e293b;
            border-radius: 20px;
            padding: 32px 24px;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.4);
            border: 1px solid rgba(255, 255, 255, 0.08);
        }
        .shield-icon {
            width: 56px;
            height: 56px;
            background: rgba(2, 132, 199, 0.15);
            border: 1px solid rgba(2, 132, 199, 0.4);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 18px;
            font-size: 26px;
        }
        h2 {
            font-size: 1.25rem;
            font-weight: 700;
            color: #f8fafc;
            margin-bottom: 8px;
            letter-spacing: -0.01em;
        }
        p {
            font-size: 0.9rem;
            color: #94a3b8;
            line-height: 1.45;
            margin-bottom: 24px;
        }
        .spinner {
            width: 38px;
            height: 38px;
            border: 3px solid rgba(2, 132, 199, 0.2);
            border-top: 3px solid #0284c7;
            border-radius: 50%;
            animation: spin 0.9s cubic-bezier(0.6, 0.2, 0.4, 0.8) infinite;
            margin: 0 auto 16px;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        .security-badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background: rgba(16, 185, 129, 0.1);
            color: #10b981;
            padding: 6px 14px;
            border-radius: 9999px;
            font-size: 0.75rem;
            font-weight: 600;
            border: 1px solid rgba(16, 185, 129, 0.25);
        }
        .error-box {
            display: none;
            background: rgba(239, 68, 68, 0.1);
            border: 1px solid rgba(239, 68, 68, 0.3);
            color: #fca5a5;
            padding: 12px;
            border-radius: 10px;
            font-size: 0.85rem;
            margin-top: 16px;
        }
    </style>
    <!-- Cashfree Payment SDK v3 -->
    <script src="https://sdk.cashfree.com/js/v3/cashfree.js"></script>
</head>
<body>
    <div class="container">
        <div class="shield-icon">🛡️</div>
        <div id="loader-spinner" class="spinner"></div>
        <h2 id="status-title">Launching Secure Checkout</h2>
        <p id="status-desc">Connecting with Cashfree Payment Gateway to complete your booking...</p>
        <div class="security-badge">
            <span>🔒 256-Bit SSL Encrypted</span>
        </div>
        <div id="error-box" class="error-box"></div>
    </div>

    <script>
        window.addEventListener('load', function() {
            try {
                const mode = "{{ $environment }}" === 'production' ? 'production' : 'sandbox';
                const cashfree = Cashfree({ mode: mode });
                const paymentSessionId = "{{ $paymentSessionId }}";

                if (!paymentSessionId) {
                    showError("Missing payment session ID.");
                    return;
                }

                cashfree.checkout({
                    paymentSessionId: paymentSessionId,
                    redirectTarget: "_self"
                }).then(function(result) {
                    if (result && result.error) {
                        showError(result.error.message || "Failed to initialize payment.");
                    }
                }).catch(function(err) {
                    showError(err.message || "An unexpected checkout error occurred.");
                });
            } catch (err) {
                showError(err.message || "Could not load Cashfree SDK.");
            }
        });

        function showError(msg) {
            document.getElementById('loader-spinner').style.display = 'none';
            document.getElementById('status-title').textContent = 'Unable to Load Payment';
            document.getElementById('status-desc').textContent = 'Please return to the app and retry.';
            const eb = document.getElementById('error-box');
            eb.style.display = 'block';
            eb.textContent = msg;
        }
    </script>
</body>
</html>
