<?php
require 'api/db.php';
$stmt = $pdo->query('SELECT * FROM store_branches');
echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC), JSON_PRETTY_PRINT);
