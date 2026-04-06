<?php
require_once 'db.php';
require_once 'security.php';

header('Content-Type: application/json');

// Authenticate
try {
    $userId = requireRole(['admin', 'branch_admin', 'marketing'], $pdo);
} catch (Exception $e) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

// Schema is now managed by centralizedMigrations.php
// (005_warehouse_and_dispatches.sql)

$method = $_SERVER['REQUEST_METHOD'];

// ─── GET ─────────────────────────────────────────────────────────────────────
if ($method === 'GET') {
    $action = $_GET['action'] ?? 'overview';

    if ($action === 'dispatches') {
        $warehouseId = isset($_GET['warehouse_id']) ? (int)$_GET['warehouse_id'] : null;

        $sql = "SELECT wd.*, 
                    p.name AS product_name, p.image_url, p.product_code,
                    sb.name AS warehouse_name,
                    u.name AS dispatched_by_name
                FROM warehouse_dispatches wd
                JOIN products p ON wd.product_id = p.id
                JOIN store_branches sb ON wd.warehouse_id = sb.id
                LEFT JOIN users u ON wd.dispatched_by = u.id";

        if ($warehouseId) {
            $stmt = $pdo->prepare($sql . " WHERE wd.warehouse_id = ? ORDER BY wd.dispatched_at DESC");
            $stmt->execute([$warehouseId]);
        } else {
            $stmt = $pdo->prepare($sql . " ORDER BY wd.dispatched_at DESC");
            $stmt->execute();
        }

        echo json_encode(['success' => true, 'data' => $stmt->fetchAll()]);
        exit;
    }

    // For Warehouse Manager: warehouses with dispatch stats
    $stmt = $pdo->prepare("SELECT * FROM store_branches ORDER BY type DESC, name ASC");
    $stmt->execute();
    $warehouses = $stmt->fetchAll();

    foreach ($warehouses as &$w) {
        $stats = $pdo->prepare("SELECT 
            SUM(quantity) as total,
            SUM(CASE WHEN status = 'pending' THEN quantity ELSE 0 END) as pending,
            SUM(CASE WHEN status = 'delivered' THEN quantity ELSE 0 END) as delivered,
            SUM(CASE WHEN status = 'returned' THEN quantity ELSE 0 END) as returned,
            SUM(CASE WHEN status = 'undelivered' THEN quantity ELSE 0 END) as undelivered
            FROM warehouse_dispatches WHERE warehouse_id = ?");
        $stats->execute([$w['id']]);
        $row = $stats->fetch();
        $w['stats'] = [
            'total'       => (int)($row['total'] ?? 0),
            'pending'     => (int)($row['pending'] ?? 0),
            'delivered'   => (int)($row['delivered'] ?? 0),
            'returned'    => (int)($row['returned'] ?? 0),
            'undelivered' => (int)($row['undelivered'] ?? 0)
        ];
    }

    // For Store Layout: products mapped to shelves/bins
    $locationStmt = $pdo->prepare("
        SELECT pl.*, 
               p.name AS product_name, p.product_code, p.image_url,
               sb.name AS branch_name, sb.branch_code
        FROM product_locations pl
        JOIN products p ON pl.product_id = p.id
        JOIN store_branches sb ON pl.branch_id = sb.id
        ORDER BY pl.updated_at DESC
    ");
    $locationStmt->execute();
    $locations = $locationStmt->fetchAll();

    echo json_encode([
        'success'   => true,
        'data'      => $warehouses, // Backward compat for Warehouse Manager
        'branches'  => $warehouses, // For Store Layout
        'locations' => $locations   // For Store Layout
    ]);
    exit;
}

// ─── POST ─────────────────────────────────────────────────────────────────────
if ($method === 'POST') {
    $body   = json_decode(trim(file_get_contents('php://input')), true);
    $action = $body['action'] ?? '';

    // Create warehouse / branch
    if ($action === 'create_warehouse' || $action === 'create_branch') {
        // Strict enforcement: only super admins can register branches
        if (getUserRole($userId, $pdo) !== 'super') {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Forbidden: Only Super Admins can register new warehouses.']);
            exit;
        }

        $name    = sanitizeInput($body['name'] ?? '');
        $code    = sanitizeInput($body['branch_code'] ?? '');
        $address = sanitizeInput($body['address'] ?? '');
        $region  = sanitizeInput($body['region'] ?? '');

        if (!$name) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Name is required']);
            exit;
        }

        try {
            $stmt = $pdo->prepare("INSERT INTO store_branches (name, branch_code, address, region, type) VALUES (?, ?, ?, ?, 'warehouse')");
            $stmt->execute([$name, $code, $address, $region]);
            logger('info', 'WAREHOUSE', "New warehouse/branch created: $name by User $userId");
            echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
        } catch (PDOException $e) {
            http_response_code(409);
            echo json_encode(['success' => false, 'message' => 'Code already exists or DB error.']);
        }
        exit;
    }

    // Delete warehouse (non-HQ only)
    if ($action === 'delete_warehouse') {
        $id = (int)($body['id'] ?? 0);
        $check = $pdo->prepare("SELECT type FROM store_branches WHERE id = ?");
        $check->execute([$id]);
        $row = $check->fetch();

        if (!$row) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Warehouse not found']);
            exit;
        }
        if ($row['type'] === 'headquarters') {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Headquarters cannot be deleted']);
            exit;
        }

        $pdo->prepare("DELETE FROM store_branches WHERE id = ?")->execute([$id]);
        echo json_encode(['success' => true]);
        exit;
    }

    // Create dispatch
    if ($action === 'dispatch') {
        $warehouseId = (int)($body['warehouse_id'] ?? 0);
        $productId   = (int)($body['product_id'] ?? 0);
        $quantity    = max(1, (int)($body['quantity'] ?? 1));
        $notes       = sanitizeInput($body['notes'] ?? '');

        if (!$warehouseId || !$productId) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'warehouse_id and product_id are required']);
            exit;
        }

        // Confirm target is a warehouse, not HQ
        $typeCheck = $pdo->prepare("SELECT type FROM store_branches WHERE id = ?");
        $typeCheck->execute([$warehouseId]);
        $warehouseRow = $typeCheck->fetch();

        if (!$warehouseRow) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Warehouse not found']);
            exit;
        }
        if ($warehouseRow['type'] === 'headquarters') {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Cannot dispatch to Headquarters']);
            exit;
        }

        try {
            $pdo->beginTransaction();

            // 1. Check product stock
            $pCheck = $pdo->prepare("SELECT stock_quantity, name FROM products WHERE id = ?");
            $pCheck->execute([$productId]);
            $product = $pCheck->fetch();

            if (!$product) {
                throw new Exception("Product not found");
            }
            if ($product['stock_quantity'] < $quantity) {
                throw new Exception("Insufficient stock for {$product['name']}. Current: {$product['stock_quantity']}");
            }

            // 2. Deduct from main stock
            $deduct = $pdo->prepare("UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?");
            $deduct->execute([$quantity, $productId]);

            // 3. Create dispatch record
            $stmt = $pdo->prepare("INSERT INTO warehouse_dispatches (warehouse_id, product_id, quantity, notes, dispatched_by) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([$warehouseId, $productId, $quantity, $notes, $userId]);
            $dispatchId = $pdo->lastInsertId();

            $pdo->commit();
            logger('info', 'DISPATCH', "Product $productId dispatched to warehouse $warehouseId (qty: $quantity). Stock deducted.");
            echo json_encode(['success' => true, 'id' => $dispatchId]);
        } catch (Exception $e) {
            if ($pdo->inTransaction()) $pdo->rollBack();
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
        exit;
    }

    // Update dispatch status
    if ($action === 'update_dispatch_status') {
        $id     = (int)($body['id'] ?? 0);
        $status = $body['status'] ?? '';

        if (!in_array($status, ['pending', 'delivered', 'returned', 'undelivered'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid status']);
            exit;
        }

        try {
            $pdo->beginTransaction();

            // Fetch current state
            $current = $pdo->prepare("SELECT status, product_id, quantity FROM warehouse_dispatches WHERE id = ?");
            $current->execute([$id]);
            $old = $current->fetch();
            if (!$old) throw new Exception("Dispatch record not found");

            if ($status === 'returned' && $old['status'] !== 'returned') {
                $upd = $pdo->prepare("UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?");
                $upd->execute([$old['quantity'], $old['product_id']]);
                logger('info', 'DISPATCH', "Dispatch #$id returned. Stock restored for Product #{$old['product_id']}");
            } elseif ($old['status'] === 'returned' && $status !== 'returned') {
                $upd = $pdo->prepare("UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?");
                $upd->execute([$old['quantity'], $old['product_id']]);
                logger('info', 'DISPATCH', "Dispatch #$id changed from returned to $status. Stock re-deducted.");
            }

            $stmt = $pdo->prepare("UPDATE warehouse_dispatches SET status = ? WHERE id = ?");
            $stmt->execute([$status, $id]);

            $pdo->commit();
            echo json_encode(['success' => true]);
        } catch (Exception $e) {
            if ($pdo->inTransaction()) $pdo->rollBack();
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
        exit;
    }

    // Save Physical Product Location
    if ($action === 'save_location') {
        $branchId  = (int)($body['branch_id'] ?? 0);
        $productId = (int)($body['product_id'] ?? 0);
        $shelf     = sanitizeInput($body['shelf_label'] ?? '');
        $bin       = sanitizeInput($body['bin_label'] ?? '');

        // Security checks (optional: verify branch_code matches)
        if (!$branchId || !$productId || !$shelf) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Branch, Product, and Shelf are required']);
            exit;
        }

        // Upsert logic
        $stmt = $pdo->prepare("SELECT id FROM product_locations WHERE product_id = ? AND branch_id = ?");
        $stmt->execute([$productId, $branchId]);
        $existingId = $stmt->fetchColumn();

        if ($existingId) {
            $upd = $pdo->prepare("UPDATE product_locations SET shelf_label = ?, bin_label = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?");
            $upd->execute([$shelf, $bin, $existingId]);
        } else {
            $ins = $pdo->prepare("INSERT INTO product_locations (product_id, branch_id, shelf_label, bin_label) VALUES (?, ?, ?, ?)");
            $ins->execute([$productId, $branchId, $shelf, $bin]);
        }

        logger('info', 'INVENTORY', "Location updated for Product $productId in Branch $branchId: Shelf $shelf, Bin $bin");
        echo json_encode(['success' => true]);
        exit;
    }

    // Delete Physical Product Location
    if ($action === 'delete_location') {
        $id = (int)($body['id'] ?? 0);
        $pdo->prepare("DELETE FROM product_locations WHERE id = ?")->execute([$id]);
        echo json_encode(['success' => true]);
        exit;
    }

    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Unknown action']);
}
