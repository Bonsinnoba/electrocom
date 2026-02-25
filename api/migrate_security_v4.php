<?php
require 'db.php';

try {
    // 1. Add login protection columns if they don't exist
    $cols = $pdo->query("SHOW COLUMNS FROM users LIKE 'login_attempts'")->fetchAll();
    if (empty($cols)) {
        $pdo->exec("ALTER TABLE users ADD COLUMN login_attempts INT DEFAULT 0, ADD COLUMN lockout_until TIMESTAMP NULL DEFAULT NULL");
        echo "Login protection columns added.<br>";
    } else {
        echo "Login protection columns already exist.<br>";
    }

    // 2. Create a table for Rate Limiting if it doesn't exist
    // Using a table for rate limiting is persistent but Memory (Redis) would be better.
    // For this environment, we'll use a file-based cache or a simple table.
    $pdo->exec("CREATE TABLE IF NOT EXISTS api_rate_limits (
        ip_address VARCHAR(45) PRIMARY KEY,
        request_count INT DEFAULT 1,
        last_request TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )");
    echo "Rate limiting table verified.<br>";
} catch (PDOException $e) {
    echo "Migration failed: " . $e->getMessage();
}
