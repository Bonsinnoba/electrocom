<?php
// backend/track_order.php
require_once 'db.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $content = trim(file_get_contents("php://input"));
    $decoded = json_decode($content, true);

    if (!is_array($decoded)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid JSON payload']);
        exit;
    }

    $orderIdStr = $decoded['order_id'] ?? '';
    $email = $decoded['email'] ?? '';

    if (empty($orderIdStr) || empty($email)) {
        http_response_code(400);
        echo json_encode(['error' => 'Order ID and Email are required']);
        exit;
    }

    // Strip "ORD-" prefix if present
    $id = str_replace('ORD-', '', $orderIdStr);

    try {
        // Query order and verify email matches the user who placed it
        $stmt = $pdo->prepare("
            SELECT o.id, o.total_amount, o.status, o.created_at, o.updated_at, o.shipping_address, o.payment_method, u.email, u.name as customer_name
            FROM orders o
            JOIN users u ON o.user_id = u.id
            WHERE o.id = ? AND u.email = ?
        ");
        $stmt->execute([$id, $email]);
        $order = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$order) {
            http_response_code(404);
            echo json_encode(['error' => 'Order not found or email does not match.']);
            exit;
        }

        // Fetch order items
        $itemStmt = $pdo->prepare("
            SELECT p.name, oi.quantity as qty, oi.price_at_purchase as price, p.image_url
            FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            WHERE oi.order_id = ?
        ");
        $itemStmt->execute([$id]);
        $order['items'] = $itemStmt->fetchAll(PDO::FETCH_ASSOC);

        // Generate tracking timeline based on status
        $timeline = [];
        $createdAt = $order['created_at'];
        $updatedAt = $order['updated_at'];
        $status = $order['status'];

        // 1. Order Placed
        $timeline[] = [
            'status' => 'placed',
            'label' => 'Order Placed',
            'date' => $createdAt,
            'completed' => true
        ];

        // 2. Processing
        $isProcessing = in_array($status, ['processing', 'shipped', 'delivered']);
        $timeline[] = [
            'status' => 'processing',
            'label' => 'Processing',
            'date' => $isProcessing && $status !== 'pending' ? $updatedAt : null, // Approximate
            'completed' => $isProcessing
        ];

        // 3. Shipped
        $isShipped = in_array($status, ['shipped', 'delivered']);
        $timeline[] = [
            'status' => 'shipped',
            'label' => 'Shipped',
            'date' => $isShipped && $status !== 'processing' ? $updatedAt : null,
            'completed' => $isShipped
        ];

        // 4. Delivered
        $isDelivered = $status === 'delivered';
        $timeline[] = [
            'status' => 'delivered',
            'label' => 'Delivered',
            'date' => $isDelivered ? $updatedAt : null,
            'completed' => $isDelivered
        ];

        // Handle Cancelled
        if ($status === 'cancelled') {
            $timeline = [
                [
                    'status' => 'placed',
                    'label' => 'Order Placed',
                    'date' => $createdAt,
                    'completed' => true
                ],
                [
                    'status' => 'cancelled',
                    'label' => 'Order Cancelled',
                    'date' => $updatedAt,
                    'completed' => true,
                    'isError' => true
                ]
            ];
        }

        $order['timeline'] = $timeline;

        // Hide sensitive info if needed, though this is meant for the customer
        // We'll return it as is since they provided the correct email and order ID.

        echo json_encode(['success' => true, 'data' => $order]);
    } catch (Exception $e) {
        error_log("Order tracking error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Failed to retrieve tracking information']);
    }
    exit;
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed']);
}
