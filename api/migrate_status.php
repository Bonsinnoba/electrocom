<?php
require 'db.php';

try {
    $pdo->exec("ALTER TABLE users ADD COLUMN status ENUM('Active', 'Suspended') DEFAULT 'Active' AFTER role");
    echo "Migration successful: Added 'status' column to users table.";
} catch (PDOException $e) {
    echo "Migration failed or already applied: " . $e->getMessage();
}
