<?php

/**
 * super_settings.php
 * Global settings store for the Super User panel.
 * Persists settings as a JSON file server-side.
 *
 * GET  → returns current settings
 * POST → saves updated settings payload
 */

require 'cors_middleware.php';
require 'db.php';
require 'security.php';
header('Content-Type: application/json');

// Authenticate and Require Super Role
try {
    $userId = requireRole('super', $pdo);
} catch (Exception $e) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    exit;
}

$settingsFile = __DIR__ . '/data/super_settings.json';

// Ensure data directory exists
if (!is_dir(__DIR__ . '/data')) {
    mkdir(__DIR__ . '/data', 0755, true);
}

$DEFAULTS = [
    'siteName'          => 'EssentialsHub',
    'siteEmail'         => 'admin@essentialshub.gh',
    'maintenanceMode'   => false,
    'allowRegistration' => true,
    'maxLoginAttempts'  => 5,
    'sessionTimeout'    => 60,
    'twoFactorAdmin'    => false,
    'emailNotify'       => true,
    'securityAlerts'    => true,
    'apiRateLimit'      => 100,
    'debugMode'         => false,
    'backupFrequency'   => 'daily',
];

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stored = file_exists($settingsFile) ? json_decode(file_get_contents($settingsFile), true) : [];
    $merged = array_merge($DEFAULTS, $stored ?? []);
    echo json_encode(['success' => true, 'data' => $merged]);
} elseif ($method === 'POST') {
    $body = json_decode(file_get_contents('php://input'), true);
    if (!is_array($body)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid JSON payload.']);
        exit;
    }

    // Only persist known keys
    $safe = array_intersect_key($body, $DEFAULTS);
    // Merge with existing
    $existing = file_exists($settingsFile) ? (json_decode(file_get_contents($settingsFile), true) ?? []) : [];
    $merged   = array_merge($existing, $safe);

    file_put_contents($settingsFile, json_encode($merged, JSON_PRETTY_PRINT));
    echo json_encode(['success' => true, 'message' => 'Settings saved.', 'data' => $merged]);
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed.']);
}
