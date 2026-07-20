<?php
require 'api/db.php';
$stmt = $pdo->query('SELECT * FROM flash_sale_banner_settings');
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
