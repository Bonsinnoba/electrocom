<?php
// backend/get_products.php
require_once 'db.php';
require_once 'cors_middleware.php';

try {
    $category = $_GET['category'] ?? null;

    if ($category) {
        $stmt = $pdo->prepare("SELECT * FROM products WHERE category = ? ORDER BY created_at DESC");
        $stmt->execute([$category]);
    } else {
        $stmt = $pdo->query("SELECT * FROM products ORDER BY created_at DESC");
    }

    $products = $stmt->fetchAll();

    // Decode JSON fields for frontend compatibility
    foreach ($products as &$product) {
        $product['colors'] = json_decode($product['colors'] ?? '[]', true);
        $product['specs'] = json_decode($product['specs'] ?? '{}', true);
        $product['included'] = json_decode($product['included'] ?? '[]', true);
        $product['gallery'] = json_decode($product['gallery'] ?? '[]', true);
        $product['price'] = (float)$product['price'];
        $product['rating'] = (float)($product['rating'] ?? 0);
    }

    echo json_encode([
        'success' => true,
        'data' => $products
    ]);
} catch (PDOException $e) {
    error_log("Fetch products error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Failed to fetch products.']);
}
