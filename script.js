<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Chase Admin Portal</title>
    <style>
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }

        body {
            background-color: #f4f5f7;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
        }

        /* --- Login Screen --- */
        #login-screen {
            width: 100%;
            max-width: 400px;
            background: white;
            padding: 40px 30px;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .header-logo {
            background-color: #0b2b5e;
            color: white;
            text-align: center;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            font-weight: bold;
            font-size: 20px;
        }

        .input-group {
            margin-bottom: 15px;
        }

        .input-group label {
            display: block;
            margin-bottom: 5px;
            font-size: 14px;
            color: #333;
        }

        .input-group input {
            width: 100%;
            padding: 12px;
            border: 1px solid #ccc;
            border-radius: 6px;
            font-size: 16px;
        }

        .btn {
            width: 100%;
            padding: 14px;
            background-color: #1f4fb2;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            margin-top: 10px;
        }

        .btn:hover {
            background-color: #163c8a;
        }

        .error {
            color: red;
            font-size: 14px;
            margin-top: 10px;
            text-align: center;
            display: none;
        }

        /* --- Dashboard --- */
        #dashboard-screen {
            display: none;
            width: 100%;
            max-width: 400px;
            background: white;
            padding: 20px;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            text-align: center;
        }

        /* --- Receipt Modal (Exact Match to Image) --- */
        .modal-overlay {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.6);
            z-index: 1000;
            justify-content: center;
            align-items: flex-end; /* Aligns to bottom */
        }

        .receipt-modal {
            background: white;
            width: 100%;
            max-width: 500px;
            border-radius: 20px 20px 0 0;
            padding: 30px 20px;
            position: relative;
            animation: slideUp 0.3s ease-out;
        }

        @keyframes slideUp {
            from { transform: translateY(100%); }
            to { transform: translateY(0); }
        }

        .success-icon {
            width: 60px;
            height: 60px;
            background-color: #388e3c;
            border-radius: 50%;
            display: flex;
            justify-content: center;
            align-items: center;
            margin: 0 auto 20px auto;
        }

        .success-icon svg {
            width: 35px;
            height: 35px;
            fill: none;
            stroke: white;
            stroke-width: 3;
            stroke-linecap: round;
            stroke-linejoin: round;
        }

        .receipt-modal h2 {
            text-align: center;
            font-size: 24px;
            color: #2c2c2c;
            margin-bottom: 10px;
            font-weight: 800;
        }

        .receipt-modal .amount {
            text-align: center;
            font-size: 40px;
            font-weight: 800;
            color: #2c2c2c;
            margin-bottom: 15px;
            letter-spacing: -1px;
        }

        .receipt-modal .status {
            text-align: center;
            color: #6b6b6b;
            font-size: 16px;
            margin-bottom: 25px;
        }

        .details-box {
            background-color: #f8f8fa;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 25px;
        }

        .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            border-bottom: 1px solid #eaeaea;
            font-size: 15px;
            color: #4a4a4a;
        }

        .detail-row:last-child {
            border-bottom: none;
        }

        .detail-row span:last-child {
            font-weight: 600;
            color: #2c2c2c;
        }

        .detail-row .sent-to {
            text-decoration: underline;
            font-weight: 800;
            color: #1a1a1a;
        }

        .done-btn {
            width: 100%;
            padding: 16px;
            background-color: #1f4fb2;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 18px;
            font-weight: 600;
            cursor: pointer;
        }

        .done-btn:hover {
            background-color: #163c8a;
        }

    </style>
</head>
<body>

    <!-- LOGIN SCREEN -->
    <div id="login-screen">
        <div class="header-logo">Chase Bank Admin</div>
        <div class="input-group">
            <label>Admin Email</label>
            <input type="email" id="username" placeholder="Enter admin email">
        </div>
        <div class="input-group">
            <label>Password</label>
            <input type="password" id="password" placeholder="Enter password">
        </div>
        <button class="btn" onclick="login()">Log In</button>
        <div id="login-error" class="error">Invalid Credentials</div>
    </div>

    <!-- DASHBOARD -->
    <div id="dashboard-screen">
        <h2 style="margin-bottom: 20px; color: #0b2b5e;">Admin Dashboard</h2>
        <p style="margin-bottom: 20px; color: #666;">Welcome back, Admin.</p>
        <button class="btn" onclick="initiateTransfer()">Initiate Transfer</button>
    </div>

    <!-- RECEIPT MODAL (Matches your image) -->
    <div class="modal-overlay" id="receipt-modal">
        <div class="receipt-modal">
            
            <div class="success-icon">
                <svg viewBox="0 0 24 24">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
            </div>

            <h2>Transfer Successful</h2>
            <div class="amount">$50000.00</div>
            <div class="status">Transaction Completed</div>

            <div class="details-box">
                <div class="detail-row">
                    <span>Sent To:</span>
                    <span class="sent-to">9283726262</span>
                </div>
                <div class="detail-row">
                    <span>Date:</span>
                    <span id="receipt-date"></span>
                </div>
                <div class="detail-row">
                    <span>Ref ID:</span>
                    <span id="receipt-ref"></span>
                </div>
            </div>

            <button class="done-btn" onclick="closeReceipt()">Done</button>
        </div>
    </div>

    <!-- JAVASCRIPT LOGIC -->
    <script>
        // --- Hardcoded Admin Credentials ---
        const ADMIN_EMAIL = "admin@chase.com";
        const ADMIN_PASS = "Emma123@sa";

        function login() {
            const user = document.getElementById('username').value.trim();
            const pass = document.getElementById('password').value.trim();
            const errorDiv = document.getElementById('login-error');

            if (user === ADMIN_EMAIL && pass === ADMIN_PASS) {
                document.getElementById('login-screen').style.display = 'none';
                document.getElementById('dashboard-screen').style.display = 'block';
                errorDiv.style.display = 'none';
            } else {
                errorDiv.style.display = 'block';
            }
        }

        function initiateTransfer() {
            // Generate current date formatted exactly like the image (12/4/2025, 12:36:56 AM)
            const now = new Date();
            const dateStr = now.toLocaleString('en-US', {
                month: 'numeric',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: 'numeric',
                second: 'numeric',
                hour12: true
            });

            // Generate a random Reference ID (e.g., Ref: 910229159)
            const randomRef = Math.floor(Math.random() * 900000000) + 100000000;

            // Inject the dynamic data into the receipt
            document.getElementById('receipt-date').innerText = dateStr;
            document.getElementById('receipt-ref').innerText = "Ref: " + randomRef;

            // Show the modal
            document.getElementById('receipt-modal').style.display = 'flex';
        }

        function closeReceipt() {
            document.getElementById('receipt-modal').style.display = 'none';
        }
    </script>
</body>
</html>