<?php
// backend/cms.php
require_once 'db.php';
require_once 'security.php';

header('Content-Type: application/json');

// --- Self-healing Schema ---
if ($config['DB_AUTO_REPAIR'] ?? false) {
    try {
        $pdo->exec("CREATE TABLE IF NOT EXISTS cms_pages (
            id INT AUTO_INCREMENT PRIMARY KEY,
            slug VARCHAR(100) NOT NULL UNIQUE,
            title VARCHAR(255) NOT NULL,
            content LONGTEXT,
            is_published BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )");

        // Ensure default pages exist (Privacy, Terms, About)
        $initialPages = [
            ['privacy-policy', 'Privacy Policy', '<h2>Privacy Policy</h2><p>Your privacy content here.</p>', 1],
            ['terms-of-service', 'Terms of Service', '<h2>Terms of Service</h2><p>Your terms content here.</p>', 1],
            ['about-us', 'About Us', '<h2>About Us</h2><p>Welcome to ElectroCom!</p>', 1],
            ['faq', 'Frequently Asked Questions', '<h2>FAQ</h2><p>Your FAQ content here.</p>', 1]
        ];

        $chk = $pdo->query("SELECT COUNT(*) FROM cms_pages")->fetchColumn();
        if ($chk == 0) {
            $ins = $pdo->prepare("INSERT INTO cms_pages (slug, title, content, is_published) VALUES (?, ?, ?, ?)");
            foreach ($initialPages as $page) {
                $ins->execute($page);
            }
        }
    } catch (Exception $e) {
        error_log("CMS schema self-healing failed: " . $e->getMessage());
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $slug = $_GET['slug'] ?? null;
    $all = $_GET['all'] ?? false;

    // Check if admin
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? '';
    $isAdmin = false;
    if ($authHeader) {
        // We only care if they are admin to show unpublished pages. We don't want to enforce auth
        // if a guest is viewing a published page.
        try {
            $userId = authenticate(false); // Don't die on fail
            if ($userId) {
                $userStmt = $pdo->prepare("SELECT role FROM users WHERE id = ?");
                $userStmt->execute([$userId]);
                $user = $userStmt->fetch(PDO::FETCH_ASSOC);
                if ($user && ($user['role'] === 'admin' || $user['role'] === 'super')) {
                    $isAdmin = true;
                }
            }
        } catch (Exception $e) {
        }
    }

    try {
        if ($slug) {
            $query = "SELECT * FROM cms_pages WHERE slug = ?";
            if (!$isAdmin) {
                $query .= " AND is_published = 1";
            }
            $stmt = $pdo->prepare($query);
            $stmt->execute([$slug]);
            $page = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($page) {
                echo json_encode(['success' => true, 'data' => $page]);
            } else {
                http_response_code(404);
                echo json_encode(['error' => 'Page not found']);
            }
        } else {
            // Get all summary (usually for admin)
            $query = "SELECT id, slug, title, is_published, updated_at FROM cms_pages";
            if (!$isAdmin && !$all) {
                $query .= " WHERE is_published = 1";
            }
            $query .= " ORDER BY title ASC";

            $stmt = $pdo->query($query);
            $pages = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode(['success' => true, 'data' => $pages]);
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to fetch pages']);
    }
    exit;
}

// Write Operations (Require Admin)
$userId = authenticate();
$userStmt = $pdo->prepare("SELECT role FROM users WHERE id = ?");
$userStmt->execute([$userId]);
$user = $userStmt->fetch(PDO::FETCH_ASSOC);

if (!$user || ($user['role'] !== 'admin' && $user['role'] !== 'super')) {
    http_response_code(403);
    echo json_encode(['error' => 'Forbidden: Admins only']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $content = trim(file_get_contents("php://input"));
    $decoded = json_decode($content, true);

    if (!is_array($decoded)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid JSON payload']);
        exit;
    }

    $id = $decoded['id'] ?? null;
    $slug = sanitizeInput($decoded['slug'] ?? '');
    $title = sanitizeInput($decoded['title'] ?? '');
    // IMPORTANT: Allow HTML tags for CMS content, do not heavily sanitize output here, 
    // rely on React dangerouslySetInnerHTML with appropriate trusted sources
    $pageContent = $decoded['content'] ?? '';
    $isPublished = isset($decoded['is_published']) ? (int)$decoded['is_published'] : 0;

    if (empty($slug) || empty($title)) {
        http_response_code(400);
        echo json_encode(['error' => 'Slug and Title are required']);
        exit;
    }

    try {
        if ($id) {
            // Update
            $stmt = $pdo->prepare("UPDATE cms_pages SET slug=?, title=?, content=?, is_published=? WHERE id=?");
            $stmt->execute([$slug, $title, $pageContent, $isPublished, $id]);
            logger('info', 'CMS', "Updated page: $title");
            echo json_encode(['success' => true, 'message' => 'Page updated']);
        } else {
            // Insert
            $stmt = $pdo->prepare("INSERT INTO cms_pages (slug, title, content, is_published) VALUES (?, ?, ?, ?)");
            $stmt->execute([$slug, $title, $pageContent, $isPublished]);
            logger('ok', 'CMS', "Created new page: $title");
            echo json_encode(['success' => true, 'message' => 'Page created']);
        }
    } catch (PDOException $e) {
        if ($e->getCode() == 23000) { // Duplicate entry
            http_response_code(409);
            echo json_encode(['error' => 'A page with this slug already exists']);
        } else {
            error_log("CMS Error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Database error', 'details' => $e->getMessage()]);
        }
    }
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $id = $_GET['id'] ?? null;
    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'Page ID required']);
        exit;
    }

    try {
        $pdo->prepare("DELETE FROM cms_pages WHERE id = ?")->execute([$id]);
        logger('warning', 'CMS', "Deleted page ID: $id");
        echo json_encode(['success' => true]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to delete page']);
    }
    exit;
}
