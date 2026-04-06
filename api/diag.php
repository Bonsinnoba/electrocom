<?php
require 'db.php';
$stmt = $pdo->query('SHOW COLUMNS FROM users');
$columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
file_put_contents('diag.txt', print_r($columns, true));
echo "Done";
