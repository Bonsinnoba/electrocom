<?php
require_once 'db.php';
require_once 'security.php';
requireRole('super', $pdo);
require_once 'cors_middleware.php';

header('Content-Type: application/json');

// Seed test gallery images (Unsplash URLs) into the first 3 products
$testGallery = json_encode([
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400',
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
    'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400'
]);

// Get first 3 products
$products = $pdo->query("SELECT id, name FROM products ORDER BY created_at DESC LIMIT 3")->fetchAll();

$updated = [];
foreach ($products as $p) {
    $stmt = $pdo->prepare("UPDATE products SET gallery = ? WHERE id = ?");
    $stmt->execute([$testGallery, $p['id']]);
    $updated[] = ['id' => $p['id'], 'name' => $p['name']];
}

echo json_encode(['success' => true, 'seeded_products' => $updated, 'gallery' => json_decode($testGallery)]);
