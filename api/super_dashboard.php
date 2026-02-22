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
header('Content-Type: application/json');

try {
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

    // ── Ensure store_branches exists & is seeded ──────────────────────────────
    $pdo->exec("CREATE TABLE IF NOT EXISTS store_branches (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        branch_code VARCHAR(50) UNIQUE,
        address TEXT,
        lat DECIMAL(10,6) DEFAULT NULL,
        lng DECIMAL(10,6) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");

    // Add lat/lng columns if missing (migration safe)
    try {
        $pdo->exec("ALTER TABLE store_branches ADD COLUMN lat DECIMAL(10,6) DEFAULT NULL");
    } catch (Exception $e) {
    }
    try {
        $pdo->exec("ALTER TABLE store_branches ADD COLUMN lng DECIMAL(10,6) DEFAULT NULL");
    } catch (Exception $e) {
    }

    $branchCount = $pdo->query("SELECT COUNT(*) FROM store_branches")->fetchColumn();
    if ($branchCount == 0) {
        $pdo->exec("INSERT INTO store_branches (name, branch_code, address, lat, lng) VALUES
            ('Accra Headquarters', 'ACC-01', 'Spintex Road, Accra, Ghana',    5.6547,  -0.1711),
            ('Kumasi Distribution','KMS-01', 'Adum, Kumasi, Ghana',            6.6885,  -1.6244),
            ('Wa Regional Office', 'WA-01',  'Main Market, Wa, Upper West',   10.0601, -2.5099)
        ");
    } else {
        // Back-fill missing coordinates
        $pdo->exec("UPDATE store_branches SET lat=5.6547,  lng=-0.1711 WHERE branch_code='ACC-01' AND lat IS NULL");
        $pdo->exec("UPDATE store_branches SET lat=6.6885,  lng=-1.6244 WHERE branch_code='KMS-01' AND lat IS NULL");
        $pdo->exec("UPDATE store_branches SET lat=10.0601, lng=-2.5099 WHERE branch_code='WA-01'  AND lat IS NULL");
    }

    $branches = $pdo->query("SELECT * FROM store_branches ORDER BY name ASC")->fetchAll();

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
            'pending'    => (int)$revenueRow['pending'],
            'processing' => (int)$revenueRow['processing'],
            'shipped'    => (int)$revenueRow['shipped'],
            'delivered'  => (int)$revenueRow['delivered'],
            'cancelled'  => (int)$revenueRow['cancelled'],
        ],
        'recent_orders'  => $recent,
        'branches'       => $branches,
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
