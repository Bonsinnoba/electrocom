<?php
// backend/register.php
require_once 'db.php';
require_once 'security.php';
require_once 'cors_middleware.php';

// simple helper for Ghana card number validity – placeholder for external API checks
function isValidGhanaCardNumber($number) {
    // allow alphanumeric groups separated by hyphens (e.g. GHA-1234-5678)
    return preg_match('/^[A-Z0-9]+(?:-[A-Z0-9]+)*$/i', $number);
}

// call a government verification service using cURL
function verifyWithGovernmentAPI($idNumber, $idPhoto) {
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

    // Basic server-side validation for Ghana card
    if (empty($idNumber) || empty($idPhoto)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Ghana card number and photo are required for verification.']);
        exit;
    }

    // simple pattern check – delegate to helper (could be replaced by an external API call)
    if (!isValidGhanaCardNumber($idNumber)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid Ghana card number format.']);
        exit;
    }

    // call government verification API if configured
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

    $stmt = $pdo->prepare("INSERT INTO users (name, email, password_hash, phone, avatar_text, verification_code, verification_method, id_number, id_photo, is_verified) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)");
    $stmt->execute([$name, $email, $hashedPassword, $phone, $avatarText, $verificationCode, $verificationMethod, $idNumber, $idPhoto]);

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
