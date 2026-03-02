<?php
require_once 'db.php';
require_once 'security.php';
requireRole('super', $pdo);

try {
    $columns = [
        "verification_code VARCHAR(10) DEFAULT NULL",
        "is_verified TINYINT(1) DEFAULT 0",
        "verification_method ENUM('email', 'sms') DEFAULT 'email'",
        "id_number VARCHAR(50) DEFAULT NULL",
        "id_photo LONGTEXT DEFAULT NULL",
        "id_verified TINYINT(1) DEFAULT 0",
        "id_verified_at DATETIME DEFAULT NULL",
        "id_verification_reason VARCHAR(255) DEFAULT NULL",
        "id_verifier_id INT DEFAULT NULL"
    ];

    foreach ($columns as $colDef) {
        try {
            $colName = explode(' ', $colDef)[0];
            $pdo->exec("ALTER TABLE users ADD COLUMN $colDef");
            echo "Column '$colName' added successfully.\n";
        } catch (PDOException $e) {
            if (strpos($e->getMessage(), 'Duplicate column name') !== false) {
                echo "Column '$colName' already exists.\n";
            } else {
                echo "Error adding '$colName': " . $e->getMessage() . "\n";
            }
        }
    }
} catch (Exception $e) {
    echo "Global Migration Error: " . $e->getMessage() . "\n";
}
