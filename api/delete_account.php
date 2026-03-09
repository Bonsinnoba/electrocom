<?php
require_once 'db.php';
require_once 'security.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method Not Allowed']);
    exit;
}

try {
    $userId = authenticate();

    if (!$userId) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Unauthorized']);
        exit;
    }

    $pdo->beginTransaction();

    // Delete related data first (optional, depending on schema CASCADE rules)
    // For now, we'll just delete the user, assuming CASCADE is in place or not strictly required for this build

    $stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
    $stmt->execute([$userId]);

    $pdo->commit();

    echo json_encode(['success' => true, 'message' => 'Account deleted successfully.']);
} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Failed to delete account: ' . $e->getMessage()]);
}
