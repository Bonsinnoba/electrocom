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

$settingsFile = __DIR__ . '/data/super_settings.json';

// Ensure data directory exists
if (!is_dir(__DIR__ . '/data')) {
    mkdir(__DIR__ . '/data', 0755, true);
}

$DEFAULTS = [
    // ── Identity ─────────────────────────────────────────────────────────────
    'siteName'          => 'ElectroCom',
    'siteEmail'         => 'admin@electrocom.gh',
    'phone1'            => '0536683393',
    'phone2'            => '0506408074',
    'whatsapp'          => '233536683393',
    // ── General (new) ────────────────────────────────────────────────────────
    'siteLogoUrl'       => '',
    'faviconUrl'        => '',
    'storeAddress'      => '',
    'businessHours'     => 'Mon–Fri, 8am–6pm',
    'socialInstagram'   => '',
    'socialTwitter'     => '',
    'socialFacebook'    => '',
    'socialTikTok'      => '',
    'socialYoutube'     => '',
    // ── Branding (new) ────────────────────────────────────────────────────────
    'primaryColor'            => '#3b82f6',
    'accentColor'             => '#f59e0b',
    'headerBg'                => '#0f172a',
    'fontFamily'              => 'Inter',
    'heroBannerTagline'       => '',
    'heroBannerSubtext'       => '',
    'heroCTAText'             => 'Shop Now',
    'heroCTAUrl'              => '/products',
    // ── Security ─────────────────────────────────────────────────────────────
    'maintenanceMode'          => false,
    'allowRegistration'        => true,
    'maxLoginAttempts'         => 5,
    'sessionTimeout'           => 60,
    'twoFactorAdmin'           => false,
    'lockoutDuration'          => 30,
    'passwordMinLength'        => 8,
    'requireEmailVerification' => false,
    'requireNumberInPassword'  => false,
    // ── Notifications ─────────────────────────────────────────────────────────
    'emailNotify'       => true,
    'securityAlerts'    => true,
    'lowStockThreshold' => 5,
    'lowStockAlertEmail'=> 'admin@electrocom.gh',
    // ── System ────────────────────────────────────────────────────────────────
    'apiRateLimit'             => 100,
    'debugMode'                => false,
    'backupFrequency'          => 'daily',
    'defaultItemsPerPage'      => 12,
    'orderReceiptFooterNote'   => '',
    'homepageSectionTitle'     => 'New Arrivals',
    'homepageFeaturedCategory' => '',
    'vatRate'                  => 0,
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
