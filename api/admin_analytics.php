<?php
// backend/admin_analytics.php
require_once 'db.php';
require_once 'security.php';

header('Content-Type: application/json');

// Only Admins/Super Admins and Accountants/Pickers/BranchAdmins
$userId = requireRole(['super', 'admin', 'accountant', 'picker'], $pdo);
// No branch scope - single warehouse system
$branchId = null;

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $settingsFile = __DIR__ . '/data/super_settings.json';
        $storedSettings = file_exists($settingsFile) ? (json_decode(file_get_contents($settingsFile), true) ?? []) : [];
        $insightDefaults = [
            'insightsShipWarnHours' => 24,
            'insightsShipCriticalHours' => 48,
            'insightsLowStockWarnCount' => 5,
            'insightsLowStockCriticalCount' => 12,
            'insightsOnlineRevenueMinPct' => 35,
            'insightsRepeatOrderMin' => 1.2,
            'insightsWeightShip' => 35,
            'insightsWeightStock' => 25,
            'insightsWeightOnline' => 20,
            'insightsWeightRepeat' => 20,
        ];
        $insightConfig = array_merge($insightDefaults, $storedSettings);

        $data = [];
        $whereClause = "1=1";
        $params = [];
        // 1. Total Revenue Breakdown
        $revStmt = $pdo->prepare("
            SELECT COALESCE(order_type, 'online') as type, SUM(total_amount) as total 
            FROM orders 
            WHERE status IN ('delivered', 'shipped', 'completed') 
            AND $whereClause
            GROUP BY COALESCE(order_type, 'online')
        ");
        $revStmt->execute($params);
        $revData = $revStmt->fetchAll(PDO::FETCH_KEY_PAIR);
        $data['revenue_online'] = (float)($revData['online'] ?? 0);
        $data['revenue_pos'] = (float)($revData['pos'] ?? 0);
        $data['total_revenue'] = $data['revenue_online'] + $data['revenue_pos'];

        // 2. Active Users count
        $usersStmt = $pdo->query("SELECT COUNT(id) FROM users WHERE role = 'customer'");
        $data['total_customers'] = (int)$usersStmt->fetchColumn();

        // 3. New Orders (Pending Online)
        $ordersStmt = $pdo->prepare("SELECT COUNT(id) FROM orders WHERE status = 'pending' AND (order_type = 'online' OR order_type IS NULL) AND $whereClause");
        $ordersStmt->execute($params);
        $data['pending_orders'] = (int)$ordersStmt->fetchColumn();

        // 4. Low Stock Products
        $stockStmt = $pdo->query("SELECT COUNT(id) FROM products WHERE stock_quantity <= 10");
        $data['low_stock_count'] = (int)$stockStmt->fetchColumn();

        // 5. Revenue by Day & Type (Last 30 Days) - Pivoted
        $chartStmt = $pdo->prepare("
            SELECT 
                DATE(created_at) as date,
                SUM(CASE WHEN order_type = 'online' OR order_type IS NULL THEN total_amount ELSE 0 END) as online_revenue,
                SUM(CASE WHEN order_type = 'pos' THEN total_amount ELSE 0 END) as pos_revenue,
                SUM(total_amount) as daily_revenue
            FROM orders 
            WHERE status IN ('delivered', 'shipped', 'completed', 'processing')
              AND created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
              AND $whereClause
            GROUP BY DATE(created_at)
            ORDER BY DATE(created_at) ASC
        ");
        $chartStmt->execute($params);
        $data['revenue_chart'] = $chartStmt->fetchAll(PDO::FETCH_ASSOC);


        // 6. Top Selling Products
        $topProdsStmt = $pdo->prepare("
            SELECT p.name, SUM(oi.quantity) as total_sold
            FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            JOIN orders o ON oi.order_id = o.id
            WHERE o.status != 'cancelled'
            GROUP BY oi.product_id
            ORDER BY total_sold DESC
            LIMIT 5
        ");
        $topProdsStmt->execute([]);
        $data['top_products'] = $topProdsStmt->fetchAll(PDO::FETCH_ASSOC);

        // 7. Inventory Status Breakdown
        $invStmt = $pdo->query("
            SELECT 
                SUM(CASE WHEN stock_quantity > 10 THEN 1 ELSE 0 END) as optimal,
                SUM(CASE WHEN stock_quantity > 0 AND stock_quantity <= 10 THEN 1 ELSE 0 END) as low,
                SUM(CASE WHEN stock_quantity = 0 THEN 1 ELSE 0 END) as out_of_stock
            FROM products
        ");
        $data['inventory_status'] = $invStmt->fetch(PDO::FETCH_ASSOC);

        // 8. Strategic Insights
        // a. Revenue Peak
        $peakRevenue = 0;
        foreach ($data['revenue_chart'] as $day) {
            if ($day['daily_revenue'] > $peakRevenue) {
                $peakRevenue = $day['daily_revenue'];
            }
        }
        $data['strategic_insights']['revenue_peak'] = $peakRevenue;

        // b. Fulfillment Efficiency (Avg time to ship in hours)
        $effStmt = $pdo->query("
            SELECT AVG(TIMESTAMPDIFF(HOUR, created_at, updated_at)) 
            FROM orders 
            WHERE status IN ('shipped', 'delivered')
        ");
        $data['strategic_insights']['ship_efficiency'] = round((float)$effStmt->fetchColumn(), 1) ?: 0;

        // c. Total Orders count
        $totalOrdersStmt = $pdo->query("SELECT COUNT(id) FROM orders WHERE status != 'cancelled'");
        $data['total_orders'] = (int)$totalOrdersStmt->fetchColumn();

        // d. Average Order Value
        $data['avg_order_value'] = $data['total_orders'] > 0 ? round($data['total_revenue'] / $data['total_orders'], 2) : 0;

        // e. Business Health Status (configurable weighted model)
        $shipWarnHours = max(1, (float)$insightConfig['insightsShipWarnHours']);
        $shipCriticalHours = max($shipWarnHours + 1, (float)$insightConfig['insightsShipCriticalHours']);
        $lowStockWarnCount = max(0, (int)$insightConfig['insightsLowStockWarnCount']);
        $lowStockCriticalCount = max($lowStockWarnCount + 1, (int)$insightConfig['insightsLowStockCriticalCount']);
        $onlineRevenueMinPct = max(0, min(100, (float)$insightConfig['insightsOnlineRevenueMinPct']));
        $repeatOrderMin = max(0.5, (float)$insightConfig['insightsRepeatOrderMin']);

        $weightShip = max(0, (float)$insightConfig['insightsWeightShip']);
        $weightStock = max(0, (float)$insightConfig['insightsWeightStock']);
        $weightOnline = max(0, (float)$insightConfig['insightsWeightOnline']);
        $weightRepeat = max(0, (float)$insightConfig['insightsWeightRepeat']);

        $healthScore = 100;
        $alerts = [];

        $shipEfficiency = (float)$data['strategic_insights']['ship_efficiency'];
        if ($shipEfficiency > $shipCriticalHours) {
            $healthScore -= $weightShip;
            $alerts[] = ['severity' => 3, 'message' => 'Fulfillment is critically slow. Review dispatch workflow and picker load.'];
        } elseif ($shipEfficiency > $shipWarnHours) {
            $healthScore -= round($weightShip * 0.55, 1);
            $alerts[] = ['severity' => 2, 'message' => 'Fulfillment speed is below target. Consider improving dispatch turnaround.'];
        }

        $lowStockCount = (int)$data['low_stock_count'];
        if ($lowStockCount >= $lowStockCriticalCount) {
            $healthScore -= $weightStock;
            $alerts[] = ['severity' => 3, 'message' => 'Critical stock pressure detected. Prioritize restocking high-demand items.'];
        } elseif ($lowStockCount >= $lowStockWarnCount) {
            $healthScore -= round($weightStock * 0.55, 1);
            $alerts[] = ['severity' => 2, 'message' => 'Stock risk rising. Prepare replenishment to avoid missed sales.'];
        }

        $onlinePct = $data['total_revenue'] > 0
            ? (($data['revenue_online'] / $data['total_revenue']) * 100)
            : 100;
        if ($onlinePct < $onlineRevenueMinPct) {
            $healthScore -= $weightOnline;
            $alerts[] = ['severity' => 1, 'message' => 'Online revenue share is below target. Improve digital conversion and campaigns.'];
        }

        $repeatRatio = $data['total_customers'] > 0
            ? ($data['total_orders'] / $data['total_customers'])
            : $repeatOrderMin;
        if ($repeatRatio < $repeatOrderMin) {
            $healthScore -= $weightRepeat;
            $alerts[] = ['severity' => 1, 'message' => 'Repeat purchase ratio is below target. Increase retention and reorder nudges.'];
        }

        $healthScore = max(0, min(100, (int)round($healthScore)));
        usort($alerts, fn($a, $b) => $b['severity'] <=> $a['severity']);
        $healthMsg = count($alerts) > 0 ? $alerts[0]['message'] : 'Operational efficiency is stable.';

        $data['strategic_insights']['health_score'] = $healthScore;
        $data['strategic_insights']['health_message'] = $healthMsg;
        $data['strategic_insights']['health_breakdown'] = [
            'online_pct' => round($onlinePct, 1),
            'repeat_ratio' => round($repeatRatio, 2),
            'ship_warn_hours' => $shipWarnHours,
            'ship_critical_hours' => $shipCriticalHours,
            'low_stock_warn_count' => $lowStockWarnCount,
            'low_stock_critical_count' => $lowStockCriticalCount
        ];

        // 9. Sales by Category
        $catStmt = $pdo->prepare("
            SELECT p.category, SUM(oi.quantity * oi.price_at_purchase) as revenue
            FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            JOIN orders o ON oi.order_id = o.id
            WHERE o.status != 'cancelled'
            GROUP BY p.category
            ORDER BY revenue DESC
            LIMIT 10
        ");
        $catStmt->execute([]);
        $data['sales_by_category'] = $catStmt->fetchAll(PDO::FETCH_ASSOC);

        // 10. Recent Activity
        $recentStmt = $pdo->prepare("
            SELECT o.id, o.total_amount, o.status, o.created_at, o.order_type,
                   u.name as customer_name
            FROM orders o
            LEFT JOIN users u ON o.user_id = u.id
            WHERE $whereClause
            ORDER BY o.created_at DESC
            LIMIT 10
        ");
        $recentStmt->execute($params);
        $data['recent_activity'] = $recentStmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode(['success' => true, 'data' => $data]);
    } catch (Exception $e) {
        error_log("Analytics fetch error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to fetch analytics data']);
    }
    exit;
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed']);
}
