<?php
require 'db.php';
try {
    $stmt = $pdo->query("SELECT id, name, email, role FROM users WHERE role = 'admin'");
    $admins = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($admins);
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
