<?php
require 'db.php';
require 'security.php';
requireRole('super', $pdo);
try {
    $products = $pdo->query("SELECT id, name, image_url FROM products ORDER BY id DESC LIMIT 10")->fetchAll(PDO::FETCH_ASSOC);
    file_put_contents('debug_products.txt', print_r($products, true));
} catch (Exception $e) {
    file_put_contents('debug_products.txt', $e->getMessage());
}
