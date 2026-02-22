<?php
require 'db.php';
try {
    $products = $pdo->query("SELECT id, name, image_url FROM products WHERE image_url LIKE '%product_%'")->fetchAll(PDO::FETCH_ASSOC);
    file_put_contents('debug_uploaded_products.txt', print_r($products, true));
} catch (Exception $e) {
    file_put_contents('debug_uploaded_products.txt', $e->getMessage());
}
