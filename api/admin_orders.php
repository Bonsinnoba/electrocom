<?php
require 'cors_middleware.php';
require 'db.php';
require 'security.php';

require_once 'inventory_utils.php';

// Lazy-sync pending orders to cancelled if they expired
lazyCancelOrders($pdo);

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
    // Fulfillment access: Admins, Store Managers, Branch Admins, and Pickers
    requireRole(['super', 'admin', 'branch_admin', 'store_manager', 'picker'], $pdo);
}

if ($method === 'GET') {
    try {
        $filterSql = "";
        $params = [];
        $orderCols = $pdo->query("DESCRIBE orders")->fetchAll(PDO::FETCH_COLUMN);
        $hasDeliveryMethod = in_array('delivery_method', $orderCols, true);
        $deliverySelect = $hasDeliveryMethod ? "o.delivery_method" : "'pickup'";

        $stmt = $pdo->prepare("
            SELECT 
                o.id, 
                o.total_amount as amount, 
                o.status, 
                {$deliverySelect} as delivery_method,
                o.created_at as date,
                u.name as customer,
                u.email,
                u.region as user_region,
                o.shipping_address as address,
                CASE
                    WHEN o.delivery_method = 'pickup' THEN 'Pick Up'
                    ELSE 'Delivery'
                END as type
            FROM orders o
            JOIN users u ON o.user_id = u.id
            $filterSql
            ORDER BY o.created_at DESC
        ");
        $stmt->execute($params);
        $orders = $stmt->fetchAll();

        if (!empty($orders)) {
            $orderIds = array_column($orders, 'id');
            $placeholders = implode(',', array_fill(0, count($orderIds), '?'));
            
            $itemStmt = $pdo->prepare("
                SELECT oi.order_id, p.name, p.location, oi.quantity as qty, oi.price_at_purchase as price
                FROM order_items oi
                JOIN products p ON oi.product_id = p.id
                WHERE oi.order_id IN ($placeholders)
            ");
            $itemStmt->execute($orderIds);
            $allItems = $itemStmt->fetchAll(PDO::FETCH_GROUP | PDO::FETCH_ASSOC);

            foreach ($orders as &$order) {
                $order['items'] = $allItems[$order['id']] ?? [];
                $order['id'] = 'ORD-' . $order['id']; // Add prefix for display
            }
        }

        sendResponse(true, 'Orders fetched successfully', $orders);
    } catch (PDOException $e) {
        sendResponse(false, 'Database error: ' . $e->getMessage(), null, 500);
    }
} elseif ($method === 'POST') {
    $content = trim(file_get_contents("php://input"));
    $decoded = json_decode($content, true);
    $action = $decoded['action'] ?? '';

    if ($action === 'update_status') {
        if ($role === 'picker') {
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'Picker role must use picker workflow actions.']);
            exit;
        }

        $idStr = $decoded['id'] ?? null;
        $status = $decoded['status'] ?? 'pending';

        if (!$idStr) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Order ID is required']);
            exit;
        }

        $id = str_replace('ORD-', '', $idStr);

        try {
            $pdo->beginTransaction();

            $currStmt = $pdo->prepare("SELECT status FROM orders WHERE id = ? FOR UPDATE");
            $currStmt->execute([$id]);
            $currentStatus = $currStmt->fetchColumn();

            if (!$currentStatus) {
                throw new Exception("Order not found.");
            }

            if ($currentStatus !== $status) {
                $stmt = $pdo->prepare("UPDATE orders SET status = ? WHERE id = ?");
                $stmt->execute([$status, $id]);

                // Stock Replenishment Logic
                $deductedStatuses = ['processing', 'shipped', 'delivered'];
                $restoredStatuses = ['cancelled', 'returned'];
                
                if (in_array($currentStatus, $deductedStatuses) && in_array($status, $restoredStatuses)) {
                    $itemStmt = $pdo->prepare("SELECT product_id, quantity FROM order_items WHERE order_id = ?");
                    $itemStmt->execute([$id]);
                    $items = $itemStmt->fetchAll();
                    
                    $restoreStmt = $pdo->prepare("UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?");
                    foreach ($items as $item) {
                        $restoreStmt->execute([$item['quantity'], $item['product_id']]);
                    }
                }
            }

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

            $pdo->commit();
            echo json_encode(['success' => true]);
        } catch (Exception $e) {
            if ($pdo->inTransaction()) $pdo->rollBack();
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        }
    } elseif ($action === 'picker_update') {
        if ($role !== 'picker' && $role !== 'super' && $role !== 'admin' && $role !== 'store_manager' && $role !== 'branch_admin') {
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'Forbidden']);
            exit;
        }

        $idStr = $decoded['id'] ?? null;
        $stage = strtolower(trim((string)($decoded['stage'] ?? '')));

        if (!$idStr || !$stage) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Order ID and stage are required']);
            exit;
        }

        $allowedStages = ['received', 'picked', 'dispatched'];
        if (!in_array($stage, $allowedStages, true)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Invalid picker stage']);
            exit;
        }

        $id = str_replace('ORD-', '', $idStr);

        try {
            $pdo->beginTransaction();

            $currStmt = $pdo->prepare("SELECT status, user_id FROM orders WHERE id = ? FOR UPDATE");
            $currStmt->execute([$id]);
            $order = $currStmt->fetch(PDO::FETCH_ASSOC);

            if (!$order) {
                throw new Exception('Order not found');
            }

            $statusMap = [
                'received' => 'processing',
                'picked' => 'processing',
                'dispatched' => 'shipped'
            ];

            $logMessageMap = [
                'received' => "Order {$idStr} received by picker {$userName}.",
                'picked' => "Items for {$idStr} picked and packed by {$userName}.",
                'dispatched' => "Order {$idStr} dispatched from store by {$userName}."
            ];

            $newStatus = $statusMap[$stage];
            if ($order['status'] !== $newStatus) {
                $upd = $pdo->prepare("UPDATE orders SET status = ? WHERE id = ?");
                $upd->execute([$newStatus, $id]);
            }

            $pdo->prepare("INSERT INTO order_status_logs (order_id, status_key, message) VALUES (?, ?, ?)")
                ->execute([$id, $stage === 'dispatched' ? 'shipped' : $stage, $logMessageMap[$stage]]);

            $userMsgMap = [
                'received' => "Your order {$idStr} has been received for picking.",
                'picked' => "Good news! Items for your order {$idStr} have been picked.",
                'dispatched' => "Your order {$idStr} has been dispatched and is on the way."
            ];

            $pdo->prepare("INSERT INTO notifications (user_id, title, message, type) VALUES (?, 'Order Update', ?, 'order')")
                ->execute([$order['user_id'], $userMsgMap[$stage]]);

            logger('info', 'PICKER', "Picker workflow update for {$idStr}: {$stage} by {$userName}");
            $pdo->commit();

            echo json_encode(['success' => true, 'status' => $newStatus, 'stage' => $stage]);
        } catch (Exception $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        }
    } elseif ($action === 'resend_receipt') {
        if ($role === 'picker') {
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'Picker role cannot resend receipts']);
            exit;
        }

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
        if ($role === 'picker') {
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'Picker role cannot verify delivery']);
            exit;
        }

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
