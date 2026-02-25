<?php
require 'db.php';
$stmt = $pdo->query("SELECT email, password_hash FROM users LIMIT 3");
while ($row = $stmt->fetch()) {
    echo "Email: " . $row['email'] . "\n";
    echo "Hash: " . $row['password_hash'] . "\n";
    echo "Is Argon2: " . (strpos($row['password_hash'], '$argon2id$') === 0 ? "YES" : "NO") . "\n";
    echo "------------------\n";
}
