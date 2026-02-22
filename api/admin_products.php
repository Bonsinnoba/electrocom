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

// Self-healing: Ensure table and columns exist
try {
    $pdo->exec("CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        category VARCHAR(100),
        image_url VARCHAR(255),
        stock_quantity INT DEFAULT 0,
        colors JSON,
        specs JSON,
        included JSON,
        directions TEXT,
        product_code VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");

    $columns = $pdo->query("DESCRIBE products")->fetchAll(PDO::FETCH_COLUMN);
    if (!in_array('directions', $columns)) {
        $pdo->exec("ALTER TABLE products ADD COLUMN directions TEXT AFTER included");
    }
    if (!in_array('included', $columns)) {
        $pdo->exec("ALTER TABLE products ADD COLUMN included JSON AFTER specs");
    }
    if (!in_array('rating', $columns)) {
        $pdo->exec("ALTER TABLE products ADD COLUMN rating DECIMAL(2, 1) DEFAULT 0.0 AFTER directions");
    }
    if (!in_array('gallery', $columns)) {
        $pdo->exec("ALTER TABLE products ADD COLUMN gallery JSON AFTER rating");
    }
    if (!in_array('product_code', $columns)) {
        $pdo->exec("ALTER TABLE products ADD COLUMN product_code VARCHAR(100) AFTER directions");
    }

    // Performance Indexing
    $indexes = $pdo->query("SHOW INDEX FROM products")->fetchAll(PDO::FETCH_ASSOC);
    $hasCategoryIndex = false;
    foreach ($indexes as $index) {
        if ($index['Key_name'] === 'idx_product_category') {
            $hasCategoryIndex = true;
            break;
        }
    }
    if (!$hasCategoryIndex) {
        $pdo->exec("CREATE INDEX idx_product_category ON products(category)");
    }

    // Patch for products with 0.0 rating (seed data fix)
    $pdo->exec("UPDATE products SET rating = 4.5 WHERE rating = 0.0 OR rating IS NULL");
} catch (Exception $e) {
    error_log("Database schema check failed: " . $e->getMessage());
}

$method = $_SERVER['REQUEST_METHOD'];

/**
 * Helper to save base64 string as a file safely
 */
function saveBase64File($base64String, $allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
{
    if (!$base64String || strpos($base64String, 'data:') === false) {
        return $base64String;
    }

    $dir = 'uploads/';
    if (!file_exists($dir)) {
        mkdir($dir, 0755, true);
    }

    $parts = explode(',', $base64String);
    if (count($parts) < 2) return $base64String;

    $data = base64_decode($parts[1]);
    if (!$data) return $base64String;

    // SECURITY: Use finfo to verify actual content type
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mimeType = $finfo->buffer($data);

    if (!in_array($mimeType, $allowedTypes)) {
        return $base64String; // Refuse non-allowed types
    }

    $mimeMap = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
        'application/pdf' => 'pdf'
    ];

    $ext = $mimeMap[$mimeType] ?? 'bin';
    $filename = 'file_' . bin2hex(random_bytes(8)) . '.' . $ext;
    $filepath = $dir . $filename;

    if (file_put_contents($filepath, $data)) {
        // Return relative path to be handled by the frontend
        return $filepath;
    }

    return $base64String;
}

if ($method === 'POST') {
    $content = trim(file_get_contents("php://input"));
    $decoded = json_decode($content, true);

    if (!is_array($decoded)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid JSON payload']);
        exit;
    }

    $action = $decoded['action'] ?? '';

    if ($action === 'create') {
        $name = sanitizeInput($decoded['name'] ?? '');
        $category = sanitizeInput($decoded['category'] ?? '');
        $price = max(0, (float)($decoded['price'] ?? 0));
        $stock = max(0, (int)($decoded['stock'] ?? 0));
        $rating = (float)($decoded['rating'] ?? 0.0);
        $description = sanitizeInput($decoded['description'] ?? '');
        $image_data = $decoded['image'] ?? '';
        $colors = $decoded['colors'] ?? '[]';
        $specs = $decoded['specs'] ?? '{}';
        $included = $decoded['included'] ?? '[]';
        $directions = $decoded['directions'] ?? '';
        $product_code = sanitizeInput($decoded['product_code'] ?? '');
        $gallery_input = $decoded['gallery'] ?? [];

        $image_url = saveBase64File($image_data, ['image/jpeg', 'image/png', 'image/webp']);
        $directions_url = saveBase64File($directions, ['application/pdf']);

        $gallery_urls = [];
        if (is_array($gallery_input)) {
            foreach ($gallery_input as $img) {
                if ($img) $gallery_urls[] = saveBase64File($img, ['image/jpeg', 'image/png', 'image/webp']);
            }
        }
        $gallery_json = json_encode($gallery_urls);

        if (!$name || !$category) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Missing required fields']);
            exit;
        }

        try {
            $stmt = $pdo->prepare("INSERT INTO products (name, category, price, stock_quantity, rating, description, image_url, gallery, colors, specs, included, directions, product_code) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([$name, $category, $price, $stock, $rating, $description, $image_url, $gallery_json, $colors, $specs, $included, $directions_url, $product_code]);
            $productId = $pdo->lastInsertId();

            echo json_encode(['success' => true, 'id' => $productId, 'image_url' => $image_url]);
        } catch (PDOException $e) {
            error_log("Product creation failed: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Failed to create product. Check server logs.']);
        }
    } elseif ($action === 'update') {
        $id = (int)($decoded['id'] ?? 0);
        $name = sanitizeInput($decoded['name'] ?? '');
        $category = sanitizeInput($decoded['category'] ?? '');
        $price = max(0, (float)($decoded['price'] ?? 0));
        $stock = max(0, (int)($decoded['stock'] ?? 0));
        $rating = (float)($decoded['rating'] ?? 0.0);
        $description = sanitizeInput($decoded['description'] ?? '');
        $image_data = $decoded['image'] ?? '';
        $colors = $decoded['colors'] ?? '[]';
        $specs = $decoded['specs'] ?? '{}';
        $included = $decoded['included'] ?? '[]';
        $directions = $decoded['directions'] ?? '';
        $product_code = sanitizeInput($decoded['product_code'] ?? '');
        $gallery_input = $decoded['gallery'] ?? [];

        $image_url = saveBase64File($image_data, ['image/jpeg', 'image/png', 'image/webp']);
        $directions_url = saveBase64File($directions, ['application/pdf']);

        $gallery_urls = [];
        if (is_array($gallery_input)) {
            foreach ($gallery_input as $img) {
                if ($img) $gallery_urls[] = saveBase64File($img, ['image/jpeg', 'image/png', 'image/webp']);
            }
        }
        $gallery_json = json_encode($gallery_urls);

        if (!$id) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Product ID is required']);
            exit;
        }

        try {
            $stmt = $pdo->prepare("UPDATE products SET name = ?, category = ?, price = ?, stock_quantity = ?, rating = ?, description = ?, image_url = ?, gallery = ?, colors = ?, specs = ?, included = ?, directions = ?, product_code = ? WHERE id = ?");
            $stmt->execute([$name, $category, $price, $stock, $rating, $description, $image_url, $gallery_json, $colors, $specs, $included, $directions_url, $product_code, $id]);

            echo json_encode(['success' => true, 'image_url' => $image_url]);
        } catch (PDOException $e) {
            error_log("Product update failed: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Failed to update product.']);
        }
    } elseif ($action === 'delete') {
        $id = (int)($decoded['id'] ?? 0);

        if (!$id) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Product ID is required']);
            exit;
        }

        try {
            $stmt = $pdo->prepare("DELETE FROM products WHERE id = ?");
            $stmt->execute([$id]);

            echo json_encode(['success' => true]);
        } catch (PDOException $e) {
            error_log("Product deletion failed: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Failed to delete product.']);
        }
    } else {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid action']);
    }
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
}
