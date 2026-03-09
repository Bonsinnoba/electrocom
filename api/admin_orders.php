<?php
require 'cors_middleware.php';
require 'db.php';
require 'security.php';

header('Content-Type: application/json');

// Authenticate User
try {
    $userId = authenticate();
    $role = getUserRole($userId, $pdo);
    $userName = getUserName($userId, $pdo);
} catch (Exception $e) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

// Granular Role Access
if ($method === 'GET') {
    // Audit access: Admins, Branch Admins, Accountants, Super
    requireRole(array_merge(RBAC_ADMIN_GROUP, RBAC_SUPER_GROUP), $pdo);
} elseif ($method === 'POST') {
    // Fulfillment access: Admins and Branch Admins only
    requireRole(['super', 'admin', 'branch_admin'], $pdo);
}

if ($method === 'GET') {
    try {
        $stmt = $pdo->query("
            SELECT 
                o.id, 
                o.total_amount as amount, 
                o.status, 
                o.created_at as date,
                u.name as customer,
                u.email,
                o.shipping_address as address,
                'Delivery' as type
            FROM orders o
            JOIN users u ON o.user_id = u.id
            ORDER BY o.created_at DESC
        ");
        $orders = $stmt->fetchAll();

        // Fetch items for each order
        foreach ($orders as &$order) {
            $itemStmt = $pdo->prepare("
                SELECT p.name, p.location, oi.quantity as qty, oi.price_at_purchase as price
                FROM order_items oi
                JOIN products p ON oi.product_id = p.id
                WHERE oi.order_id = ?
            ");
            $itemStmt->execute([$order['id']]);
            $order['items'] = $itemStmt->fetchAll();
            $order['id'] = 'ORD-' . $order['id']; // Add prefix for display
        }

        echo json_encode(['success' => true, 'data' => $orders]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
} elseif ($method === 'POST') {
    $content = trim(file_get_contents("php://input"));
    $decoded = json_decode($content, true);
    $action = $decoded['action'] ?? '';

    if ($action === 'update_status') {
        $idStr = $decoded['id'] ?? null;
        $status = $decoded['status'] ?? 'pending';

        if (!$idStr) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Order ID is required']);
            exit;
        }

        $id = str_replace('ORD-', '', $idStr);

        try {
            $stmt = $pdo->prepare("UPDATE orders SET status = ? WHERE id = ?");
            $stmt->execute([$status, $id]);

            // Notify User of status change
            $userStmt = $pdo->prepare("SELECT user_id FROM orders WHERE id = ?");
            $userStmt->execute([$id]);
            $order = $userStmt->fetch();
            if ($order) {
                $statusMsg = "Your order ORD-{$id} has been updated to " . ucfirst($status) . ".";
                $pdo->prepare("INSERT INTO notifications (user_id, title, message, type) VALUES (?, 'Order Update', ?, 'order')")
                    ->execute([$order['user_id'], $statusMsg]);
            }

            logger('info', 'ORDERS', "Order {$idStr} status updated to " . strtoupper($status) . " by {$userName}");

            echo json_encode(['success' => true]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        }
    }
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
}
