<?php
require 'db.php';
$stmt = $pdo->query("SELECT email, is_verified, auth_provider, status, verification_code FROM users");
$users = $stmt->fetchAll(PDO::FETCH_ASSOC);
file_put_contents('diag_users.txt', print_r($users, true));
echo "Done";
