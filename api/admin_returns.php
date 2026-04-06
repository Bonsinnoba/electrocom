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
    
    // Restricted to Super, Admin, Branch Admin, and Store Manager
    requireRole(['super', 'admin', 'branch_admin', 'store_manager'], $pdo);
} catch (Exception $e) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    try {
        $managerBranchId = ($role === 'store_manager' || $role === 'branch_admin') ? getManagerBranchId($userId, $pdo) : null;
        
        $sql = "SELECT r.*, o.id as order_display_id, u.name as customer_name, p.name as product_name, p.product_code 
                FROM order_returns r
                JOIN orders o ON r.order_id = o.id
                JOIN users u ON o.user_id = u.id
                JOIN products p ON r.product_id = p.id";
        
        if ($managerBranchId) {
            $stmt = $pdo->prepare($sql . " WHERE o.branch_id = ? ORDER BY r.created_at DESC");
            $stmt->execute([$managerBranchId]);
        } else {
            $stmt = $pdo->prepare($sql . " ORDER BY r.created_at DESC");
            $stmt->execute();
        }
        
        $returns = $stmt->fetchAll();
        foreach ($returns as &$ret) {
            $ret['order_display_id'] = 'ORD-' . $ret['order_id'];
        }

        echo json_encode(['success' => true, 'data' => $returns]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
} elseif ($method === 'POST') {
    $content = trim(file_get_contents("php://input"));
    $decoded = json_decode($content, true);
    
    $orderIdStr = $decoded['order_id'] ?? null;
    $productId = $decoded['product_id'] ?? null;
    $reason = sanitizeInput($decoded['reason'] ?? 'Not specified');
    $quantity = (int)($decoded['quantity'] ?? 1);

    if (!$orderIdStr || !$productId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Order ID and Product ID are required']);
        exit;
    }

    $orderId = str_replace('ORD-', '', $orderIdStr);

    try {
        $pdo->beginTransaction();

        // 1. Verify order exists and belongs to manager's branch if applicable
        $orderCheck = $pdo->prepare("SELECT branch_id, status FROM orders WHERE id = ?");
        $orderCheck->execute([$orderId]);
        $order = $orderCheck->fetch();

        if (!$order) throw new Exception("Order not found");
        
        if ($role === 'store_manager' || $role === 'branch_admin') {
            $managerBranchId = getManagerBranchId($userId, $pdo);
            if ($managerBranchId && $order['branch_id'] != $managerBranchId) {
                throw new Exception("Unauthorized: This order belongs to another branch.");
            }
        }

        // 2. Create return record
        // Self-heal table if needed
        $pdo->exec("CREATE TABLE IF NOT EXISTS order_returns (
            id INT AUTO_INCREMENT PRIMARY KEY,
            order_id INT NOT NULL,
            product_id INT NOT NULL,
            quantity INT NOT NULL DEFAULT 1,
            reason TEXT,
            status ENUM('pending', 'processed', 'inspected', 'rejected') DEFAULT 'processed',
            processed_by INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
        )");

        $stmt = $pdo->prepare("INSERT INTO order_returns (order_id, product_id, quantity, reason, processed_by) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([$orderId, $productId, $quantity, $reason, $userId]);

        // 3. Restock product
        $upd = $pdo->prepare("UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?");
        $upd->execute([$quantity, $productId]);

        // 4. Log Action
        logger('ok', 'RETURNS', "Product #$productId (qty: $quantity) returned from Order $orderIdStr by $userName. Stock restocked.");

        $pdo->commit();
        echo json_encode(['success' => true, 'message' => 'Return processed and stock updated successfully.']);
    } catch (Exception $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
}
