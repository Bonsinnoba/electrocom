<?php
require 'db.php';
// Test deleting product with ID 3 (NextGen Gaming Mouse)
$id = 3;
try {
    $stmt = $pdo->prepare("DELETE FROM products WHERE id = ?");
    $stmt->execute([$id]);
    echo "Deleted product $id. Rows affected: " . $stmt->rowCount();
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
