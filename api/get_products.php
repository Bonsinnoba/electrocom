<?php
// backend/get_products.php
require_once 'db.php';

try {
    $category = $_GET['category'] ?? null;

    if ($category) {
        $stmt = $pdo->prepare("SELECT * FROM products WHERE category = ? ORDER BY created_at DESC");
        $stmt->execute([$category]);
    } else {
        $stmt = $pdo->query("SELECT * FROM products ORDER BY created_at DESC");
    }

    $products = $stmt->fetchAll();

    $productIds = array_column($products, 'id');
    $variantsByProduct = [];
    if (!empty($productIds)) {
        $inQuery = implode(',', array_fill(0, count($productIds), '?'));
        $varStmt = $pdo->prepare("SELECT * FROM product_variants WHERE product_id IN ($inQuery)");
        $varStmt->execute($productIds);
        while ($v = $varStmt->fetch(PDO::FETCH_ASSOC)) {
            $v['attributes'] = json_decode($v['attributes'] ?? '[]', true);
            $v['price_modifier'] = (float)$v['price_modifier'];
            $v['stock_quantity'] = (int)$v['stock_quantity'];
            $variantsByProduct[$v['product_id']][] = $v;
        }
    }

    // Decode JSON fields for frontend compatibility
    foreach ($products as &$product) {
        $product['colors'] = json_decode($product['colors'] ?? '[]', true);
        $product['specs'] = json_decode($product['specs'] ?? '{}', true);
        $product['included'] = json_decode($product['included'] ?? '[]', true);
        $product['gallery'] = json_decode($product['gallery'] ?? '[]', true);
        $product['price'] = (float)$product['price'];
        $product['rating'] = (float)($product['rating'] ?? 0);
        $product['variants'] = $variantsByProduct[$product['id']] ?? [];
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
