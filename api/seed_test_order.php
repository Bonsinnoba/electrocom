<?php
require_once 'db.php';
require_once 'order_utils.php';

// Create a test order for customer (user ID 5)
$pdo->beginTransaction();
try {
    // 1. Insert order
    $ref = "EC-" . date('Y/m') . "-TEST01-" . date('H');
    $stmt = $pdo->prepare("INSERT INTO orders (user_id, order_number, total_amount, coupon_code, discount_amount, status, delivery_otp, shipping_address, payment_method, payment_reference, source_branch_id) VALUES (?, ?, ?, NULL, 0, 'processing', '123456', '12 Test St, Accra', 'card', ?, ?)");
    $stmt->execute([5, $ref, 175.00, $ref, 1]);
    $orderId = $pdo->lastInsertId();
    echo "Created Order ID: $orderId | Ref: $ref\n";

    // 2. Insert order item (soldering iron - product 1, assume it exists)
    $stmt = $pdo->prepare("SELECT id FROM products LIMIT 1");
    $stmt->execute();
    $product = $stmt->fetch(PDO::FETCH_ASSOC);
    $productId = $product['id'];

    $stmt = $pdo->prepare("INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase) VALUES (?, ?, 1, 152.10)");
    $stmt->execute([$orderId, $productId]);
    echo "Added product ID $productId to order.\n";

    // 3. Create picking task for Branch 1 (HQ)
    $stmt = $pdo->prepare("INSERT INTO picking_tasks (order_id, branch_id, status) VALUES (?, 1, 'pending')");
    $stmt->execute([$orderId]);
    $taskId = $pdo->lastInsertId();
    echo "Created Picking Task ID: $taskId\n";

    $pdo->commit();
    echo "\nSuccess! Test data created:\n";
    echo "  Order ID: $orderId (status: processing)\n";
    echo "  Task ID: $taskId (status: pending, branch: 1)\n";
    echo "  Customer ID: 5 (customer@test.com)\n";
} catch (Exception $e) {
    $pdo->rollBack();
    echo "Error: " . $e->getMessage() . "\n";
}
