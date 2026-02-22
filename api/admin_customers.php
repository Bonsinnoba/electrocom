<?php
require 'cors_middleware.php';
require 'db.php';
require 'security.php';

header('Content-Type: application/json');

// Authenticate Admin
try {
    $userId = authenticate();
} catch (Exception $e) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    exit;
}

$stmt = $pdo->prepare("SELECT role FROM users WHERE id = ?");
$stmt->execute([$userId]);
$user = $stmt->fetch();

if (!$user || $user['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Unauthorized: Admin access required']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    try {
        // Fetch all users with basic order summary
        // Note: For now, we'll just count total orders per user
        $stmt = $pdo->query("
            SELECT 
                u.*, 
                (SELECT COUNT(*) FROM orders WHERE user_id = u.id) as orders_count,
                (SELECT SUM(total_amount) FROM orders WHERE user_id = u.id) as total_spent
            FROM users u 
            ORDER BY u.created_at DESC
        ");
        $users = $stmt->fetchAll();

        echo json_encode(['success' => true, 'data' => $users]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
} elseif ($method === 'POST') {
    $content = trim(file_get_contents("php://input"));
    $decoded = json_decode($content, true);
    $action = $decoded['action'] ?? '';

    if ($action === 'delete') {
        $id = $decoded['id'] ?? null;
        if (!$id) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'User ID is required']);
            exit;
        }

        try {
            $stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
            $stmt->execute([$id]);
            echo json_encode(['success' => true]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        }
    } elseif ($action === 'toggle_status') {
        $id = $decoded['id'] ?? null;
        $currentStatus = $decoded['status'] ?? 'Active';

        if (!$id) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'User ID is required']);
            exit;
        }

        try {
            $newStatus = ($currentStatus === 'Suspended') ? 'Active' : 'Suspended';
            $stmt = $pdo->prepare("UPDATE users SET status = ? WHERE id = ?");
            $stmt->execute([$newStatus, $id]);
            echo json_encode(['success' => true, 'status' => $newStatus]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        }
    } elseif ($action === 'toggle_role') {
        $id = $decoded['id'] ?? null;
        $role = $decoded['role'] ?? 'customer';

        if (!$id) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'User ID is required']);
            exit;
        }

        try {
            $newRole = ($role === 'admin') ? 'customer' : 'admin';
            $stmt = $pdo->prepare("UPDATE users SET role = ? WHERE id = ?");
            $stmt->execute([$newRole, $id]);
            echo json_encode(['success' => true, 'role' => $newRole]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        }
    }
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
}
