<?php
// backend/upload_id.php
require_once 'db.php';
require_once 'security.php';

header('Content-Type: application/json');

// Use native security middleware to validate Bearer token
$userId = authenticate();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method Not Allowed']);
    exit;
}

$rawData = file_get_contents('php://input');
$data = json_decode($rawData, true);

if (!$data) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid JSON payload.']);
    exit;
}

$idNumber = sanitizeInput($data['id_number'] ?? '');
$idPhoto = $data['id_photo'] ?? '';

if (!$idNumber || !$idPhoto) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Ghana card number and photo are required.']);
    exit;
}

// simple pattern check for Ghana card
function isValidGhanaCardNumber($number)
{
    return preg_match('/^[A-Z0-9]+(?:-[A-Z0-9]+)*$/i', $number);
}

if (!isValidGhanaCardNumber($idNumber)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid Ghana card number format.']);
    exit;
}

try {
    // check if this ID is already used by another user
    $checkStmt = $pdo->prepare("SELECT id FROM users WHERE id_number = ? AND id != ?");
    $checkStmt->execute([$idNumber, $userId]);
    if ($checkStmt->fetch()) {
        http_response_code(409);
        echo json_encode(['success' => false, 'message' => 'This Ghana card has already been used by another account.']);
        exit;
    }

    // Encrypt sensitive photo data
    $encryptedPhoto = encryptData($idPhoto);

    // Update user record and mark as PENDING verification (0)
    // It must be approved by a super admin in the admin panel
    $stmt = $pdo->prepare("UPDATE users SET id_number = ?, id_photo = ?, id_verified = 0, id_verified_at = NULL WHERE id = ?");
    $stmt->execute([$idNumber, $encryptedPhoto, $userId]);

    echo json_encode([
        'success' => true,
        'message' => 'ID information uploaded successfully! It is now pending review by an administrator.',
        'user' => [
            'id_number' => $idNumber,
            'id_verified' => 0
        ]
    ]);
} catch (PDOException $e) {
    error_log("ID Update Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error during identity verification.']);
}
