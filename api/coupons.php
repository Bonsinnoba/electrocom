<?php
require_once 'db.php';

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

// --- Self-healing Schema & Default Coupons ---
if ($config['DB_AUTO_REPAIR'] ?? true) {
    try {
        $pdo->exec("CREATE TABLE IF NOT EXISTS coupons (
            id INT AUTO_INCREMENT PRIMARY KEY,
            code VARCHAR(50) NOT NULL UNIQUE,
            discount_type ENUM('percent', 'fixed') NOT NULL,
            discount_value DECIMAL(10, 2) NOT NULL,
            min_spend DECIMAL(10, 2) DEFAULT 0.00,
            max_uses INT DEFAULT NULL,
            current_uses INT DEFAULT 0,
            valid_until DATETIME DEFAULT NULL,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )");

        // Ensure COMEBACK5 exists for abandoned cart recovery
        $checkStmt = $pdo->prepare("SELECT id FROM coupons WHERE code = 'COMEBACK5'");
        $checkStmt->execute();
        if (!$checkStmt->fetch()) {
            $pdo->prepare("INSERT INTO coupons (code, discount_type, discount_value, min_spend, is_active) VALUES ('COMEBACK5', 'percent', 5.00, 0.00, 1)")->execute();
            logger('info', 'SYSTEM', "Self-healed: Created default COMEBACK5 coupon for recovery logic.");
        }
    } catch (Exception $e) {
        error_log("Coupons schema repair failed: " . $e->getMessage());
    }
}

// Parse URL action
$action = $_GET['action'] ?? '';

// Storefront Validation Endpoint (Public/User)
if ($method === 'POST' && $action === 'validate') {
    $data = json_decode(file_get_contents('php://input'), true);
    $code = strtoupper(trim($data['code'] ?? ''));
    $cartTotal = (float)($data['cartTotal'] ?? 0);

    if (!$code) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Coupon code is required']);
        exit;
    }

    try {
        $stmt = $pdo->prepare("SELECT * FROM coupons WHERE code = ? AND is_active = TRUE");
        $stmt->execute([$code]);
        $coupon = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$coupon) {
            echo json_encode(['success' => false, 'error' => 'Invalid or expired coupon code.']);
            exit;
        }

        // Check if expired
        if ($coupon['valid_until'] && strtotime($coupon['valid_until']) < time()) {
            echo json_encode(['success' => false, 'error' => 'This coupon has expired.']);
            exit;
        }

        // Check uses
        if ($coupon['max_uses'] !== null && $coupon['current_uses'] >= $coupon['max_uses']) {
            echo json_encode(['success' => false, 'error' => 'This coupon has reached its maximum usage limit.']);
            exit;
        }

        // Check min spend
        if ($cartTotal > 0 && $cartTotal < (float)$coupon['min_spend']) {
            echo json_encode(['success' => false, 'error' => 'Minimum spend of $' . number_format($coupon['min_spend'], 2) . ' required for this coupon.']);
            exit;
        }

        // Calculate discount
        $discountAmount = 0;
        if ($coupon['discount_type'] === 'percent') {
            $discountAmount = $cartTotal * ((float)$coupon['discount_value'] / 100);
        } elseif ($coupon['discount_type'] === 'fixed') {
            $discountAmount = (float)$coupon['discount_value'];
        }

        // Ensure discount doesn't exceed total
        $discountAmount = min($discountAmount, $cartTotal);

        echo json_encode([
            'success' => true,
            'coupon' => [
                'id' => $coupon['id'],
                'code' => $coupon['code'],
                'type' => $coupon['discount_type'],
                'value' => (float)$coupon['discount_value'],
                'discountAmount' => $discountAmount
            ]
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Database error']);
    }
    exit;
}

// ------ Admin Endpoints Below ------
try {
    $userId = requireRole(['admin', 'super', 'marketing'], $pdo);
} catch (Exception $e) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Unauthorized']);
    exit;
}

if ($method === 'GET') {
    // List all coupons
    try {
        $stmt = $pdo->query("SELECT * FROM coupons ORDER BY created_at DESC");
        $coupons = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(['success' => true, 'data' => $coupons]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Database error']);
    }
} elseif ($method === 'POST') {
    // Create or Update Coupon
    $data = json_decode(file_get_contents('php://input'), true);

    $id = $data['id'] ?? null;
    $code = strtoupper(trim($data['code'] ?? ''));
    $type = $data['discount_type'] ?? 'percent';
    $value = (float)($data['discount_value'] ?? 0);
    $minSpend = (float)($data['min_spend'] ?? 0);
    $maxUses = isset($data['max_uses']) && $data['max_uses'] !== '' ? (int)$data['max_uses'] : null;
    $validUntil = !empty($data['valid_until']) ? $data['valid_until'] : null;
    $isActive = isset($data['is_active']) ? (int)$data['is_active'] : 1;

    if (!$code || $value <= 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Code and Valid Discount Value are required.']);
        exit;
    }

    try {
        if ($id) {
            // Update
            $stmt = $pdo->prepare("UPDATE coupons SET code=?, discount_type=?, discount_value=?, min_spend=?, max_uses=?, valid_until=?, is_active=? WHERE id=?");
            $stmt->execute([$code, $type, $value, $minSpend, $maxUses, $validUntil, $isActive, $id]);
        } else {
            // Create
            $stmt = $pdo->prepare("INSERT INTO coupons (code, discount_type, discount_value, min_spend, max_uses, valid_until, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([$code, $type, $value, $minSpend, $maxUses, $validUntil, $isActive]);
        }
        echo json_encode(['success' => true]);
    } catch (PDOException $e) {
        if ($e->getCode() === '23000') { // Unique constraint violation
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Coupon code already exists.']);
            exit;
        }
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
} elseif ($method === 'DELETE') {
    // Delete Coupon
    parse_str(file_get_contents("php://input"), $deleteParams);
    $id = $_GET['id'] ?? $deleteParams['id'] ?? null;

    if (!$id) {
        $data = json_decode(file_get_contents('php://input'), true);
        if ($data && isset($data['id'])) $id = $data['id'];
    }

    if (!$id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'ID is required']);
        exit;
    }

    try {
        $stmt = $pdo->prepare("DELETE FROM coupons WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(['success' => true]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Database error']);
    }
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
}
