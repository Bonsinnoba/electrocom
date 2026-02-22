<?php
// backend/db.php
// Secure Database Connection Configuration using PDO

$config = require '.env.php';

$host = $config['DB_HOST'];
$user = $config['DB_USER'];
$pass = $config['DB_PASS'];
$db   = $config['DB_NAME'];
$charset = 'utf8mb4';

$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false, // Important for security against certain injection types
];

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
} catch (\PDOException $e) {
    // SECURITY: Don't expose database credentials/paths in production
    // Instead, log the error and show a generic message
    error_log($e->getMessage());

    header('Content-Type: application/json');
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Internal Server Error: Database Connection Failed.'
    ]);
    exit;
}

/**
 * Helper function to handle JSON responses consistently
 */
function sendResponse($success, $message, $data = null, $code = 200)
{
    header('Content-Type: application/json');
    http_response_code($code);
    echo json_encode([
        'success' => $success,
        'message' => $message,
        'data' => $data
    ]);
    exit;
}
