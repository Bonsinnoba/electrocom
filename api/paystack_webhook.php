<?php
/**
 * Paystack Webhook Handler
 * This script handles asynchronous notifications from Paystack.
 * It does NOT require user authentication via session/cookie.
 */

require_once 'db.php';
require_once 'security.php';
require_once 'order_utils.php';

// Disable error reporting for cleaner output to Paystack
error_reporting(0);

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    exit;
}

// 1. Validate Paystack Signature
$secretKey = $config['PAYSTACK_SECRET'] ?? "";

if (!$secretKey) {
    logger('error', 'WEBHOOK', "Paystack Secret Key is missing in .env.php");
    exit;
}

$input = file_get_contents("php://input");
$paystackSignature = $_SERVER['HTTP_X_PAYSTACK_SIGNATURE'] ?? '';

if ($paystackSignature !== hash_hmac('sha256', $input, $secretKey)) {
    logger('warning', 'WEBHOOK', "Invalid Paystack signature received.");
    http_response_code(401);
    exit;
}

// 2. Parse Event Data
$event = json_decode($input, true);

if (!$event || !isset($event['event'])) {
    exit;
}

// 3. Handle Events
http_response_code(200); // Acknowledge receipt early


// ─── charge.success ──────────────────────────────────────────────────────────
if ($event['event'] === 'charge.success') {
    $data = $event['data'];
    $reference = $data['reference'];
    $amountPaid = $data['amount'] / 100; // kobo to GHS
    $customerEmail = $data['customer']['email'];

    try {
        // Find user by email (as fallback) or metadata if we sent user_id in payload
        $userId = $data['metadata']['user_id'] ?? null;
        if (!$userId) {
            $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
            $stmt->execute([$customerEmail]);
            $userId = $stmt->fetchColumn();
        }

        if (!$userId) {
            logger('error', 'WEBHOOK', "Could not find user for email: $customerEmail (Ref: $reference)");
            exit;
        }

        $pdo->beginTransaction();

        // Check if reference already processed
        // In orders:
        $stmt = $pdo->prepare("SELECT id, status FROM orders WHERE payment_reference = ?");
        $stmt->execute([$reference]);
        $order = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($order) {
            completeOrder($order['id'], $pdo);
            logger('ok', 'WEBHOOK', "Order #{$order['id']} completed via webhook.");
        } else {
            // Handle other payment types if necessary in the future
        }

        $pdo->commit();
    } catch (Exception $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        logger('error', 'WEBHOOK', "Webhook processing error: " . $e->getMessage());
    }
}

// ─── Refund lifecycle events ──────────────────────────────────────────────────
//
// Paystack fires these events for every refund action:
//   refund.pending    – Paystack has queued the refund but not yet settled it
//   refund.processed  – Money successfully returned to the customer
//   refund.failed     – Card/wallet rejected the refund (e.g. prepaid card closed)
//                       Paystack will credit the amount back to your merchant balance.
//
// We match by gateway_ref (the numeric Paystack refund ID stored at issue time).
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Map a Paystack refund event to an internal refunds.status value.
 * Returns null if the event should be ignored.
 */
function paystackEventToRefundStatus(string $eventName): ?string
{
    return match ($eventName) {
        'refund.processed' => 'processed',
        'refund.failed'    => 'failed',
        'refund.pending'   => 'pending',
        default            => null,
    };
}

$newStatus = paystackEventToRefundStatus($event['event']);

