<?php
// backend/register.php
require_once 'db.php';
require_once 'security.php';
require_once 'cors_middleware.php';

// simple helper for Ghana card number validity – placeholder for external API checks
function isValidGhanaCardNumber($number)
{
    // allow alphanumeric groups separated by hyphens (e.g. GHA-1234-5678)
    return preg_match('/^[A-Z0-9]+(?:-[A-Z0-9]+)*$/i', $number);
}

// call a government verification service using cURL
function verifyWithGovernmentAPI($idNumber, $idPhoto)
{
    $config = require '.env.php';
    $url = $config['GOV_API_URL'] ?? '';
    $key = $config['GOV_API_KEY'] ?? '';
    if (!$url) {
        // no gov API configured; assume true for now
        return ['valid' => true, 'message' => 'No government API configured'];
    }

    $payload = json_encode([
        'id_number' => $idNumber,
        'id_photo'  => $idPhoto
    ]);

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $key
    ]);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);

    $response = curl_exec($ch);
    if ($response === false) {
        $err = curl_error($ch);
        curl_close($ch);
        return ['valid' => false, 'message' => "Gov API request failed: $err"];
    }
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    $data = json_decode($response, true);
    if ($httpCode !== 200 || !is_array($data)) {
        return ['valid' => false, 'message' => 'Invalid response from government service'];
    }
    // expect {valid: bool, message: string}
    return ['valid' => !empty($data['valid']), 'message' => $data['message'] ?? ''];
}

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

// Check for existing email
$checkStmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
$checkStmt->execute([$email]);
if ($checkStmt->fetch()) {
    http_response_code(409);
    echo json_encode(['success' => false, 'message' => 'An account with this email already exists.']);
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

    // Ghana card details
    $idNumber = sanitizeInput($data['id_number'] ?? '');
    $idPhoto = $data['id_photo'] ?? null; // base64 string

    // encrypt sensitive data
    if ($idPhoto) {
        $idPhoto = encryptData($idPhoto);
    }

    // make sure card isn't already used
    if ($idNumber) {
        $checkStmt = $pdo->prepare("SELECT id FROM users WHERE id_number = ?");
        $checkStmt->execute([$idNumber]);
        if ($checkStmt->fetch()) {
            http_response_code(409);
            echo json_encode(['success' => false, 'message' => 'This Ghana card has already been used to register an account.']);
            exit;
        }
    }

    // Ghana card verification logic (only if provided)
    if ($idNumber && $idPhoto) {
        // pattern check
        if (!isValidGhanaCardNumber($idNumber)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid Ghana card number format.']);
            exit;
        }

        // gov API check
        $govResult = verifyWithGovernmentAPI($idNumber, $idPhoto);
        if (!$govResult['valid']) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Government verification failed: ' . $govResult['message']]);
            exit;
        }

        // ensure idPhoto is a valid base64 image
        $decoded = base64_decode(preg_replace('#^data:image/[^;]+;base64,#', '', $idPhoto));
        if ($decoded === false || @getimagesizefromstring($decoded) === false) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid photo provided.']);
            exit;
        }
    }

    $stmt = $pdo->prepare("INSERT INTO users (name, email, password_hash, phone, avatar_text, verification_code, verification_method, id_number, id_photo, id_verified) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)");
    $stmt->execute([$name, $email, $hashedPassword, $phone, $avatarText, $verificationCode, $verificationMethod, $idNumber, $idPhoto]);

    // Dispatch verification code
    require_once 'notifications.php';
    $notifier = new NotificationService();
    $subject = "Your EssentialsHub Verification Code";
    $msg = "Welcome to EssentialsHub! Your verification code is: {$verificationCode}. Please enter this code to activate your account.";

    if ($verificationMethod === 'sms') {
        $notifier->sendSMS($phone, $msg);
    } else {
        $notifier->sendEmail($email, $subject, $msg);
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
                'levelName' => 'Starter',
                'role' => 'customer'
            ]
        ]
    ]);
} catch (PDOException $e) {
    error_log("Registration error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Internal Server Error during registration.']);
}
