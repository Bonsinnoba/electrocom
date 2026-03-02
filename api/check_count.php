<?php
require 'db.php';
require 'security.php';
requireRole('super', $pdo);
$stmt = $pdo->query("SELECT COUNT(*) FROM products");
echo "Count: " . $stmt->fetchColumn();
