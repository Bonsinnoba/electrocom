<?php
require 'db.php';
$stmt = $pdo->query("SELECT id, name, email FROM users");
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo json_encode($rows, JSON_PRETTY_PRINT);
