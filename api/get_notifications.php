<?php
require_once 'db.php';
require_once 'security.php';

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// Authenticate user
$userId = authenticate();
$role = getUserRole($userId, $pdo);

if ($method === 'GET') {
    try {
        if (isset($_GET['admin']) && $_GET['admin'] === 'true') {
            // Admin view: check if authorized
            if (!in_array($role, RBAC_ADMIN_GROUP) && $role !== 'super') {
                http_response_code(403);
                echo json_encode(['success' => false, 'error' => 'Forbidden']);
                exit;
            }

            // For admins, we might want to see all notifications or specifically addressed ones
            // For now, let's fetch all notifications that are of type 'security' or addressed specifically to any admin
            $stmt = $pdo->prepare("
                SELECT n.*, u.name as user_name 
                FROM notifications n 
                LEFT JOIN users u ON n.user_id = u.id 
                WHERE n.type IN ('security', 'info') OR u.role IN ('admin', 'super', 'branch_admin')
                ORDER BY n.created_at DESC LIMIT 50
            ");
            $stmt->execute();
        } else {
            // Standard user view: only their own
            $stmt = $pdo->prepare("SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50");
            $stmt->execute([$userId]);
        }

        $notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(['success' => true, 'data' => $notifications]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
    }
} elseif ($method === 'POST' && $action === 'mark_read') {
    $data = json_decode(file_get_contents('php://input'), true);
    $notificationId = $data['id'] ?? null;

    if (!$notificationId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Notification ID required']);
        exit;
    }

    try {
        // Ensure user owns the notification or is admin
        $stmt = $pdo->prepare("SELECT user_id FROM notifications WHERE id = ?");
        $stmt->execute([$notificationId]);
        $notif = $stmt->fetch();

        if (!$notif) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Notification not found']);
            exit;
        }

        if ($notif['user_id'] != $userId && !in_array($role, RBAC_ADMIN_GROUP) && $role !== 'super') {
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'Forbidden']);
            exit;
        }

        $update = $pdo->prepare("UPDATE notifications SET is_read = TRUE WHERE id = ?");
        $update->execute([$notificationId]);

        echo json_encode(['success' => true]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Database error']);
    }
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
}
