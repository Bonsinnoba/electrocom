<?php
require 'db.php';
require 'security.php';
requireRole('super', $pdo);
$stmt = $pdo->query("SELECT id, name FROM products");
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo json_encode($rows, JSON_PRETTY_PRINT);
