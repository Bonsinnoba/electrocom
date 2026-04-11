<?php
// backend/login.php
require_once 'db.php';
require_once 'security.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method Not Allowed']);
    exit;
}

$rawData = file_get_contents('php://input');
$data = json_decode($rawData, true);

$email = trim($data['email'] ?? '');
$password = $data['password'] ?? '';

if (empty($email) || empty($password)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Email and password are required.']);
    exit;
}

try {
    // Load security settings
    $settingsFile = __DIR__ . '/data/super_settings.json';
    $settings = file_exists($settingsFile) ? (json_decode(file_get_contents($settingsFile), true) ?? []) : [];
    
    $maxAttempts = (int)($settings['maxLoginAttempts'] ?? 5);
    $lockoutMins = (int)($settings['lockoutDuration'] ?? 60);
    $rateLimit = (int)($settings['apiRateLimit'] ?? 10); // Specific to login rate limit if desired, or use global

    // 1. Apply Rate Limiting
    checkRateLimit($pdo, $rateLimit, 60, 'login');

    // Fetch user by email
    $stmt = $pdo->prepare("SELECT id, name, email, password_hash, phone, address, region, level, level_name, avatar_text, profile_image, status, role, is_verified, verification_method, email_notif, push_notif, sms_tracking, theme, branch_id, login_attempts, lockout_until FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if ($user) {
        // 1. Check if account is currently locked
        $lockoutUntil = $user['lockout_until'] ?? null;
        if ($lockoutUntil && strtotime($lockoutUntil) > time()) {
            $remaining = ceil((strtotime($lockoutUntil) - time()) / 60);
            http_response_code(403);
            if (ob_get_length()) ob_clean();
            echo json_encode(['success' => false, 'message' => "Account locked due to multiple failed attempts. Please try again in $remaining minutes."]);
            exit;
        }
    }

    // Timing-attack safe login verification
    $passwordValid = $user && verifyPassword($password, $user['password_hash'], $needsRehash);

    if (!$passwordValid) {
        // If user not found, perform dummy verification to match timing
        if (!$user) {
            verifyPassword($password, '$argon2id$v=19$m=65536,t=4,p=1$MmdMckp4N1YwS3B2bU51eQ$RkR0...', $needsRehash);
        }
        // 2. Handle Failed Attempt
        if ($user) {
            $attempts = ($user['login_attempts'] ?? 0) + 1;
            $lockout = null;
            if ($attempts >= $maxAttempts) {
                $lockout = date('Y-m-d H:i:s', time() + ($lockoutMins * 60)); 
                logger('warn', 'SECURITY', "Account locked for {$user['email']} after $maxAttempts failed attempts.");
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

    if (!$user['is_verified'] && !in_array($user['role'], RBAC_ALL_ADMINS)) {
        // Generate a new code for the login attempt if one doesn't exist
        // Generate a new code using cryptographically secure randomness
        $newCode = str_pad(random_int(100000, 999999), 6, '0', STR_PAD_LEFT);
        $stmt = $pdo->prepare("UPDATE users SET verification_code = ? WHERE id = ?");
        $stmt->execute([$newCode, $user['id']]);

        // Dispatch new code
        require_once 'notifications.php';
        $notifier = new NotificationService();
        $subject = "Your ElectroCom Verification Code";
        $msg = "Your verification code is: {$newCode}. Please enter this code to activate your account.";

        if ($user['verification_method'] === 'sms') {
            $notifier->queueNotification('sms', $user['phone'], $msg);
        } else {
            $notifier->queueNotification('email', $user['email'], $msg, $subject);
        }

        http_response_code(403);
        echo json_encode([
            'success' => false,
            'needs_verification' => true,
            'message' => 'Please verify your account to continue. A new code has been sent.',
            'data' => [
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

    // Identify target application for cookie naming
    $headers = function_exists('getallheaders') ? getallheaders() : [];
    $appId = $headers['X-App-ID'] ?? $headers['x-app-id'] ?? ($data['app_source'] ?? 'storefront');
    $cookieName = ($appId === 'admin') ? 'ehub_admin_session' : 'ehub_store_session';

    // Set HttpOnly Cookie for security
    setcookie($cookieName, $token, [
        'expires' => time() + (60 * 60 * 24), // 24 hours
        'path' => '/',
        'domain' => '',
        'secure' => isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on',
        'httponly' => true,
        'samesite' => 'Strict'
    ]);

    logger('ok', 'AUTH', "User {$user['email']} logged in successfully as " . strtoupper($user['role']));

    if (ob_get_length()) ob_clean();
    echo json_encode([
        'success' => true,
        'message' => 'Login successful!',
        'data' => [
            'token' => $token,
            'user' => scrubUser($user)
        ]
    ]);
} catch (PDOException $e) {
    if (ob_get_length()) ob_clean();
    logger('error', 'LOGIN', "Fatal login error for $email: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Internal Server Error during login.']);
}
