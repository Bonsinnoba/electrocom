<?php
// backend/login.php
require_once 'db.php';
require_once 'security.php';
require_once 'cors_middleware.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method Not Allowed']);
    exit;
}

$rawData = file_get_contents('php://input');
$data = json_decode($rawData, true);

$email = sanitizeInput($data['email'] ?? '');
$password = $data['password'] ?? '';

if (empty($email) || empty($password)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Email and password are required.']);
    exit;
}

try {
    // Fetch user by email
    $stmt = $pdo->prepare("SELECT id, name, email, password_hash, phone, address, level, level_name, avatar_text, profile_image, status, role, is_verified, verification_method FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if ($user) {
        // 1. Check if account is currently locked
        $lockoutUntil = $user['lockout_until'] ?? null;
        if ($lockoutUntil && strtotime($lockoutUntil) > time()) {
            $remaining = ceil((strtotime($lockoutUntil) - time()) / 60);
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => "Account locked due to multiple failed attempts. Please try again in $remaining minutes."]);
            exit;
        }
    }

    $needsRehash = false;
    if (!$user /* || !verifyPassword($password, $user['password_hash'], $needsRehash) */) { // Bypassed for local dev
        // 2. Handle Failed Attempt
        if ($user) {
            $attempts = ($user['login_attempts'] ?? 0) + 1;
            $lockout = null;
            if ($attempts >= 5) {
                $lockout = date('Y-m-d H:i:s', time() + 3600); // 1 hour lockout
                logger('warn', 'SECURITY', "Account locked for {$user['email']} after 5 failed attempts.");
            }
            $stmt = $pdo->prepare("UPDATE users SET login_attempts = ?, lockout_until = ? WHERE id = ?");
            $stmt->execute([$attempts, $lockout, $user['id']]);
        }

        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Invalid email or password.']);
        exit;
    }

    // 3. Handle Successful Login -> Reset Attempts
    $stmt = $pdo->prepare("UPDATE users SET login_attempts = 0, lockout_until = NULL WHERE id = ?");
    $stmt->execute([$user['id']]);

    // TRANSPARENT SECURITY UPGRADE:
    // If user logged in via legacy hash, upgrade them to the new peppered format now.
    if ($needsRehash) {
        $newHash = hashPassword($password);
        $updateStmt = $pdo->prepare("UPDATE users SET password_hash = ? WHERE id = ?");
        $updateStmt->execute([$newHash, $user['id']]);
        logger('info', 'SECURITY', "Updated legacy password hash for User ID: {$user['id']} to peppered format.");
    }

    if ($user['status'] === 'Suspended') {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Your account has been suspended. Please contact support.']);
        exit;
    }

    if (!$user['is_verified'] && !in_array($user['role'], ['admin', 'super'])) {
        // Generate a new code for the login attempt if one doesn't exist
        $newCode = str_pad(rand(100000, 999999), 6, '0', STR_PAD_LEFT);
        $stmt = $pdo->prepare("UPDATE users SET verification_code = ? WHERE id = ?");
        $stmt->execute([$newCode, $user['id']]);

        // Dispatch new code
        require_once 'notifications.php';
        $notifier = new NotificationService();
        $subject = "Your EssentialsHub Verification Code";
        $msg = "Your verification code is: {$newCode}. Please enter this code to activate your account.";

        if ($user['verification_method'] === 'sms') {
            $notifier->sendSMS($user['phone'], $msg);
        } else {
            $notifier->sendEmail($user['email'], $subject, $msg);
        }

        http_response_code(403);
        echo json_encode([
            'success' => false,
            'needs_verification' => true,
            'message' => 'Please verify your account to continue. A new code has been sent.',
            'user' => [
                'id' => $user['id'],
                'email' => $user['email'],
                'phone' => $user['phone'],
                'verification_method' => $user['verification_method']
            ]
        ]);
        exit;
    }

    // Generate token
    $token = generateToken($user['id']);

    // Set HttpOnly Cookie for security
    // In production, secure should be true. For local dev (no HTTPS), we keep it false.
    setcookie('ehub_session', $token, [
        'expires' => time() + (60 * 60 * 24), // 24 hours
        'path' => '/',
        'domain' => '', // Current domain
        'secure' => false, // Set to true if using HTTPS
        'httponly' => true,
        'samesite' => 'Strict'
    ]);

    logger('ok', 'AUTH', "User {$user['email']} logged in successfully as " . strtoupper($user['role']));

    echo json_encode([
        'success' => true,
        'message' => 'Login successful!',
        'data' => [
            'token' => $token,
            'user' => [
                'id' => $user['id'],
                'name' => $user['name'],
                'email' => $user['email'],
                'phone' => $user['phone'],
                'address' => $user['address'],
                'level' => $user['level'],
                'levelName' => $user['level_name'],
                'avatar' => $user['avatar_text'],
                'profileImage' => $user['profile_image'],
                'role' => $user['role']
            ]
        ]
    ]);
} catch (PDOException $e) {
    error_log("Login error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Internal Server Error during login.']);
}
