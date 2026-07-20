<?php
require 'api/db.php';
$stmt = $pdo->query('SELECT id, name, email, role, status FROM users LIMIT 20');
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
