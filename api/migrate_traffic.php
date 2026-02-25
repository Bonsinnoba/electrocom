<?php
require_once 'db.php';

try {
    // Create Traffic Logs Table
    $pdo->exec("CREATE TABLE IF NOT EXISTS traffic_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ip_address VARCHAR(45) NOT NULL,
        user_id INT DEFAULT NULL,
        country VARCHAR(100) DEFAULT 'Unknown',
        city VARCHAR(100) DEFAULT 'Unknown',
        request_url VARCHAR(255),
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");

    // Create Restrictions Table
    $pdo->exec("CREATE TABLE IF NOT EXISTS access_restrictions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        type ENUM('ip', 'country') NOT NULL,
        value VARCHAR(255) NOT NULL,
        reason VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY(type, value)
    )");

    echo "Traffic monitoring tables created successfully.\n";
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
