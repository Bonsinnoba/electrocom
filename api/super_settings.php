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
require_once __DIR__ . '/brand_settings.php';
header('Content-Type: application/json');

// Authenticate and Require Roles
try {
    $userId = authenticate($pdo);
    $role = getUserRole($userId, $pdo);
    
    $method = $_SERVER['REQUEST_METHOD'];
    if ($method === 'GET') {
        // All admins can read settings (e.g. for maintenance check)
        requireRole(RBAC_ALL_ADMINS, $pdo);
    } else {
        // Only super can modify
        requireRole('super', $pdo);
    }
} catch (Exception $e) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    exit;
}

$settingsFile = eh_super_settings_path();

// Ensure data directory exists
if (!is_dir(__DIR__ . '/data')) {
    mkdir(__DIR__ . '/data', 0755, true);
}

$DEFAULTS = eh_super_settings_defaults_full();

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
    logAdminAudit($pdo, $userId, 'settings.update', 'super_settings', 'global', [
        'changed_keys' => array_keys($safe)
    ]);
    echo json_encode(['success' => true, 'message' => 'Settings saved.', 'data' => $merged]);
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed.']);
}
