<?php
$config = require '.env.php';
$pdo = new PDO("mysql:host={$config['DB_HOST']};dbname={$config['DB_NAME']};charset=utf8mb4", $config['DB_USER'], $config['DB_PASS']);
$stmt = $pdo->query("SHOW TABLES");
while ($row = $stmt->fetch(PDO::FETCH_NUM)) {
    echo $row[0] . PHP_EOL;
}
