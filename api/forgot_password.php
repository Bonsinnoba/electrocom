<?php
// backend/forgot_password.php
require_once 'db.php';
require_once 'security.php';
require_once 'notifications.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method Not Allowed']);
    exit;
}

// --- Self-healing Schema: password_resets table ---
try {
    $pdo->exec("CREATE TABLE IF NOT EXISTS password_resets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        token VARCHAR(255) NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX (email),
        INDEX (token)
    )");
} catch (Exception $e) {
    error_log("password_resets schema self-healing failed: " . $e->getMessage());
}

$rawData = file_get_contents('php://input');
$data = json_decode($rawData, true);

$email = sanitizeInput($data['email'] ?? '');
$method = sanitizeInput($data['method'] ?? 'email'); // 'email' or 'sms'

if (empty($email)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Email is required.']);
    exit;
}

try {
    // Check if user exists
    $stmt = $pdo->prepare("SELECT id, name, phone FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if ($user) {
        // Generate a secure token
        $token = bin2hex(random_bytes(32));
        $expiresAt = date('Y-m-d H:i:s', time() + 3600); // 1 hour expiry

        // Store token (delete old ones first for this email)
        $stmt = $pdo->prepare("DELETE FROM password_resets WHERE email = ?");
        $stmt->execute([$email]);

        $stmt = $pdo->prepare("INSERT INTO password_resets (email, token, expires_at) VALUES (?, ?, ?)");
        $stmt->execute([$email, $token, $expiresAt]);

        $notifier = new NotificationService();
        $config = require '.env.php';
        $frontendUrl = $config['FRONTEND_URL'] ?? 'http://localhost:5173';
        $resetLink = "{$frontendUrl}/reset-password?token={$token}&email=" . urlencode($email);

        if ($method === 'sms' && !empty($user['phone'])) {
            // Send SMS
            $msg = "ElectroCom: Use this link to reset your password: {$resetLink}. Expires in 1hr.";
            $notifier->sendSMS($user['phone'], $msg);
            logger('ok', 'AUTH_FORGOT_SMS', "Password reset link sent via SMS to {$user['phone']}");
            $actualMethod = 'sms';
        } else {
            // Default to Email
            $subject = "Reset Your ElectroCom Password";
            $msg = "Hello {$user['name']},\n\nWe received a request to reset your password. Click the link below to set a new password:\n\n{$resetLink}\n\nThis link will expire in 1 hour. If you didn't request this, please ignore this email.";
            $notifier->sendEmail($email, $subject, $msg);
            logger('ok', 'AUTH_FORGOT_EMAIL', "Password reset link sent to {$email}");
            $actualMethod = 'email';
        }
    } else {
        // User not found, but we keep it generic. 
        // We'll use the requested method for the message to avoid enumeration.
        $actualMethod = $method;
    }

    // Always return success to prevent enumeration
    $targetName = ($actualMethod === 'sms') ? 'phone number' : 'email address';
    echo json_encode([
        'success' => true,
        'message' => "If an account exists, a password reset link has been sent to your registered {$targetName}."
    ]);
} catch (PDOException $e) {
    error_log("Forgot password error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Internal Server Error during forgot password request.']);
}
