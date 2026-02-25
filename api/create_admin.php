<?php
require 'db.php';
require 'security.php';

$name = "Admin User";
$email = "admin@essentialshub.com";
$password = "admin123";
$role = "admin";

try {
    // Check if user already exists
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        echo "Admin user with email $email already exists.";
        // Update role to admin just in case
        $stmt = $pdo->prepare("UPDATE users SET role = 'admin' WHERE email = ?");
        $stmt->execute([$email]);
        echo " Role updated to admin.";
    } else {
        $hash = hashPassword($password);
        $stmt = $pdo->prepare("INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)");
        $stmt->execute([$name, $email, $hash, $role]);
        echo "Admin user created successfully.\n";
        echo "Email: $email\n";
        echo "Password: $password\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
