<?php
$config = require '.env.php';
require 'security.php';
$pdo = new PDO("mysql:host={$config['DB_HOST']};dbname={$config['DB_NAME']};charset=utf8mb4", $config['DB_USER'], $config['DB_PASS']);
requireRole('super', $pdo);
$stmt = $pdo->query("DESCRIBE product_locations");
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    print_r($row);
}
