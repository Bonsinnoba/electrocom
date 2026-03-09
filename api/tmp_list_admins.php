<?php
require 'db.php';
$stmt = $pdo->query("SELECT id, name, email, role FROM users WHERE role IN ('admin', 'super')");
echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
