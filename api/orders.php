<?php
// backend/orders.php
require_once 'cors_middleware.php';
require_once 'db.php';
require_once 'security.php';

header('Content-Type: application/json');

// --- Self-healing Schema ---
if ($config['DB_AUTO_REPAIR'] ?? false) {
    try {
        $pdo->exec("CREATE TABLE IF NOT EXISTS orders (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT,
            total_amount DECIMAL(10, 2) NOT NULL,
            status ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
            shipping_address TEXT,
            payment_method VARCHAR(50),
            payment_reference VARCHAR(100),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
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
        if (!in_array('payment_reference', $cols)) {
            $pdo->exec("ALTER TABLE orders ADD COLUMN payment_reference VARCHAR(100) AFTER payment_method");
        }
    } catch (Exception $e) {
        error_log("Orders schema self-healing failed: " . $e->getMessage());
    }
}

// Authenticate User for all order operations
$authenticatedUserId = authenticate();
$authenticatedUserName = getUserName($authenticatedUserId, $pdo);

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // If a specific order ID is requested
    $orderIdStr = $_GET['order_id'] ?? null;

    if ($orderIdStr) {
        $id = str_replace('ORD-', '', $orderIdStr);
        try {
            $stmt = $pdo->prepare("
                SELECT id, total_amount, status, created_at, updated_at, shipping_address, payment_method
                FROM orders 
                WHERE id = ? AND user_id = ?
            ");
            $stmt->execute([$id, $authenticatedUserId]);
            $order = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$order) {
                http_response_code(404);
                echo json_encode(['error' => 'Order not found']);
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

            echo json_encode(['success' => true, 'data' => $order]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to fetch order details']);
        }
        exit;
    }

    // Otherwise, fetch all orders for the user
    $requestedUserId = $_GET['user_id'] ?? $authenticatedUserId;

    if ($requestedUserId != $authenticatedUserId) {
        http_response_code(403);
        echo json_encode(['error' => 'Forbidden: You can only view your own orders']);
        exit;
    }

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
        echo json_encode(['error' => 'Failed to fetch orders']);
    }
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $content = trim(file_get_contents("php://input"));
    $decoded = json_decode($content, true);

    if (!is_array($decoded)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid JSON payload']);
        exit;
    }

    // Use authenticated User ID instead of trusting input
    $userId = $authenticatedUserId;

    // Check if user is verified
    $userStmt = $pdo->prepare("SELECT id_verified, role FROM users WHERE id = ?");
    $userStmt->execute([$userId]);
    $userData = $userStmt->fetch(PDO::FETCH_ASSOC);

    if (!$userData || ($userData['id_verified'] == 0 && $userData['role'] === 'customer')) {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Verification Required: Please complete your Ghana Card verification to place orders.', 'verification_required' => true]);
        exit;
    }

    $items = $decoded['items'] ?? [];
    $totalAmount = (float)($decoded['total_amount'] ?? 0);
    $shippingAddress = sanitizeInput($decoded['shipping_address'] ?? '');
    $paymentMethod = sanitizeInput($decoded['payment_method'] ?? 'card');
    $paymentReference = sanitizeInput($decoded['payment_reference'] ?? null);

    if (empty($items) || $totalAmount <= 0) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing required fields or invalid amount']);
        exit;
    }

    // Verify Payment if Reference Provided (Security Check)
    if ($paymentReference && strpos($paymentMethod, 'Wallet') === false) {
        $config = require '.env.php';
        $secretKey = $config['PAYSTACK_SECRET'] ?? "sk_test_ReplaceWithYourSecretKeyHere";

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, "https://api.paystack.co/transaction/verify/" . rawurlencode($paymentReference));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ["Authorization: Bearer " . $secretKey]);
        $result = curl_exec($ch);
        curl_close($ch);

        $response = json_decode($result, true);
        if (!$response || !isset($response['data']) || $response['data']['status'] !== 'success') {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid or failed payment reference']);
            exit;
        }

        // Check amount match
        $paidAmount = $response['data']['amount'] / 100;
        if (abs($paidAmount - $totalAmount) > 1.0) { // Allow small difference for fees/rounding
            http_response_code(400);
            echo json_encode(['error' => 'Payment amount mismatch. Paid: ' . $paidAmount . ', Required: ' . $totalAmount]);
            exit;
        }

        $orderStatus = 'processing';
        logger('ok', 'PAYMENTS', "Paystack payment verified for GH\xc2\xa2 {$totalAmount} (Ref: {$paymentReference})");
    } else {
        $orderStatus = 'pending';
        if ($paymentMethod === 'Wallet') {
            logger('info', 'PAYMENTS', "Wallet payment initiated for GH\xc2\xa2 {$totalAmount} by {$authenticatedUserName}");
        }
    }

    $pdo->beginTransaction();

    try {
        // Create Order
        $stmt = $pdo->prepare("INSERT INTO orders (user_id, total_amount, status, shipping_address, payment_method, payment_reference) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([$userId, $totalAmount, $orderStatus, $shippingAddress, $paymentMethod, $paymentReference]);
        $orderId = $pdo->lastInsertId();

        // Add Items
        $stmtItem = $pdo->prepare("INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase) VALUES (?, ?, ?, ?)");

        foreach ($items as $item) {
            $productId = (int)$item['id'];
            $quantity = (int)$item['quantity'];
            $price = (float)$item['price'];

            $stmtItem->execute([$orderId, $productId, $quantity, $price]);
        }

        $pdo->commit();

        logger('ok', 'ORDERS', "New order created: ORD-{$orderId} (Amt: GH\xc2\xa2 {$totalAmount}) by {$authenticatedUserName}");

        echo json_encode(['success' => true, 'order_id' => $orderId]);
    } catch (Exception $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        error_log("Order creation error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Order creation failed']);
    }
}
