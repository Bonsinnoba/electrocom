<?php
// backend/orders.php
require_once 'db.php';
require_once 'security.php';
require_once 'order_utils.php';
require_once 'inventory_utils.php';

// Lazy-cancel stale reservations at the start of every order operation
lazyCancelOrders($pdo);

header('Content-Type: application/json');

// --- Self-healing Schema ---
if ($config['DB_AUTO_REPAIR'] ?? false) {
    try {
        $pdo->exec("CREATE TABLE IF NOT EXISTS orders (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT,
            total_amount DECIMAL(10, 2) NOT NULL,
            coupon_code VARCHAR(50) DEFAULT NULL,
            discount_amount DECIMAL(10, 2) DEFAULT 0.00,
            status ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
            shipping_address TEXT,
            payment_method VARCHAR(50),
            payment_reference VARCHAR(100),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
            FOREIGN KEY (cashier_id) REFERENCES users(id) ON DELETE SET NULL
        )");

        $pdo->exec("CREATE TABLE IF NOT EXISTS order_items (
            id INT AUTO_INCREMENT PRIMARY KEY,
            order_id INT NOT NULL,
            product_id INT,
            quantity INT NOT NULL,
            price_at_purchase DECIMAL(10, 2) NOT NULL,
            selected_color VARCHAR(50),
            FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
        )");

        $cols = $pdo->query("DESCRIBE orders")->fetchAll(PDO::FETCH_COLUMN);
        if (!in_array('order_number', $cols)) {
            $pdo->exec("ALTER TABLE orders ADD COLUMN order_number VARCHAR(100) UNIQUE AFTER id");
        }
        if (!in_array('coupon_code', $cols)) {
            $pdo->exec("ALTER TABLE orders ADD COLUMN coupon_code VARCHAR(50) AFTER total_amount");
        }
        if (!in_array('discount_amount', $cols)) {
            $pdo->exec("ALTER TABLE orders ADD COLUMN discount_amount DECIMAL(10, 2) DEFAULT 0.00 AFTER coupon_code");
        }
        if (!in_array('review_requested_at', $cols)) {
            $pdo->exec("ALTER TABLE orders ADD COLUMN review_requested_at DATETIME DEFAULT NULL AFTER payment_reference");
        }
        if (!in_array('delivery_otp', $cols)) {
            $pdo->exec("ALTER TABLE orders ADD COLUMN delivery_otp VARCHAR(10) DEFAULT NULL AFTER status");
        }
        if (!in_array('cashier_id', $cols)) {
            $pdo->exec("ALTER TABLE orders ADD COLUMN cashier_id INT DEFAULT NULL AFTER user_id");
        }
    } catch (Exception $e) {
        error_log("Orders schema self-healing failed: " . $e->getMessage());
    }
}

