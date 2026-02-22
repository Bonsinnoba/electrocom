<?php
// backend/update_profile.php
require_once 'db.php';
require_once 'security.php';
require_once 'cors_middleware.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST' && $_SERVER['REQUEST_METHOD'] !== 'PUT') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method Not Allowed']);
    exit;
}

// Authenticate user and get ID
$userId = authenticate();

$rawData = file_get_contents('php://input');
$data = json_decode($rawData, true);

if (!$data) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid JSON data.']);
    exit;
}

// Fields allowed to be updated
$updateableFields = ['name', 'phone', 'address', 'profile_image'];
$updates = [];
$params = [];

foreach ($updateableFields as $field) {
    if (isset($data[$field])) {
        $val = ($field === 'profile_image') ? $data[$field] : sanitizeInput($data[$field]);
        $updates[] = "$field = ?";
        $params[] = $val;
    }
}

if (empty($updates)) {
    echo json_encode(['success' => true, 'message' => 'No changes made.']);
    exit;
}

try {
    $sql = "UPDATE users SET " . implode(', ', $updates) . " WHERE id = ?";
    $params[] = $userId;

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    echo json_encode([
        'success' => true,
        'message' => 'Profile updated successfully!',
        'data' => $data // Echo back the updated fields
    ]);
} catch (PDOException $e) {
    error_log("Profile update error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Failed to update profile.']);
}
