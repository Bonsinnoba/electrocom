<?php
require 'db.php';
require 'security.php';
requireRole('super', $pdo);
header('Content-Type: application/json');
try {
    $products = $pdo->query("SELECT * FROM products LIMIT 5")->fetchAll(PDO::FETCH_ASSOC);
    $slides = $pdo->query("SELECT * FROM slider_images")->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(['products' => $products, 'slides' => $slides]);
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
