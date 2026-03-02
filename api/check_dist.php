<?php
require 'db.php';
require 'security.php';
requireRole('super', $pdo);
header('Content-Type: application/json');
try {
    $categories = $pdo->query("SELECT category, COUNT(*) as count FROM products GROUP BY category")->fetchAll(PDO::FETCH_ASSOC);
    $all_ids = $pdo->query("SELECT id FROM products ORDER BY id DESC")->fetchAll(PDO::FETCH_COLUMN);
    echo json_encode(['categories' => $categories, 'ids' => $all_ids]);
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