if ($newStatus !== null) {
    $data = $event['data'] ?? [];

    // Paystack puts the refund object inside data.
    // The refund id can appear as data.id or data.refund.id depending on event version.
    $paystackRefundId = (string)($data['id'] ?? $data['refund']['id'] ?? '');
    $paystackTxRef    = $data['transaction']['reference'] ?? $data['reference'] ?? '';
    $amountGhs        = isset($data['amount']) ? round((int)$data['amount'] / 100, 2) : null;

    if (empty($paystackRefundId) && empty($paystackTxRef)) {
        logger('warning', 'WEBHOOK_REFUND', "Refund event '{$event['event']}' received with no identifiable reference.");
        exit;
    }

    try {
        // Find the matching row in our refunds table.
        // Primary lookup: by gateway_ref (the Paystack refund ID we stored at issue time).
        // Fallback: by matching the order's payment_reference (transaction ref).
        $refundRow = null;

        if ($paystackRefundId !== '') {
            $stmt = $pdo->prepare('SELECT id, order_id, status FROM refunds WHERE gateway_ref = ? LIMIT 1');
            $stmt->execute([$paystackRefundId]);
            $refundRow = $stmt->fetch(PDO::FETCH_ASSOC);
        }

        if (!$refundRow && $paystackTxRef !== '') {
            // Fallback: match via the order's payment_reference
            $stmt = $pdo->prepare('
                SELECT r.id, r.order_id, r.status
                FROM refunds r
                JOIN orders o ON o.id = r.order_id
                WHERE o.payment_reference = ?
                  AND r.status = "processed"
                ORDER BY r.created_at DESC
                LIMIT 1
            ');
            $stmt->execute([$paystackTxRef]);
            $refundRow = $stmt->fetch(PDO::FETCH_ASSOC);
        }

        if (!$refundRow) {
            logger('warning', 'WEBHOOK_REFUND', "No matching refund row for event '{$event['event']}' (gateway_ref={$paystackRefundId}, tx_ref={$paystackTxRef}).");
            exit;
        }

        // Only update if the status is actually changing (avoid redundant writes).
        if ($refundRow['status'] === $newStatus) {
            logger('ok', 'WEBHOOK_REFUND', "Refund #{$refundRow['id']} already in status '{$newStatus}' — skipping.");
            exit;
        }

        $processedAt = $newStatus === 'processed' ? date('Y-m-d H:i:s') : null;

        $upd = $pdo->prepare('
            UPDATE refunds
            SET status       = ?,
                processed_at = COALESCE(processed_at, ?)
            WHERE id = ?
        ');
        $upd->execute([$newStatus, $processedAt, $refundRow['id']]);

        $logMsg = "Refund #{$refundRow['id']} on ORD-{$refundRow['order_id']} → status '{$newStatus}'";
        if ($amountGhs !== null) {
            $logMsg .= " (GHS {$amountGhs})";
        }
        if ($newStatus === 'failed') {
            $logMsg .= '. Amount returned to merchant Paystack balance — manual cash refund may be needed.';
        }

        logger('ok', 'WEBHOOK_REFUND', $logMsg);

        // ── If the refund failed, notify the customer and flag admins ────────────
        if ($newStatus === 'failed') {
            try {
                require_once __DIR__ . '/email/EmailEngine.php';
                require_once __DIR__ . '/notifications.php';
                require_once __DIR__ . '/config.php';

                $config = require __DIR__ . '/config.php';

                // Fetch customer details via the order
                $custStmt = $pdo->prepare('
                    SELECT u.email, u.name AS customer_name,
                           o.id AS order_id, o.payment_method,
                           r.amount AS refund_amount
                    FROM refunds r
                    JOIN orders o ON o.id = r.order_id
                    JOIN users u  ON u.id = o.user_id
                    WHERE r.id = ?
                    LIMIT 1
                ');
                $custStmt->execute([$refundRow['id']]);
                $custRow = $custStmt->fetch(PDO::FETCH_ASSOC);

                if ($custRow && !empty($custRow['email'])) {
                    // Map payment_method to a human-readable label
                    $methodLabel = match (strtolower((string)($custRow['payment_method'] ?? ''))) {
                        'paystack', 'card' => 'your card via Paystack',
                        'momo'             => 'Mobile Money (MoMo)',
                        'cash'             => 'cash',
                        default            => 'your original payment method',
                    };

                    $engine = new EmailEngine($pdo, $config);
                    $engine->queueTemplate(
                        $custRow['email'],
                        'refund_failed',
                        [
                            'customer_name'   => $custRow['customer_name'] ?? 'Valued Customer',
                            'order_id'        => $custRow['order_id'],
                            'amount'          => number_format((float)($custRow['refund_amount'] ?? $amountGhs ?? 0), 2),
                            'original_method' => $methodLabel,
                            'support_email'   => $config['MAIL_FROM'] ?? '',
                            'store_url'       => $config['APP_URL'] ?? '',
                        ]
                    );

                    logger('ok', 'WEBHOOK_REFUND', "Refund-failed email queued for {$custRow['email']} (ORD-{$custRow['order_id']}).");

                    // Push in-app alert to all admins/super users
                    $notif = new NotificationService();
                    $notif->logAdminNotification(
                        '⚠ Refund Failed – Action Required',
                        "Refund #{$refundRow['id']} of GHS " . number_format((float)($custRow['refund_amount'] ?? $amountGhs ?? 0), 2)
                        . " on ORD-{$custRow['order_id']} was rejected by the payment network (e.g. prepaid card). "
                        . "The customer ({$custRow['email']}) has been notified. Please arrange a manual refund.",
                        'error'
                    );
                }
            } catch (Throwable $emailErr) {
                logger('error', 'WEBHOOK_REFUND', 'Failed to send refund-failed notification: ' . $emailErr->getMessage());
            }
        }
    } catch (Exception $e) {
        logger('error', 'WEBHOOK_REFUND', "Failed to update refund status for event '{$event['event']}': " . $e->getMessage());
    }
}

exit;

