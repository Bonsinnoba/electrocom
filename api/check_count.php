<?php
require 'db.php';
$stmt = $pdo->query("SELECT COUNT(*) FROM products");
echo "Count: " . $stmt->fetchColumn();
