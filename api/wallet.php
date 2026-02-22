<?php
require_once 'db.php';
require_once 'security.php';
require_once 'cors_middleware.php';

header('Content-Type: application/json');

try {
    // 1. Authenticate User
    $userId = authenticate();

    // 2. Fetch Balance from Users table
    $stmt = $pdo->prepare("SELECT wallet_balance FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $result = $stmt->fetch();

    if (!$result) {
        // Fallback or user not found, return 0
        $balance = 0.00;
        // Maybe insert default if needed, but 'users' should exist
    } else {
        $balance = (float)$result['wallet_balance'];
    }

    // 3. Fetch Transactions
    $stmt = $pdo->prepare("SELECT * FROM wallet_transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 20");
    $stmt->execute([$userId]);
    $transactions = $stmt->fetchAll();

    // Format transactions
    $formattedTx = array_map(function ($tx) {
        return [
            'id' => $tx['id'],
            'amount' => (float)$tx['amount'],
            'type' => $tx['type'],
            'title' => $tx['title'],
            'details' => $tx['details'],
            'status' => $tx['status'],
            'date' => date('M j, Y', strtotime($tx['created_at'])),
            'reference' => $tx['reference'] ?? null
        ];
    }, $transactions);

    echo json_encode([
        'success' => true,
        'balance' => $balance,
        'transactions' => $formattedTx
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error fetching wallet data: ' . $e->getMessage()]);
}
