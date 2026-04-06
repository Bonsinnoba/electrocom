<?php
require 'db.php';
$pdo->exec("UPDATE users SET is_verified = 1 WHERE auth_provider IN ('google', 'github')");
echo 'Done';
