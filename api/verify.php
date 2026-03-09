<?php
// backend/verify.php
require_once 'db.php';
require_once 'security.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method Not Allowed']);
    exit;
}

$rawData = file_get_contents('php://input');
$data = json_decode($rawData, true);

$userId = $data['user_id'] ?? null;
$code = $data['code'] ?? null;

if (!$userId || !$code) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'User ID and verification code are required.']);
    exit;
}

try {
    $stmt = $pdo->prepare("SELECT verification_code FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $user = $stmt->fetch();

    if (!$user) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'User not found.']);
        exit;
    }

    if ($user['verification_code'] !== $code) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid verification code.']);
        exit;
    }

    // Mark as verified
    $stmt = $pdo->prepare("UPDATE users SET is_verified = 1, verification_code = NULL WHERE id = ?");
    $stmt->execute([$userId]);

    echo json_encode([
        'success' => true,
        'message' => 'Account verified successfully!'
    ]);
} catch (PDOException $e) {
    error_log("Verification error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Internal Server Error during verification.']);
}
