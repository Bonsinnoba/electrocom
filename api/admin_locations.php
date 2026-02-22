<?php
require_once 'cors_middleware.php';
require_once 'db.php';
require_once 'security.php';

header('Content-Type: application/json');

// Authenticate Admin
try {
    $userId = authenticate();
} catch (Exception $e) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized: Authentication failed']);
    exit;
}

$stmt = $pdo->prepare("SELECT role FROM users WHERE id = ?");
$stmt->execute([$userId]);
$user = $stmt->fetch();

if (!$user || $user['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Unauthorized: Admin access required']);
    exit;
}

// Self-healing: Create tables
try {
    $pdo->exec("CREATE TABLE IF NOT EXISTS store_branches (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        branch_code VARCHAR(50) UNIQUE,
        address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");

    $pdo->exec("CREATE TABLE IF NOT EXISTS product_locations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT NOT NULL,
        branch_id INT NOT NULL,
        shelf_label VARCHAR(100),
        bin_label VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        FOREIGN KEY (branch_id) REFERENCES store_branches(id) ON DELETE CASCADE
    )");

    // Seed specific branches if none exist
    $count = $pdo->query("SELECT COUNT(*) FROM store_branches")->fetchColumn();
    if ($count == 0) {
        $pdo->exec("INSERT INTO store_branches (name, branch_code, address) VALUES 
            ('Accra Branch', 'ACC-01', 'Spintex Road, Accra'),
            ('Kumasi Branch', 'KMS-01', 'Adum, Kumasi'),
            ('Wa Branch', 'WA-01', 'Main Market, Wa')");
    }
} catch (Exception $e) {
    error_log("Schema migration failed for locations: " . $e->getMessage());
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // Get all branches
    $branches = $pdo->query("SELECT * FROM store_branches ORDER BY name ASC")->fetchAll();

    // Get all products that have locations
    $locations = $pdo->query("
        SELECT pl.*, p.name as product_name, p.image_url, p.product_code 
        FROM product_locations pl
        JOIN products p ON pl.product_id = p.id
    ")->fetchAll();

    echo json_encode([
        'success' => true,
        'branches' => $branches,
        'locations' => $locations
    ]);
} elseif ($method === 'POST') {
    $content = trim(file_get_contents("php://input"));
    $decoded = json_decode($content, true);

    $action = $decoded['action'] ?? '';

    if ($action === 'save_location') {
        $product_id = (int)$decoded['product_id'];
        $branch_id = (int)$decoded['branch_id'];
        $shelf_label = sanitizeInput($decoded['shelf_label'] ?? '');
        $bin_label = sanitizeInput($decoded['bin_label'] ?? '');

        // Verification
        $branch_code_verify = sanitizeInput($decoded['branch_code_verify'] ?? '');
        $admin_name = sanitizeInput($decoded['admin_name'] ?? '');
        $admin_password = $decoded['admin_password'] ?? '';

        $stmt = $pdo->prepare("SELECT branch_code FROM store_branches WHERE id = ?");
        $stmt->execute([$branch_id]);
        $actual_code = $stmt->fetchColumn();

        if ($actual_code !== $branch_code_verify) {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Security Error: Incorrect Branch Code']);
            exit;
        }

        $stmt = $pdo->prepare("SELECT name, password_hash FROM users WHERE id = ? AND role = 'admin'");
        $stmt->execute([$userId]);
        $admin = $stmt->fetch();

        if (!$admin || $admin['name'] !== $admin_name || !verifyPassword($admin_password, $admin['password_hash'])) {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Security Error: Invalid Credentials']);
            exit;
        }

        // Check if location already exists for this product in this branch
        $exists = $pdo->prepare("SELECT id FROM product_locations WHERE product_id = ? AND branch_id = ?");
        $exists->execute([$product_id, $branch_id]);
        $locId = $exists->fetchColumn();

        if ($locId) {
            $stmt = $pdo->prepare("UPDATE product_locations SET shelf_label = ?, bin_label = ? WHERE id = ?");
            $stmt->execute([$shelf_label, $bin_label, $locId]);
        } else {
            $stmt = $pdo->prepare("INSERT INTO product_locations (product_id, branch_id, shelf_label, bin_label) VALUES (?, ?, ?, ?)");
            $stmt->execute([$product_id, $branch_id, $shelf_label, $bin_label]);
        }

        echo json_encode(['success' => true, 'message' => 'Location verified and updated']);
    } elseif ($action === 'delete_location') {
        $id = (int)$decoded['id'];
        $stmt = $pdo->prepare("DELETE FROM product_locations WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(['success' => true, 'message' => 'Location removed']);
    } elseif ($action === 'create_branch') {
        $name = sanitizeInput($decoded['name'] ?? '');
        $code = sanitizeInput($decoded['branch_code'] ?? '');
        $address = sanitizeInput($decoded['address'] ?? '');

        $stmt = $pdo->prepare("INSERT INTO store_branches (name, branch_code, address) VALUES (?, ?, ?)");
        $stmt->execute([$name, $code, $address]);

        echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
    } else {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid action']);
    }
}
