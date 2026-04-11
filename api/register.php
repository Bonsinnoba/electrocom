<?php
// backend/register.php
require_once 'db.php';
require_once 'security.php';

// Load settings
$settingsFile = __DIR__ . '/data/super_settings.json';
$globalSettings = file_exists($settingsFile) ? (json_decode(file_get_contents($settingsFile), true) ?? []) : [];

// Check if registrations are currently allowed
if (isset($globalSettings['allowRegistration']) && $globalSettings['allowRegistration'] === false) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'New registrations are currently disabled. Please contact support.']);
    exit;
}

// Apply Rate Limiting
$regRateLimit = (int)($globalSettings['apiRateLimit'] ?? 4); 
checkRateLimit($pdo, $regRateLimit, 3600);

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


$minLen = (int)($globalSettings['passwordMinLength'] ?? 8);
if (strlen($password) < $minLen) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => "Security Rule: Password must be at least $minLen characters long for your protection."]);
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
    $avatarText = generateInitials($name);
    $verificationCode = str_pad(rand(0, 999999), 6, '0', STR_PAD_LEFT);
    $verificationMethod = sanitizeInput($data['verification_method'] ?? 'email');


    $region = sanitizeInput($data['region'] ?? 'Greater Accra');

    $requireVerif = (bool)($globalSettings['requireEmailVerification'] ?? true);
    $initialVerified = $requireVerif ? 0 : 1;

    $stmt = $pdo->prepare("INSERT INTO users (name, email, password_hash, phone, avatar_text, region, verification_code, verification_method, is_verified) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([$name, $email, $hashedPassword, $phone, $avatarText, $region, $verificationCode, $verificationMethod, $initialVerified]);

    if ($requireVerif) {
        // Dispatch verification code
        require_once 'notifications.php';
        $notifier = new NotificationService();
        $subject = "Your ElectroCom Verification Code";
        $msg = "Welcome to ElectroCom! Your verification code is: {$verificationCode}. Please enter this code to activate your account.";

        if ($verificationMethod === 'sms') {
            $notifier->queueNotification('sms', $phone, $msg);
        } else {
            $notifier->queueNotification('email', $email, $msg, $subject);
        }
    }

    $userId = $pdo->lastInsertId();

    // Create a welcome notification
    $welcomeStmt = $pdo->prepare("INSERT INTO notifications (user_id, title, message, type) VALUES (?, 'Welcome to ElectroCom!', 'We are excited to have you here. Start exploring our premium products!', 'info')");
    $welcomeStmt->execute([$userId]);

    echo json_encode([
        'success' => true,
        'needs_verification' => $requireVerif,
        'message' => $requireVerif ? 'Account created successfully! Please verify your account to continue.' : 'Account created successfully! Welcome aboard.',
        'data' => [
            'user' => [
                'id' => (int)$userId,
                'name' => $name,
                'email' => $email,
                'phone' => $phone,
                'region' => $region,
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
    logger('error', 'REGISTER', "Registration failed for $email: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Internal Server Error during registration.']);
}
