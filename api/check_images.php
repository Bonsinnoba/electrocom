<?php
require 'db.php';
header('Content-Type: application/json');
try {
    $products = $pdo->query("SELECT id, name, image_url FROM products")->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($products);
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
