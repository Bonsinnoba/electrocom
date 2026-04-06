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
    // Audit access: Admins, Branch Admins, Store Managers, Accountants, Super
    requireRole(RBAC_ALL_ADMINS, $pdo);
} elseif ($method === 'POST') {
    // Fulfillment access: Admins, Store Managers and Branch Admins only
    requireRole(['super', 'admin', 'branch_admin', 'store_manager'], $pdo);
}

if ($method === 'GET') {
    try {
        $filterSql = "";
        $params = [];

        // FIX #10: was o.branch_id (wrong), corrected to o.source_branch_id
        if ($role === 'store_manager' || $role === 'branch_admin') {
            $managerBranchId = getManagerBranchId($userId, $pdo);
            if ($managerBranchId) {
                $filterSql = " WHERE o.source_branch_id = ? ";
                $params[] = $managerBranchId;
            }
        }

        $stmt = $pdo->prepare("
            SELECT 
                o.id, 
                o.total_amount as amount, 
                o.status, 
                o.created_at as date,
                u.name as customer,
                u.email,
                u.region as user_region,
                o.shipping_address as address,
                'Delivery' as type,
                o.source_branch_id as branch_id,
                b.name as branch_name,
                b.type as branch_type
            FROM orders o
            JOIN users u ON o.user_id = u.id
            LEFT JOIN store_branches b ON o.source_branch_id = b.id
            $filterSql
            ORDER BY o.created_at DESC
        ");
        $stmt->execute($params);
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

            // Recalculate level if delivered
            if ($status === 'delivered') {
                updateUserLevel($order['user_id'], $pdo);
            }

            echo json_encode(['success' => true]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        }
    } elseif ($action === 'resend_receipt') {
        $idStr = $decoded['id'] ?? null;
        if (!$idStr) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Order ID is required']);
            exit;
        }
        $id = str_replace('ORD-', '', $idStr);

        try {
            $stmt = $pdo->prepare("
                SELECT o.*, u.email, u.name 
                FROM orders o 
                JOIN users u ON o.user_id = u.id 
                WHERE o.id = ?
            ");
            $stmt->execute([$id]);
            $order = $stmt->fetch();

            if (!$order) {
                http_response_code(404);
                echo json_encode(['success' => false, 'error' => 'Order not found']);
                exit;
            }

            $itemStmt = $pdo->prepare("SELECT p.name, oi.quantity as qty, oi.price_at_purchase as price FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = ?");
            $itemStmt->execute([$id]);
            $items = $itemStmt->fetchAll();

            require_once 'notifications.php';
            $notifier = new NotificationService();

            $subject = "Receipt for Order #{$idStr}";
            $itemsList = "";
            foreach ($items as $item) {
                $itemsList .= "- {$item['name']} x {$item['qty']} (GHS " . number_format($item['price'], 2) . ")\n";
            }

            $msg = "Hello {$order['name']},\n\nHere is your receipt for order #{$idStr}.\n\nItems:\n{$itemsList}\nTotal: GHS " . number_format($order['total_amount'], 2) . "\n\nThank you for shopping with ElectroCom!";

            $notifier->queueNotification('email', $order['email'], $msg, $subject);

            logger('info', 'ORDERS', "Receipt for order {$idStr} manually re-sent by {$userName}");
            echo json_encode(['success' => true, 'message' => 'Receipt re-sent successfully']);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        }
    } elseif ($action === 'verify_delivery') {
        $idStr = $decoded['id'] ?? null;
        $otp = $decoded['otp'] ?? '';

        if (!$idStr || !$otp) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Order ID and Delivery Code are required']);
            exit;
        }

        $id = str_replace('ORD-', '', $idStr);

        try {
            $stmt = $pdo->prepare("SELECT delivery_otp, status FROM orders WHERE id = ?");
            $stmt->execute([$id]);
            $order = $stmt->fetch();

            if (!$order) {
                http_response_code(404);
                echo json_encode(['success' => false, 'error' => 'Order not found']);
                exit;
            }

            if ($order['status'] === 'delivered') {
                echo json_encode(['success' => false, 'error' => 'This order has already been delivered']);
                exit;
            }

            if ($order['delivery_otp'] !== $otp) {
                echo json_encode(['success' => false, 'error' => 'Invalid Delivery Code. Please check with the customer.']);
                exit;
            }

            $updateStmt = $pdo->prepare("UPDATE orders SET status = 'delivered' WHERE id = ?");
            $updateStmt->execute([$id]);

            $userStmt = $pdo->prepare("SELECT user_id FROM orders WHERE id = ?");
            $userStmt->execute([$id]);
            $order = $userStmt->fetch();
            if ($order) {
                updateUserLevel($order['user_id'], $pdo);
            }

            logger('ok', 'ORDERS', "Order {$idStr} verified and DELIVERED via OTP by {$userName}");

            echo json_encode(['success' => true, 'message' => 'Delivery verified successfully! Order marked as Delivered.']);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        }
    }
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
}
