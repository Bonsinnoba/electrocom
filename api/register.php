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

if (strlen($password) < 6) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Password must be at least 6 characters.']);
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

    $stmt = $pdo->prepare("INSERT INTO users (name, email, password_hash, phone, avatar_text) VALUES (?, ?, ?, ?, ?)");
    $stmt->execute([$name, $email, $hashedPassword, $phone, $avatarText]);

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
