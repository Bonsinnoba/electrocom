<?php
$config = require '.env.php';
$appEnv = $config['APP_ENV'] ?? 'production';
$allowedOrigins = $config['ALLOWED_ORIGINS'] ?? [];
$frontendUrl = $config['FRONTEND_URL'] ?? 'http://localhost:5173';

// --- Handle CORS ---
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$isLocalhost = $origin && preg_match('/^http:\/\/localhost:\d+$/', $origin);

// Set default headers immediately
if ($appEnv === 'development' && ($isLocalhost || in_array($origin, $allowedOrigins))) {
    header("Access-Control-Allow-Origin: $origin");
} else if ($origin && in_array($origin, $allowedOrigins)) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    // Fallback to configured frontend URL
    header("Access-Control-Allow-Origin: $frontendUrl");
}

header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Max-Age: 86400"); // Cache preflight for 24h

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    header('Content-Type: application/json');
    http_response_code(200);
    exit;
}

require_once 'traffic_monitor.php';
