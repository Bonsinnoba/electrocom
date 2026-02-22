<?php
require 'db.php';
try {
    $products = $pdo->query("SELECT id, name, category, price FROM products WHERE id IN (6, 7)")->fetchAll(PDO::FETCH_ASSOC);
    file_put_contents('debug_id67.txt', print_r($products, true));
} catch (Exception $e) {
    file_put_contents('debug_id67.txt', $e->getMessage());
}
