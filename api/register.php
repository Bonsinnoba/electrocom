<?php
// backend/register.php
require_once 'db.php';
require_once 'security.php';

// Rate limit: 4 registration attempts per IP per hour
checkRateLimit($pdo, 4, 3600);



// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method Not Allowed']);
    exit;
}

// Check if registrations are currently allowed (controlled from Super Settings)
$settingsFile = __DIR__ . '/data/super_settings.json';
$globalSettings = file_exists($settingsFile) ? (json_decode(file_get_contents($settingsFile), true) ?? []) : [];
if (isset($globalSettings['allowRegistration']) && $globalSettings['allowRegistration'] === false) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'New registrations are currently disabled. Please contact support.']);
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



    $stmt = $pdo->prepare("INSERT INTO users (name, email, password_hash, phone, avatar_text, verification_code, verification_method) VALUES (?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([$name, $email, $hashedPassword, $phone, $avatarText, $verificationCode, $verificationMethod]);

    // Dispatch verification code
    require_once 'notifications.php';
    $notifier = new NotificationService();
    $subject = "Your ElectroCom Verification Code";
    $msg = "Welcome to ElectroCom! Your verification code is: {$verificationCode}. Please enter this code to activate your account.";

    if ($verificationMethod === 'sms') {
        $notifier->sendSMS($phone, $msg);
    } else {
        $notifier->sendEmail($email, $subject, $msg);
    }

    $userId = $pdo->lastInsertId();
    $token = generateToken($userId);

    // Create a welcome notification
    $welcomeStmt = $pdo->prepare("INSERT INTO notifications (user_id, title, message, type) VALUES (?, 'Welcome to ElectroCom!', 'We are excited to have you here. Start exploring our premium products!', 'info')");
    $welcomeStmt->execute([$userId]);

    echo json_encode([
        'success' => true,
        'message' => 'Account created successfully!',
        'data' => [
            'token' => $token,
            'user' => [
                'id' => (int)$userId,
                'name' => $name,
                'email' => $email,
                'phone' => $phone,
                'avatar' => $avatarText,
                'level' => 1,
                'levelName' => 'Starter',
                'loyalty_points' => 0,
                'role' => 'customer',
                'theme' => 'blue'
            ]
        ]
    ]);
} catch (PDOException $e) {
    error_log("Registration error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Internal Server Error during registration.']);
}
