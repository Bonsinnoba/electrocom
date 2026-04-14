<?php
/**
 * Stale cart/session hygiene and queue archival.
 * Run daily: php cron_data_hygiene.php
 */
require_once 'db.php';

$report = ['abandoned_carts_marked' => 0, 'queue_archived' => 0, 'idempotency_pruned' => 0];

try {
    // Mark very old active abandoned carts as abandoned
    $u = $pdo->exec("
        UPDATE abandoned_carts
        SET status = 'abandoned'
        WHERE status = 'active'
          AND last_updated < DATE_SUB(NOW(), INTERVAL 120 DAY)
    ");
    $report['abandoned_carts_marked'] = (int)$u;
} catch (Exception $e) {
    error_log('hygiene abandoned_carts: ' . $e->getMessage());
}

try {
    // Drop old sent queue rows (compact archive = delete processed noise)
    $d = $pdo->exec("
        DELETE FROM notification_queue
        WHERE status = 'sent'
          AND processed_at IS NOT NULL
          AND processed_at < DATE_SUB(NOW(), INTERVAL 180 DAY)
        LIMIT 5000
    ");
    $report['queue_archived'] = (int)$d;
} catch (Exception $e) {
    error_log('hygiene notification_queue: ' . $e->getMessage());
}

try {
    // Completed idempotency keys older than 90 days
    $d2 = $pdo->exec("
        DELETE FROM order_idempotency
        WHERE status = 'completed'
          AND updated_at < DATE_SUB(NOW(), INTERVAL 90 DAY)
        LIMIT 2000
    ");
    $report['idempotency_pruned'] = (int)$d2;
} catch (Exception $e) {
    error_log('hygiene order_idempotency: ' . $e->getMessage());
}

if (function_exists('logger')) {
    logger('info', 'HYGIENE', json_encode($report));
}
