<?php
require 'db.php';
header('Content-Type: application/json');
try {
    $stmt = $pdo->query("SELECT * FROM products");
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
