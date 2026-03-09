<?php
require_once 'db.php';
require_once 'security.php';

header('Content-Type: application/json');

try {
    // --- Self-healing Schema ---
    if ($config['DB_AUTO_REPAIR'] ?? false) {
        try {
            $pdo->exec("CREATE TABLE IF NOT EXISTS wallet_transactions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                amount DECIMAL(10, 2) NOT NULL,
                type ENUM('credit', 'debit') NOT NULL,
                reference VARCHAR(100),
                title VARCHAR(255),
                details TEXT,
                status ENUM('completed', 'pending', 'failed') DEFAULT 'completed',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )");
        } catch (Exception $e) {
            error_log("Wallet schema self-healing failed: " . $e->getMessage());
        }
    }

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
