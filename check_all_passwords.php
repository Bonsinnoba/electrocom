<?php
require 'api/db.php';
require 'api/security.php';

echo "--- Global Password Integrity Check ---\n";

try {
    $stmt = $pdo->query("SELECT id, name, email, role, password_hash FROM users");
    $users = $stmt->fetchAll();

    if (!$users) {
        echo "No users found in the database.\n";
        exit;
    }

    $commonPasswords = ['admin123', 'password', 'password123', '12345678', 'customer123'];

    foreach ($users as $user) {
        echo "\nUser: {$user['name']} ({$user['email']}) [Role: {$user['role']}]\n";

        $verified = false;
        foreach ($commonPasswords as $pass) {
            $needsRehash = false;
            if (verifyPassword($pass, $user['password_hash'], $needsRehash)) {
                echo "  - Password Verified: SUCCESS (Matched: '$pass')\n";
                echo "  - Needs Rehash: " . ($needsRehash ? "YES" : "NO") . "\n";
                $verified = true;
                break;
            }
        }

        if (!$verified) {
            echo "  - Password Verification: FAILED (None of the common passwords matched)\n";
            echo "  - Hash Prefix: " . substr($user['password_hash'], 0, 10) . "...\n";
        }
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
