<?php
// backend/orders.php
require_once 'db.php';
require_once 'security.php';
require_once 'order_utils.php';

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
            order_type ENUM('online', 'pos') DEFAULT 'online',
            source_branch_id INT DEFAULT NULL,
            cashier_id INT DEFAULT NULL,
            review_requested_at DATETIME DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
            FOREIGN KEY (source_branch_id) REFERENCES store_branches(id) ON DELETE SET NULL,
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
        if (!in_array('payment_reference', $cols)) {
             $pdo->exec("ALTER TABLE orders MODIFY COLUMN payment_reference VARCHAR(100) UNIQUE");
        }
        if (!in_array('order_type', $cols)) {
            $pdo->exec("ALTER TABLE orders ADD COLUMN order_type ENUM('online', 'pos') DEFAULT 'online' AFTER user_id");
        }
        if (!in_array('source_branch_id', $cols)) {
            $pdo->exec("ALTER TABLE orders ADD COLUMN source_branch_id INT DEFAULT NULL AFTER order_type");
        }
        if (!in_array('cashier_id', $cols)) {
            $pdo->exec("ALTER TABLE orders ADD COLUMN cashier_id INT DEFAULT NULL AFTER source_branch_id");
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
                SELECT id, total_amount, status, created_at, updated_at, shipping_address, payment_method
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

            echo json_encode(['success' => true, 'data' => $order]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Failed to fetch order details']);
        }
        exit;
    }

    // Otherwise, fetch all orders for the user
    $requestedUserId = $_GET['user_id'] ?? $authenticatedUserId;

    if ($requestedUserId != $authenticatedUserId) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Forbidden: You can only view your own orders']);
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

    // Use authenticated User ID instead of trusting input
    $userId = $authenticatedUserId;

    // Resolve user data for shipping and fulfillment
    $uStmt = $pdo->prepare("SELECT region FROM users WHERE id = ?");
    $uStmt->execute([$userId]);
    $userRegion = $uStmt->fetchColumn() ?: 'Greater Accra (GA)'; // Fallback to GA
    
    // Determine source branch (warehouse)
    $sourceBranchId = resolveFulfillmentBranch($userRegion, $pdo);
    $branchStmt = $pdo->prepare("SELECT name FROM store_branches WHERE id = ?");
    $branchStmt->execute([$sourceBranchId]);
    $sourceBranchName = $branchStmt->fetchColumn() ?: 'Main Warehouse';
    $items = $decoded['items'] ?? [];
    $totalAmount = (float)($decoded['total_amount'] ?? 0);
    $shippingAddress = sanitizeInput($decoded['shipping_address'] ?? '');
    $paymentMethod = sanitizeInput($decoded['payment_method'] ?? 'card');
    
    // CUSTOM ORDER REFERENCE: EC-[YYYY/MM]-[HASH]-[HH]
    $paymentReference = $decoded['payment_reference'] ?? null;
    // Track whether this is an external (Paystack) payment or an internal reference
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
        echo json_encode(['success' => false, 'message' => 'Missing required fields or invalid amount']);
        exit;
    }

    // FIX #12: Only verify with Paystack for external payments.
    // Internal/POS EC- references were not processed via Paystack and should skip this.
    // verify_payment.php already verified Paystack payments before order creation.
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
            echo json_encode(['success' => false, 'message' => 'Invalid or failed payment reference']);
            exit;
        }

        $paidAmount = $response['data']['amount'] / 100;
        if (abs($paidAmount - $totalAmount) > 1.0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Payment amount mismatch. Paid: ' . $paidAmount . ', Required: ' . $totalAmount]);
            exit;
        }

        $orderStatus = 'processing';
        logger('ok', 'PAYMENTS', "Paystack payment verified for GH\xc2\xa2 {$totalAmount} (Ref: {$paymentReference})");
    } else {
        $orderStatus = 'pending';
    }
    
    // Check if an order with this reference already exists (prevent duplicates)
    $checkStmt = $pdo->prepare("SELECT id FROM orders WHERE payment_reference = ?");
    $checkStmt->execute([$paymentReference]);
    if ($checkStmt->fetch()) {
        http_response_code(409);
        echo json_encode(['success' => false, 'message' => 'Order reference already exists.']);
        exit;
    }

    $pdo->beginTransaction();

    try {
        // Add Items and update stock
        foreach ($items as &$item) {
            $productId = (int)$item['id'];
            $quantity = (int)$item['quantity'];

            // Security: Fetch latest product data to verify price
            $pQuery = $pdo->prepare("SELECT price, discount_percent, sale_ends_at FROM products WHERE id = ?");
            $pQuery->execute([$productId]);
            $fullProduct = $pQuery->fetch(PDO::FETCH_ASSOC);
            
            if (!$fullProduct) {
                throw new Exception("Product ID {$productId} not found.");
            }

            // Verify/Set Effective Price
            $verifiedPrice = getEffectivePrice($fullProduct);
            $item['price'] = $verifiedPrice; // Override with server-side calculated price
        }
        unset($item);

        // Calculate expected shipping based on subtotal (total excluding shipping)
        $itemsSubtotal = 0;
        foreach($items as $item) {
            $itemsSubtotal += (float)$item['price'] * (int)$item['quantity'];
        }
        $afterCouponSubtotal = $itemsSubtotal - $discountAmount;
        
        $shippingInfo = calculateRegionalShipping($userRegion, $sourceBranchId, $afterCouponSubtotal, $pdo);
        $expectedShipping = $shippingInfo['fee'];
        $tax = $afterCouponSubtotal * 0.1;
        $expectedTotal = $afterCouponSubtotal + $tax + $expectedShipping;

        // Security check: verify total matches (allow small delta for rounding)
        if (abs($totalAmount - $expectedTotal) > 1.0) {
            $pdo->rollBack();
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => "Order total mismatch. Expected: $expectedTotal, Got: $totalAmount"]);
            exit;
        }

        // Create Order (Initially Pending)
        $deliveryOtp = sprintf("%06d", mt_rand(100000, 999999));
        $stmt = $pdo->prepare("INSERT INTO orders (user_id, total_amount, coupon_code, discount_amount, status, delivery_otp, shipping_address, payment_method, payment_reference, source_branch_id) VALUES (?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?)");
        $stmt->execute([$userId, $totalAmount, $couponCode, $discountAmount, $deliveryOtp, $shippingAddress, $paymentMethod, $paymentReference, $sourceBranchId]);
        $orderId = $pdo->lastInsertId();

        // Update with human-readable order number (matching reference format for consistency)
        $pdo->prepare("UPDATE orders SET order_number = ? WHERE id = ?")->execute([$paymentReference, $orderId]);

        // FIX #8: Removed dead $updateStockStmt/$checkStockStmt — stock deduction
        // happens inside completeOrder() via order_utils.php. These were never executed.
        $stmtItem = $pdo->prepare("INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase) VALUES (?, ?, ?, ?)");

        foreach ($items as $item) {
            $productId = (int)$item['id'];
            $quantity = (int)$item['quantity'];
            $price = (float)$item['price'];

            $stmtItem->execute([$orderId, $productId, $quantity, $price]);
        }

        // --- Mark Abandoned Cart as Recovered ---
        $pdo->prepare("UPDATE abandoned_carts SET status = 'recovered', cart_data = '[]' WHERE user_id = ? AND status = 'active'")->execute([$userId]);

        // --- Notifications & Final Processing ---
        if ($orderStatus === 'processing') {
            completeOrder($orderId, $pdo);
        }

        $pdo->commit();

        logger('ok', 'ORDERS', "New order created: ORD-{$orderId} (Amt: GH\xc2\xa2 {$totalAmount}) by {$authenticatedUserName}. Fulfilling from: {$sourceBranchName} (Branch #{$sourceBranchId})");

    } catch (Exception $e) {
        if ($pdo && $pdo->inTransaction()) {
            $pdo->rollBack();
        }
        error_log("Order creation error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Order creation failed: ' . $e->getMessage()]);
    }
}
