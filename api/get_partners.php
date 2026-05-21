<?php
// backend/get_partners.php
require_once 'cors_middleware.php';
require_once 'db.php';

header('Content-Type: application/json');
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');
header('Expires: 0');

try {
    // Self-healing: Ensure table exists
    $pdo->exec("CREATE TABLE IF NOT EXISTS partners (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        logo_url LONGTEXT NOT NULL,
        display_order INT DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");

    // Check if table is empty
    $count = $pdo->query("SELECT COUNT(*) FROM partners")->fetchColumn();
    if ($count == 0) {
        $stmt = $pdo->prepare("INSERT INTO partners (name, logo_url, display_order) VALUES (?, ?, ?)");
        $stmt->execute(['SecurePay Africa', 'https://images.unsplash.com/photo-1614741118887-7a4ee193a5fa?w=200&h=80&fit=crop&q=80&auto=format', 1]);
        $stmt->execute(['Vanguard Systems', 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=200&h=80&fit=crop&q=80&auto=format', 2]);
        $stmt->execute(['CloudScale Hosting', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&h=80&fit=crop&q=80&auto=format', 3]);
        $stmt->execute(['Aero Logistics', 'https://images.unsplash.com/photo-1508873535684-277a3cbcc4e8?w=200&h=80&fit=crop&q=80&auto=format', 4]);
        $stmt->execute(['Apex Tech', 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=200&h=80&fit=crop&q=80&auto=format', 5]);
    }

    $stmt = $pdo->prepare("SELECT * FROM partners WHERE is_active = TRUE ORDER BY display_order ASC, created_at ASC");
    $stmt->execute();
    $partners = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['success' => true, 'data' => $partners]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Failed to fetch partners: ' . $e->getMessage()]);
}
