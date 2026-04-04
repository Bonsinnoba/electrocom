<?php
require_once 'db.php';
require_once 'security.php';

header('Content-Type: application/json');

try {
    // 1. Authenticate User
    $userId = authenticate($pdo);

    // 2. Get Input Data
    $data = json_decode(file_get_contents("php://input"), true);

    if (!isset($data['reference'])) {
        sendResponse(false, 'Missing payment reference', null, 400);
    }

    $reference = sanitizeInput($data['reference']);
    $type = isset($data['type']) ? sanitizeInput($data['type']) : 'wallet_topup'; // 'wallet_topup' or 'order_payment'

    // 3. Verify with Paystack
    $secretKey = $config['PAYSTACK_SECRET'] ?? "";

    if (!$secretKey) {
        throw new Exception("Paystack Secret Key is missing in environment.");
    }

    $url = "https://api.paystack.co/transaction/verify/" . rawurlencode($reference);

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        "Authorization: Bearer " . $secretKey,
        "Cache-Control: no-cache",
    ]);

    $result = curl_exec($ch);
    $error = curl_error($ch);
    curl_close($ch);

    if ($error) {
        throw new Exception("cURL Error: " . $error);
    }

    $response = json_decode($result, true);

    if (!$response || !isset($response['status']) || !$response['status']) {
        sendResponse(false, 'Verification failed at gateway', null, 400);
    }

    if ($response['data']['status'] !== 'success') {
        sendResponse(false, 'Transaction was not successful: ' . $response['data']['gateway_response'], null, 400);
    }

    // 4. Check if reference already used (Idempotency)
    // FIX #7: Self-heal wallet_transactions table — it may not exist on fresh installs
    try {
        $pdo->exec("CREATE TABLE IF NOT EXISTS wallet_transactions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            reference VARCHAR(100) UNIQUE NOT NULL,
            amount DECIMAL(10,2),
            type VARCHAR(50),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )");
    } catch (Exception $schemaErr) {
        error_log("wallet_transactions schema check failed: " . $schemaErr->getMessage());
    }

    // Check wallet_transactions
    $stmt = $pdo->prepare("SELECT id FROM wallet_transactions WHERE reference = ?");
    $stmt->execute([$reference]);
    if ($stmt->fetch()) {
        sendResponse(false, 'Transaction reference already used', null, 409);
    }

    // Check orders
    $stmt = $pdo->prepare("SELECT id FROM orders WHERE payment_reference = ?");
    $stmt->execute([$reference]);
    if ($stmt->fetch()) {
        sendResponse(false, 'Transaction reference already used', null, 409);
    }

    // 5. Process Value
    $amountPaid = $response['data']['amount'] / 100; // Paystack returns kobo

    $pdo->beginTransaction();

    if ($type === 'order_payment') {
        // If order_id is provided, update it.
        if (isset($data['order_id'])) {
            $orderId = (int)$data['order_id'];
            require_once 'order_utils.php';
            completeOrder($orderId, $pdo);
            $message = "Order verification complete";
        } else {
            // Just verifying for valid payment to allow order creation
            $message = "Payment verified successfully";
        }
    } else {
        throw new Exception("Invalid transaction type or wallet top-ups are disabled.");
    }

    $pdo->commit();

    sendResponse(true, $message, [
        'amount' => $amountPaid,
        'reference' => $reference,
        'new_balance' => ($type === 'wallet_topup') ? fetchUserBalance($pdo, $userId) : null
    ]);
} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Verification error: ' . $e->getMessage()]);
}

function fetchUserBalance($pdo, $userId)
{
    $stmt = $pdo->prepare("SELECT wallet_balance FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    return $stmt->fetchColumn();
}
