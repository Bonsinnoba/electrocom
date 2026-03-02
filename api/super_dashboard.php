<?php

/**
 * super_dashboard.php
 * Real aggregate stats for the Super User Dashboard.
 * No auth enforced here — add token check before production.
 *
 * GET → returns: total_revenue, total_orders, total_users,
 *                total_admins, total_products, recent_orders,
 *                orders_by_status, branches
 */

require 'cors_middleware.php';
require 'db.php';
require 'security.php';
header('Content-Type: application/json');

try {
    $userId = requireRole('super', $pdo);

    // ── Revenue & Orders ─────────────────────────────────────────────────────
    $revenueRow = $pdo->query("
        SELECT
            COALESCE(SUM(total_amount), 0)  AS total_revenue,
            COUNT(*)                         AS total_orders,
            SUM(CASE WHEN status='pending'   THEN 1 ELSE 0 END) AS pending,
            SUM(CASE WHEN status='processing'THEN 1 ELSE 0 END) AS processing,
            SUM(CASE WHEN status='shipped'   THEN 1 ELSE 0 END) AS shipped,
            SUM(CASE WHEN status='delivered' THEN 1 ELSE 0 END) AS delivered,
            SUM(CASE WHEN status='cancelled' THEN 1 ELSE 0 END) AS cancelled
        FROM orders
    ")->fetch();

    // ── Users ────────────────────────────────────────────────────────────────
    $userRow = $pdo->query("
        SELECT
            COUNT(*) AS total_users,
            SUM(CASE WHEN role='admin' THEN 1 ELSE 0 END) AS total_admins
        FROM users
    ")->fetch();

    // ── Products ─────────────────────────────────────────────────────────────
    $productRow = $pdo->query("SELECT COUNT(*) AS total_products FROM products")->fetch();

    // ── Recent Orders (last 5) ────────────────────────────────────────────────
    $recent = $pdo->query("
        SELECT o.id, o.total_amount, o.status, o.created_at,
               u.name AS customer, u.email
        FROM orders o
        JOIN users u ON o.user_id = u.id
        ORDER BY o.created_at DESC
        LIMIT 5
    ")->fetchAll();

    $pdo->exec("CREATE TABLE IF NOT EXISTS store_branches (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        branch_code VARCHAR(50) UNIQUE,
        address TEXT,
        lat DECIMAL(10,6) DEFAULT NULL,
        lng DECIMAL(10,6) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");

    $branches = $pdo->query("SELECT * FROM store_branches ORDER BY name ASC")->fetchAll();

    // Dynamic Load Calculation
    foreach ($branches as &$b) {
        if ($b['type'] === 'headquarters') {
            // HQ Load = (Pending Orders / 50) * 100, capped at 100.
            // 50 is an arbitrary "High Pressure" threshold.
            $hqLoad = min(100, round(($revenueRow['pending'] / 50) * 100));
            $b['load_level'] = $hqLoad;
        } else {
            // Warehouse Load = (Pending Dispatches / 10) * 100, capped at 100.
            // 10 is an arbitrary "High Pressure" threshold per warehouse.
            $stmt = $pdo->prepare("SELECT COUNT(*) FROM warehouse_dispatches WHERE warehouse_id = ? AND status = 'pending'");
            $stmt->execute([$b['id']]);
            $pendingDispatches = $stmt->fetchColumn();
            $whLoad = min(100, round(($pendingDispatches / 10) * 100));
            $b['load_level'] = $whLoad;
        }
    }

    // ── Compose response ──────────────────────────────────────────────────────
    echo json_encode([
        'success'        => true,
        'total_revenue'  => (float)$revenueRow['total_revenue'],
        'total_orders'   => (int)$revenueRow['total_orders'],
        'pending_orders' => (int)$revenueRow['pending'],
        'total_users'    => (int)$userRow['total_users'],
        'total_admins'   => (int)$userRow['total_admins'],
        'total_products' => (int)$productRow['total_products'],
        'orders_by_status' => [
            'pending'    => (int)($revenueRow['pending'] ?? 0),
            'processing' => (int)($revenueRow['processing'] ?? 0),
            'shipped'    => (int)($revenueRow['shipped'] ?? 0),
            'delivered'  => (int)($revenueRow['delivered'] ?? 0),
            'cancelled'  => (int)($revenueRow['cancelled'] ?? 0),
        ],
        'recent_orders'  => $recent,
        'branches'       => $branches,
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
