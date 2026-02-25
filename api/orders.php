<?php
// backend/orders.php
require_once 'cors_middleware.php';
require_once 'db.php';
require_once 'security.php';

header('Content-Type: application/json');

// Authenticate User for all order operations
$authenticatedUserId = authenticate();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // If an ID is provided, verify it matches the authenticated user
    // Otherwise, just use the authenticated user's ID
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
            logger('info', 'PAYMENTS', "Wallet payment initiated for GH\xc2\xa2 {$totalAmount} by User ID: {$userId}");
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

        logger('ok', 'ORDERS', "New order created: ORD-{$orderId} (Amt: GH\xc2\xa2 {$totalAmount}) by User ID: {$userId}");

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
