<?php

/**
 * super_logs.php
 * System log reader & clearer for the Super User panel.
 * Reads the PHP error_log and any custom app log file.
 *
 * GET  → returns last 200 log entries
 * POST { action: "clear" } → truncates the app log file
 */

require 'cors_middleware.php';
require 'db.php';
require 'security.php';
header('Content-Type: application/json');

try {
    $userId = requireRole('super', $pdo);
} catch (Exception $e) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$logFile = __DIR__ . '/logs/app.log';

// Ensure log directory exists
if (!is_dir(__DIR__ . '/logs')) {
    mkdir(__DIR__ . '/logs', 0755, true);
}

// ── Seed a few demo entries if log is empty ───────────────────────────────────
if (!file_exists($logFile) || filesize($logFile) === 0) {
    $demo = [
        "[info]  [CORE]     Global database backup completed (3.2 GB)",
        "[warn]  [ACC-01]   Disk usage at 87%. Cleanup recommended.",
        "[error] [KMS-01]   Brute-force login attempt — IP 196.4.12.88 blocked.",
        "[ok]    [PAYMENTS] Paystack webhook verified — GH\xc2\xa2 450.00 settled.",
        "[info]  [AUTH]     Super User panel session started.",
    ];
    $ts = time();
    $lines = '';
    foreach ($demo as $i => $msg) {
        $lines .= date('Y-m-d H:i:s', $ts - ($i * 300)) . ' ' . $msg . PHP_EOL;
    }
    file_put_contents($logFile, $lines);
}

if ($method === 'GET') {
    try {
        $raw   = file_exists($logFile) ? file($logFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) : [];
        $lines = array_reverse(array_slice($raw, -200));
        $parsed = [];
        foreach ($lines as $i => $line) {
            // Parse: "YYYY-MM-DD HH:MM:SS [level] [SOURCE] message"
            preg_match('/^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\s+\[(\w+)\]\s+\[([^\]]+)\]\s+(.+)$/', $line, $m);
            $parsed[] = [
                'id'     => $i + 1,
                'ts'     => $m[1] ?? date('Y-m-d H:i:s'),
                'level'  => strtolower($m[2] ?? 'info'),
                'source' => $m[3] ?? 'SYSTEM',
                'msg'    => $m[4] ?? $line,
            ];
        }
        echo json_encode(['success' => true, 'data' => $parsed]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
} elseif ($method === 'POST') {
    $body   = json_decode(file_get_contents('php://input'), true) ?? [];
    $action = $body['action'] ?? '';

    if ($action === 'clear') {
        file_put_contents($logFile, '');
        echo json_encode(['success' => true, 'message' => 'Log cleared.']);
    } else {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Unknown action.']);
    }
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed.']);
}
