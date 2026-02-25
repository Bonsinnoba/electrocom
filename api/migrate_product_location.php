<?php
require 'db.php';

try {
    $cols = $pdo->query("SHOW COLUMNS FROM products LIKE 'location'")->fetchAll();
    if (empty($cols)) {
        $pdo->exec("ALTER TABLE products ADD COLUMN location VARCHAR(255) DEFAULT NULL");
        echo "Location column added to products table.<br>";
    } else {
        echo "Location column already exists in products table.<br>";
    }
} catch (PDOException $e) {
    echo "Migration failed: " . $e->getMessage();
}
