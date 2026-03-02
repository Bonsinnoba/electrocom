<?php
// api/cleanup_demo.php
require 'db.php';
require 'security.php';
requireRole('super', $pdo);
require 'security.php';

header('Content-Type: application/json');

/**
 * CAUTION: This script wipes all demo data.
 * It truncates products, slider images, and branches.
 * It can only be run by a Super Admin.
 */

try {
    $userId = requireRole('super', $pdo);

    // Perform Truncations
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 0");

    $pdo->exec("TRUNCATE TABLE products");
    $pdo->exec("TRUNCATE TABLE slider_images");
    $pdo->exec("TRUNCATE TABLE store_branches");
    // Optionally truncate orders and logs if the user wants a full factory reset
    // $pdo->exec("TRUNCATE TABLE orders");
    // $pdo->exec("TRUNCATE TABLE order_items");
    // $pdo->exec("TRUNCATE TABLE traffic_logs");

    $pdo->exec("SET FOREIGN_KEY_CHECKS = 1");

    logger('info', 'SYSTEM', "Demo data cleanup performed by User ID: {$userId}");

    echo json_encode(['success' => true, 'message' => 'All demo data (Products, Sliders, Branches) has been wiped successfully.']);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Cleanup failed: ' . $e->getMessage()]);
}
