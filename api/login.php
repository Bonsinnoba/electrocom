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
    $stmt = $pdo->prepare("SELECT id, name, email, password_hash, phone, address, level, level_name, avatar_text, profile_image, status, role FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user || !verifyPassword($password, $user['password_hash'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Invalid email or password.']);
        exit;
    }

    if ($user['status'] === 'Suspended') {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Your account has been suspended. Please contact support.']);
        exit;
    }

    // Generate token
    $token = generateToken($user['id']);

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
