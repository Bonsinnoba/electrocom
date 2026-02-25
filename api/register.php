<?php
// backend/register.php
require_once 'db.php';
require_once 'security.php';
require_once 'cors_middleware.php';

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method Not Allowed']);
    exit;
}

// Get raw POST data
$rawData = file_get_contents('php://input');
$data = json_decode($rawData, true);

if (!$data) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid JSON data provided.']);
    exit;
}

// Sanitize inputs
$name = sanitizeInput($data['name'] ?? '');
$email = sanitizeInput($data['email'] ?? '');
$password = $data['password'] ?? '';
$phone = sanitizeInput($data['phone'] ?? '');

// Validation
if (empty($name) || empty($email) || empty($password)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Name, email, and password are required.']);
    exit;
}

if (!isValidEmail($email)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid email format.']);
    exit;
}

if (strlen($password) < 8) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Security Rule: Password must be at least 8 characters long for your protection.']);
    exit;
}

try {
    // Check if user already exists
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        http_response_code(409);
        echo json_encode(['success' => false, 'message' => 'An account with this email already exists.']);
        exit;
    }

    // Hash password and insert user
    $hashedPassword = hashPassword($password);
    $avatarText = strtoupper(substr($name, 0, 2));
    $verificationCode = str_pad(rand(0, 999999), 6, '0', STR_PAD_LEFT);
    $verificationMethod = sanitizeInput($data['verification_method'] ?? 'email');

    $stmt = $pdo->prepare("INSERT INTO users (name, email, password_hash, phone, avatar_text, verification_code, verification_method, is_verified) VALUES (?, ?, ?, ?, ?, ?, ?, 0)");
    $stmt->execute([$name, $email, $hashedPassword, $phone, $avatarText, $verificationCode, $verificationMethod]);

    // Dispatch verification code
    if ($verificationMethod === 'sms') {
        logger('info', 'SMS_SERVICE', "Sending verification code {$verificationCode} to {$phone}");
    } else {
        logger('info', 'EMAIL_SERVICE', "Sending verification code {$verificationCode} to {$email}");
    }

    $userId = $pdo->lastInsertId();
    $token = generateToken($userId);

    // Create a welcome notification
    $welcomeStmt = $pdo->prepare("INSERT INTO notifications (user_id, title, message, type) VALUES (?, 'Welcome to EssentialsHub!', 'We are excited to have you here. Start exploring our premium products!', 'info')");
    $welcomeStmt->execute([$userId]);

    echo json_encode([
        'success' => true,
        'message' => 'Account created successfully!',
        'data' => [
            'token' => $token,
            'user' => [
                'id' => $userId,
                'name' => $name,
                'email' => $email,
                'phone' => $phone,
                'avatar' => $avatarText,
                'level' => 1,
                'levelName' => 'Starter'
            ]
        ]
    ]);
} catch (PDOException $e) {
    error_log("Registration error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Internal Server Error during registration.']);
}
