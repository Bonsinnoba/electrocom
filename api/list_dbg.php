<?php
require 'db.php';
$stmt = $pdo->query("SELECT * FROM products");
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo "DEBUGGING PRODUCTS START\n";
foreach ($rows as $row) {
    echo "ID: " . $row['id'] . " | NAME: " . $row['name'] . " | CAT: " . $row['category'] . "\n";
}
echo "DEBUGGING PRODUCTS END\n";
