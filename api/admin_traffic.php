<?php
require_once 'cors_middleware.php';
require_once 'db.php';
require_once 'security.php';

header('Content-Type: application/json');

// Authenticate and Require Roles
try {
    $userId = requireRole(['admin'], $pdo);
} catch (Exception $e) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $action = $_GET['action'] ?? 'stats';

    if ($action === 'stats') {
        try {
            // Get total hits
            $totalHits = $pdo->query("SELECT COUNT(*) FROM traffic_logs")->fetchColumn();

            // Get hits by country
            $countryStats = $pdo->query("SELECT country, COUNT(*) as count FROM traffic_logs GROUP BY country ORDER BY count DESC LIMIT 10")->fetchAll();

            // Get recent logs
            $recentLogs = $pdo->query("SELECT * FROM traffic_logs ORDER BY created_at DESC LIMIT 50")->fetchAll();

            // Get current restrictions
            $restrictions = $pdo->query("SELECT * FROM access_restrictions")->fetchAll();

            echo json_encode([
                'success' => true,
                'data' => [
                    'totalHits' => $totalHits,
                    'countryStats' => $countryStats,
                    'recentLogs' => $recentLogs,
                    'restrictions' => $restrictions
                ]
            ]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        }
    }
} elseif ($method === 'POST') {
    $content = trim(file_get_contents("php://input"));
    $decoded = json_decode($content, true);
    $action = $decoded['action'] ?? '';

    if ($action === 'add_restriction') {
        $type = $decoded['type'] ?? 'country';
        $value = $decoded['value'] ?? '';
        $reason = $decoded['reason'] ?? 'Administrator restricted access';

        if (empty($value)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Value is required']);
            exit;
        }

        try {
            $stmt = $pdo->prepare("INSERT INTO access_restrictions (type, value, reason) VALUES (?, ?, ?)");
            $stmt->execute([$type, $value, $reason]);

            logger('info', 'SECURITY', "New restriction added: {$type} = {$value} by User ID: {$userId}");

            echo json_encode(['success' => true, 'message' => 'Restriction added successfully']);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        }
    } elseif ($action === 'remove_restriction') {
        $id = $decoded['id'] ?? null;

        if (!$id) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Restriction ID is required']);
            exit;
        }

        try {
            $stmt = $pdo->prepare("DELETE FROM access_restrictions WHERE id = ?");
            $stmt->execute([$id]);

            logger('info', 'SECURITY', "Restriction removed (ID: {$id}) by User ID: {$userId}");

            echo json_encode(['success' => true, 'message' => 'Restriction removed successfully']);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        }
    }
}
