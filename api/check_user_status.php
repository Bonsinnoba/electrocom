<?php
require_once 'db.php';
require_once 'security.php';

// Specific role check removed to allow all users to check their own status
// authenticate() below handles basic token validation


header('Content-Type: application/json');

try {
    // This will handle token verification and exit if unauthorized
    $userId = authenticate();

    $stmt = $pdo->prepare("SELECT status FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $user = $stmt->fetch();

    if (!$user) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'User not found.']);
        exit;
    }

    echo json_encode([
        'success' => true,
        'status' => $user['status']
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error checking status: ' . $e->getMessage()]);
}