// Authenticate User for all order operations
$authenticatedUserId = authenticate($pdo);
$authenticatedUserName = getUserName($authenticatedUserId, $pdo);

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // If a specific order ID is requested
    $orderIdStr = $_GET['order_id'] ?? null;

    if ($orderIdStr) {
        $id = str_replace('ORD-', '', $orderIdStr);
        try {
            $stmt = $pdo->prepare("
                SELECT id, total_amount, status, created_at, updated_at, shipping_address, payment_method, payment_reference
                FROM orders 
                WHERE id = ? AND user_id = ?
            ");
            $stmt->execute([$id, $authenticatedUserId]);
            $order = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$order) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Order not found']);
                exit;
            }

            // Get items
            $itemStmt = $pdo->prepare("
                SELECT p.name, oi.quantity as qty, oi.price_at_purchase as price, p.image_url
                FROM order_items oi
                JOIN products p ON oi.product_id = p.id
                WHERE oi.order_id = ?
            ");
            $itemStmt->execute([$id]);
            $order['items'] = $itemStmt->fetchAll(PDO::FETCH_ASSOC);

            // Get tracking logs
            $logStmt = $pdo->prepare("
                SELECT status_key, message, created_at
                FROM order_status_logs
                WHERE order_id = ?
                ORDER BY created_at ASC
            ");
            $logStmt->execute([$id]);
            $order['logs'] = $logStmt->fetchAll(PDO::FETCH_ASSOC);

            echo json_encode(['success' => true, 'data' => $order]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Failed to fetch order details']);
        }
        exit;
    }

    // Otherwise, fetch all orders for the user
    try {
        $stmt = $pdo->prepare("
            SELECT 
                o.id, o.total_amount, o.status, o.created_at,
                GROUP_CONCAT(p.name SEPARATOR ', ') as items
            FROM orders o
            LEFT JOIN order_items oi ON o.id = oi.order_id
            LEFT JOIN products p ON oi.product_id = p.id
            WHERE o.user_id = ?
            GROUP BY o.id
            ORDER BY o.created_at DESC
        ");
        $stmt->execute([$authenticatedUserId]);
        $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(['success' => true, 'data' => $orders]);
    } catch (Exception $e) {
        error_log("Order fetch error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to fetch orders']);
    }
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $content = trim(file_get_contents("php://input"));
    $decoded = json_decode($content, true);

    if (!is_array($decoded)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid JSON payload']);
        exit;
    }

    // --- NEW: Proactive Hardening (Heartbeat & Cancellation) ---
    $action = $decoded['action'] ?? null;
    $orderRef = $decoded['reference'] ?? $decoded['payment_reference'] ?? null;

    if ($action === 'heartbeat' && $orderRef) {
        $stmt = $pdo->prepare("UPDATE orders SET last_activity_at = NOW() WHERE payment_reference = ? AND status = 'pending'");
        $stmt->execute([$orderRef]);
        echo json_encode(['success' => true, 'message' => 'Heartbeat updated']);
        exit;
    }

    if ($action === 'cancel' && $orderRef) {
        $stmt = $pdo->prepare("UPDATE orders SET status = 'cancelled' WHERE payment_reference = ? AND status = 'pending'");
        $stmt->execute([$orderRef]);
        if ($stmt->rowCount() > 0) {
            $getOid = $pdo->prepare("SELECT id FROM orders WHERE payment_reference = ?");
            $getOid->execute([$orderRef]);
            $orderId = $getOid->fetchColumn();
            if ($orderId) {
                $pdo->prepare("INSERT INTO order_status_logs (order_id, status_key, message) VALUES (?, 'cancelled', 'User abandoned checkout (Proactive Release)')")
                    ->execute([$orderId]);
            }
        }
        echo json_encode(['success' => true, 'message' => 'Reservation released']);
        exit;
    }
    // -----------------------------------------------------------

    $userId = $authenticatedUserId;
    $uStmt = $pdo->prepare("SELECT region FROM users WHERE id = ?");
    $uStmt->execute([$userId]);
    $userRegion = $uStmt->fetchColumn() ?: 'Greater Accra (GA)';

    $items = $decoded['items'] ?? [];
    $totalAmount = round((float)($decoded['total_amount'] ?? 0), 2);
    $shippingAddress = sanitizeInput($decoded['shipping_address'] ?? '');
    $paymentMethod = sanitizeInput($decoded['payment_method'] ?? 'card');
    $paymentReference = $decoded['payment_reference'] ?? null;
    $isExternalPayment = !empty($paymentReference);

    if (!$paymentReference) {
        $hash = substr(md5(uniqid(mt_rand(), true)), 0, 8);
        $paymentReference = "EC-" . date('Y/m') . "-" . strtoupper($hash) . "-" . date('H');
    }
    $paymentReference = sanitizeInput($paymentReference);
    $couponCode = sanitizeInput($decoded['coupon_code'] ?? null);
    $discountAmount = (float)($decoded['discount_amount'] ?? 0);

    if (empty($items) || $totalAmount <= 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Missing required fields']);
        exit;
    }

    if ($isExternalPayment) {
        $secretKey = $config['PAYSTACK_SECRET'] ?? "";
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, "https://api.paystack.co/transaction/verify/" . rawurlencode($paymentReference));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ["Authorization: Bearer " . $secretKey]);
        $result = curl_exec($ch);
        curl_close($ch);
        $response = json_decode($result, true);
        if (!$response || !isset($response['data']) || $response['data']['status'] !== 'success') {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Payment verification failed']);
            exit;
        }
        $orderStatus = 'processing';
    } else {
        $orderStatus = 'pending';
    }

    $pdo->beginTransaction();
    try {
        foreach ($items as &$item) {
            $pId = (int)$item['id'];
            $qty = (int)$item['quantity'];
            $pQuery = $pdo->prepare("SELECT name, stock_quantity FROM products WHERE id = ? FOR UPDATE");
            $pQuery->execute([$pId]);
            $prod = $pQuery->fetch(PDO::FETCH_ASSOC);
            if (!$prod) throw new Exception("Product #{$pId} not found");

            $available = getAvailableStock($pId, $pdo);
            if ($available < $qty) {
                throw new Exception("Insufficient stock for '{$prod['name']}'. Requested: {$qty}, Available: {$available}.");
            }
            
            // Re-verify price logic (simplified for restoration)
            $pPrice = $pdo->prepare("SELECT price, discount_percent, sale_ends_at FROM products WHERE id = ?");
            $pPrice->execute([$pId]);
            $priceData = $pPrice->fetch(PDO::FETCH_ASSOC);
            $item['price'] = getEffectivePrice($priceData);
        }
        unset($item);

        $deliveryOtp = sprintf("%06d", mt_rand(100000, 999999));
        $stmt = $pdo->prepare("INSERT INTO orders (user_id, total_amount, coupon_code, discount_amount, status, reserved_at, last_activity_at, delivery_otp, shipping_address, payment_method, payment_reference) VALUES (?, ?, ?, ?, ?, UTC_TIMESTAMP(), UTC_TIMESTAMP(), ?, ?, ?, ?)");
        $stmt->execute([$userId, $totalAmount, $couponCode, $discountAmount, $orderStatus, $deliveryOtp, $shippingAddress, $paymentMethod, $paymentReference]);
        $orderId = $pdo->lastInsertId();
        
        $pdo->prepare("UPDATE orders SET order_number = ? WHERE id = ?")->execute([$paymentReference, $orderId]);

        $stmtItem = $pdo->prepare("INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase) VALUES (?, ?, ?, ?)");
        foreach ($items as $item) {
            $stmtItem->execute([$orderId, $item['id'], $item['quantity'], $item['price']]);
        }

        if ($orderStatus === 'processing') {
            completeOrder($orderId, $pdo);
        }

        $pdo->commit();
        echo json_encode(['success' => true, 'order_id' => $orderId, 'payment_reference' => $paymentReference]);
    } catch (Exception $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}
