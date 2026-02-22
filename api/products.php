<?php
// backend/products.php
require 'cors_middleware.php';
require 'db.php';

$sql = "SELECT * FROM products ORDER BY created_at DESC";
$stmt = $pdo->prepare($sql);
$stmt->execute();

$products = $stmt->fetchAll(PDO::FETCH_ASSOC);

header('Content-Type: application/json');
echo json_encode($products);
