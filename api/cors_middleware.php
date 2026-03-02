<?php
$config = require '.env.php';
$frontendUrl = $config['FRONTEND_URL'] ?? 'http://localhost:5173';

header("Access-Control-Allow-Origin: $frontendUrl");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Credentials: true");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    // Return early for preflight requests
    http_response_code(200);
    exit;
}

require_once 'traffic_monitor.php';
