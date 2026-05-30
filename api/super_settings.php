<?php

/**
 * super_settings.php
 * Global settings store for the Super User panel.
 * Critical settings are stored in database, branding settings in JSON file.
 *
 * GET  → returns current settings (merged from DB + JSON)
 * POST → saves updated settings payload (critical to DB, branding to JSON)
 */

require 'cors_middleware.php';
require 'db.php';
require 'security.php';
require_once __DIR__ . '/cache.php';
require_once __DIR__ . '/brand_settings.php';
header('Content-Type: application/json');

// Authenticate and Require Roles
try {
    error_log('POST super_settings: Starting authentication');
    $userId = authenticate($pdo);
    error_log('POST super_settings: User authenticated: ' . $userId);
    $role = getUserRole($userId, $pdo);
    error_log('POST super_settings: User role: ' . $role);

    $method = $_SERVER['REQUEST_METHOD'];
    if ($method === 'GET') {
        // All admins can read settings (e.g. for maintenance check)
        requireRole(RBAC_ALL_ADMINS, $pdo);
    } else {
        // Only super can modify
        error_log('POST super_settings: Requiring super role');
        requireRole('super', $pdo);
        error_log('POST super_settings: Super role confirmed');
    }
} catch (Exception $e) {
    error_log('POST super_settings: Authentication error: ' . $e->getMessage());
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
$CRITICAL_KEYS = eh_critical_db_settings_keys();

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // Return merged settings from both sources
    $merged = eh_merged_super_settings();
    echo json_encode(['success' => true, 'data' => $merged]);
} elseif ($method === 'POST') {
    error_log('POST super_settings: Starting request processing');
    
    $rawInput = file_get_contents('php://input');
    if ($rawInput === false) {
        error_log('POST super_settings: Failed to read request body');
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Failed to read request body.']);
        exit;
    }
    
    error_log('POST super_settings: Raw input length: ' . strlen($rawInput));
    
    $body = json_decode($rawInput, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        error_log('POST super_settings: JSON decode error: ' . json_last_error_msg());
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid JSON payload: ' . json_last_error_msg()]);
        exit;
    }
    
    if (!is_array($body)) {
        error_log('POST super_settings: Body is not an array');
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid JSON payload.']);
        exit;
    }
    
    error_log('POST super_settings: Body keys: ' . implode(', ', array_keys($body)));

    // Separate critical and non-critical settings
    $criticalSettings = array_intersect_key($body, array_flip($CRITICAL_KEYS));
    $brandingSettings = array_diff_key($body, array_flip($CRITICAL_KEYS));

    // Only persist known keys
    $safeCritical = array_intersect_key($criticalSettings, $DEFAULTS);
    $safeBranding = array_intersect_key($brandingSettings, $DEFAULTS);

    error_log('POST super_settings: Safe critical keys: ' . implode(', ', array_keys($safeCritical)));
    error_log('POST super_settings: Safe branding keys: ' . implode(', ', array_keys($safeBranding)));

    $changedKeys = [];

    // Save critical settings to database
    if (!empty($safeCritical)) {
        error_log('POST super_settings: Starting database transaction for ' . count($safeCritical) . ' critical settings');
        try {
            $pdo->beginTransaction();

            foreach ($safeCritical as $key => $value) {
                // Determine value type
                $valueType = 'string';
                if (is_bool($value)) {
                    $valueType = 'boolean';
                    $value = $value ? 'true' : 'false';
                } elseif (is_int($value)) {
                    $valueType = 'integer';
                } elseif (is_float($value)) {
                    $valueType = 'float';
                }

                // Determine category
                $category = 'operational';
                if (in_array($key, ['maxLoginAttempts', 'sessionTimeout', 'twoFactorAdmin', 'lockoutDuration',
                                  'passwordMinLength', 'requireEmailVerification', 'requireNumberInPassword',
                                  'apiRateLimit', 'emailNotify', 'securityAlerts', 'debugMode'])) {
                    $category = 'security';
                } elseif (in_array($key, ['vatRate', 'allowRegistration', 'allowCardPayment', 'lowStockThreshold',
                                        'lowStockAlertEmail', 'integrityDiscountThreshold', 'integrityDiscountPct'])) {
                    $category = 'business';
                } elseif (in_array($key, ['allowDoorToDoorDelivery', 'doorToDoorThreshold'])) {
                    $category = 'delivery';
                }

                // Determine if public
                $isPublic = in_array($key, ['vatRate', 'allowRegistration', 'allowCardPayment',
                                           'allowDoorToDoorDelivery', 'doorToDoorThreshold',
                                           'integrityDiscountThreshold', 'integrityDiscountPct',
                                           'defaultItemsPerPage', 'homepageSectionTitle',
                                           'homepageFeaturedCategory', 'orderReceiptFooterNote']) ? 1 : 0;

                // Upsert into database
                $stmt = $pdo->prepare("
                    INSERT INTO site_settings (setting_key, setting_value, value_type, category, is_public)
                    VALUES (:key, :value, :type, :category, :is_public)
                    ON DUPLICATE KEY UPDATE
                        setting_value = VALUES(setting_value),
                        value_type = VALUES(value_type),
                        category = VALUES(category),
                        is_public = VALUES(is_public),
                        updated_at = CURRENT_TIMESTAMP
                ");
                $stmt->execute([
                    ':key' => $key,
                    ':value' => is_string($value) ? $value : json_encode($value),
                    ':type' => $valueType,
                    ':category' => $category,
                    ':is_public' => $isPublic
                ]);

                $changedKeys[] = $key;
            }

            $pdo->commit();
            error_log('POST super_settings: Database transaction committed successfully');
        } catch (Exception $e) {
            error_log('POST super_settings: Database error: ' . $e->getMessage());
            $pdo->rollBack();
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Failed to save critical settings: ' . $e->getMessage()]);
            exit;
        }
    }

    // Save branding settings to JSON file
    if (!empty($safeBranding)) {
        try {
            error_log('POST super_settings: Attempting to save branding settings to: ' . $settingsFile);
            error_log('POST super_settings: Settings file exists: ' . (file_exists($settingsFile) ? 'yes' : 'no'));
            error_log('POST super_settings: Settings file writable: ' . (is_writable(dirname($settingsFile)) ? 'yes' : 'no'));
            
            $existing = file_exists($settingsFile) ? (json_decode(file_get_contents($settingsFile), true) ?? []) : [];
            $mergedBranding = array_merge($existing, $safeBranding);
            $jsonOutput = json_encode($mergedBranding, JSON_PRETTY_PRINT);
            
            error_log('POST super_settings: JSON output length: ' . strlen($jsonOutput));
            
            $writeResult = file_put_contents($settingsFile, $jsonOutput);
            if ($writeResult === false) {
                $lastError = error_get_last();
                error_log('POST super_settings: Failed to write to settings file: ' . $settingsFile);
                error_log('POST super_settings: Last PHP error: ' . ($lastError['message'] ?? 'unknown'));
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Failed to write to settings file: ' . ($lastError['message'] ?? 'unknown')]);
                exit;
            } else {
                error_log('POST super_settings: Successfully wrote ' . $writeResult . ' bytes to settings file');
            }
            $changedKeys = array_merge($changedKeys, array_keys($safeBranding));
        } catch (Exception $e) {
            error_log('POST super_settings: File write error: ' . $e->getMessage());
            error_log('POST super_settings: Stack trace: ' . $e->getTraceAsString());
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Failed to save branding settings: ' . $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            exit;
        }
    }

    // Log audit with error handling
    try {
        logAdminAudit($pdo, $userId, 'settings.update', 'super_settings', 'global', [
            'changed_keys' => $changedKeys
        ]);
    } catch (Exception $e) {
        error_log('Audit log error: ' . $e->getMessage());
    }

    // Invalidate all settings cache groups
    try {
        eh_cache_delete('db_settings', 'settings');
        eh_cache_delete('merged_settings', 'settings');
        eh_cache_delete('always_load_settings', 'settings_always');
        eh_cache_delete('occasional_settings', 'settings_occasional');
    } catch (Exception $e) {
        error_log('Cache invalidation error: ' . $e->getMessage());
    }

    // Return merged settings (force refresh to bypass cache)
    try {
        $merged = eh_merged_super_settings(true);
    } catch (Exception $e) {
        error_log('Error fetching merged settings: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to fetch merged settings: ' . $e->getMessage()]);
        exit;
    }
    echo json_encode(['success' => true, 'message' => 'Settings saved.', 'data' => $merged]);
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed.']);
}
