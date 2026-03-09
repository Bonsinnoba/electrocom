<?php
require 'db.php';
require 'security.php';

$email = 'admin@electrocom.com';
$newPassword = 'admin'; // Keeping it simple for the subagent

$hash = hashPassword($newPassword);
$stmt = $pdo->prepare("UPDATE users SET password_hash = ?, login_attempts = 0, lockout_until = NULL WHERE email = ?");
$success = $stmt->execute([$hash, $email]);

if ($success) {
    echo "Password reset successfully for $email. New password: $newPassword";
} else {
    echo "Failed to reset password.";
}
