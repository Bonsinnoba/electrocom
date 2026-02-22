<?php
require_once 'db.php';
require_once 'cors_middleware.php';

header('Content-Type: application/json');

$stmt = $pdo->query("SELECT id, name, image_url, gallery FROM products ORDER BY created_at DESC LIMIT 10");
$products = $stmt->fetchAll();

foreach ($products as &$p) {
    $p['gallery_raw'] = $p['gallery']; // raw JSON string
    $p['gallery_decoded'] = json_decode($p['gallery'] ?? '[]', true);
}

echo json_encode(['success' => true, 'data' => $products], JSON_PRETTY_PRINT);
