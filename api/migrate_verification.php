<?php
require_once 'db.php';

try {
    $pdo->exec("ALTER TABLE users 
        ADD COLUMN verification_code VARCHAR(10) DEFAULT NULL,
        ADD COLUMN is_verified TINYINT(1) DEFAULT 0,
        ADD COLUMN verification_method ENUM('email', 'sms') DEFAULT 'email',
        ADD COLUMN id_number VARCHAR(50) DEFAULT NULL,
        ADD COLUMN id_photo LONGTEXT DEFAULT NULL,
        ADD COLUMN id_verified TINYINT(1) DEFAULT 0,
        ADD COLUMN id_verified_at DATETIME DEFAULT NULL,
        ADD COLUMN id_verification_reason VARCHAR(255) DEFAULT NULL,
        ADD COLUMN id_verifier_id INT DEFAULT NULL
    ");
    echo "Verification columns added successfully.\n";
} catch (PDOException $e) {
    if (strpos($e->getMessage(), 'Duplicate column name') !== false) {
        echo "Columns already exist.\n";
    } else {
        echo "Error: " . $e->getMessage() . "\n";
    }
}
