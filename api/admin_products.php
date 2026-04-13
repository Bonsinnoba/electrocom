<?php
require_once 'db.php';
require_once 'notifications.php';

header('Content-Type: application/json');

// Authenticate and Require Roles
try {
    // Branch branching logic removed: Only high-tier staff can mutate products globally.
    $userId = requireRole(['super', 'admin', 'store_manager'], $pdo);
    $userName = getUserName($userId, $pdo);
} catch (Exception $e) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized: Authentication failed']);
    exit;
}

// Self-healing: Ensure table and columns exist
if ($config['DB_AUTO_REPAIR'] ?? false) {
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
            location VARCHAR(255),
            aisle VARCHAR(50),
            rack VARCHAR(50),
            bin VARCHAR(50),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )");

        $columns = $pdo->query("DESCRIBE products")->fetchAll(PDO::FETCH_COLUMN);
        
        // Ensure new shelving columns exist
        $shelving = ['aisle', 'rack', 'bin'];
        foreach ($shelving as $col) {
            if (!in_array($col, $columns)) {
                $pdo->exec("ALTER TABLE products ADD COLUMN $col VARCHAR(50) AFTER location");
            }
        }

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
        if (!in_array('location', $columns)) {
            $pdo->exec("ALTER TABLE products ADD COLUMN location VARCHAR(255) AFTER product_code");
        }
        if (!in_array('discount_percent', $columns)) {
            $pdo->exec("ALTER TABLE products ADD COLUMN discount_percent INT DEFAULT 0 AFTER price");
        }
        if (!in_array('sale_ends_at', $columns)) {
            $pdo->exec("ALTER TABLE products ADD COLUMN sale_ends_at DATETIME DEFAULT NULL AFTER discount_percent");
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
    } catch (Exception $e) {
        error_log("Database schema check failed: " . $e->getMessage());
    }
}

$method = $_SERVER['REQUEST_METHOD'];

/**
 * Helper to save base64 string as a file safely
 */
function saveBase64File($base64String, $allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
{
    if (!$base64String) {
        return $base64String;
    }

    if (strpos($base64String, 'data:') === false) {
        return normalizeLocalPath($base64String);
    }

    $dir = 'uploads/';
    if (!file_exists($dir)) {
        mkdir($dir, 0755, true);
    }

    $parts = explode(',', $base64String);
    if (count($parts) < 2) return $base64String;

    $data = base64_decode($parts[1]);
    if (!$data) return $base64String;

    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mimeType = $finfo->buffer($data);

    if (!in_array($mimeType, $allowedTypes)) {
        return $base64String;
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
    
    $name = sanitizeInput($decoded['name'] ?? '');
    $category = sanitizeInput($decoded['category'] ?? '');
    if (empty($category)) $category = 'Gadgets';
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
    $location = sanitizeInput($decoded['location'] ?? '');
    $aisle = sanitizeInput($decoded['aisle'] ?? '');
    $rack = sanitizeInput($decoded['rack'] ?? '');
    $bin = sanitizeInput($decoded['bin'] ?? '');
    $gallery_input = $decoded['gallery'] ?? [];
    $variants = $decoded['variants'] ?? [];
    $discount_percent = max(0, min(100, (int)($decoded['discount_percent'] ?? 0)));
    
    $sale_ends_at = null;
    if (!empty($decoded['sale_ends_at'])) {
        $raw_date = str_replace('T', ' ', sanitizeInput($decoded['sale_ends_at']));
        if (strlen($raw_date) === 16) $raw_date .= ':00';
        $sale_ends_at = $raw_date;
    }

    if ($action === 'create') {
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
            $pdo->beginTransaction();
            $stmt = $pdo->prepare("INSERT INTO products (name, category, price, discount_percent, sale_ends_at, stock_quantity, rating, description, image_url, gallery, colors, specs, included, directions, product_code, location, aisle, rack, bin) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([$name, $category, $price, $discount_percent, $sale_ends_at, $stock, $rating, $description, $image_url, $gallery_json, $colors, $specs, $included, $directions_url, $product_code, $location, $aisle, $rack, $bin]);
            $productId = $pdo->lastInsertId();

            if (is_array($variants)) {
                $varStmt = $pdo->prepare("INSERT INTO product_variants (product_id, sku, attributes, price_modifier, stock_quantity, image_url) VALUES (?, ?, ?, ?, ?, ?)");
                foreach ($variants as $v) {
                    $attr = is_string($v['attributes']) ? $v['attributes'] : json_encode($v['attributes'] ?? []);
                    $varStmt->execute([$productId, sanitizeInput($v['sku'] ?? ''), $attr, (float)($v['price_modifier'] ?? 0), (int)($v['stock_quantity'] ?? 0), sanitizeInput($v['image_url'] ?? '')]);
                }
            }

            $pdo->commit();
            
            if ($stock < 10) {
                $throttleStmt = $pdo->prepare("SELECT id FROM notifications WHERE title = ? AND created_at >= NOW() - INTERVAL 1 DAY LIMIT 1");
                $throttleStmt->execute(["Low Stock Alert: {$name}"]);
                if (!$throttleStmt->fetchColumn()) {
                    $notifService = new NotificationService();
                    $notifService->logAdminNotification("Low Stock Alert: {$name}", "Product '{$name}' is running low (Current: {$stock}).", 'system');
                }
            }

            logger('info', 'PRODUCTS', "New product created: {$name} (ID: {$productId}) by {$userName}");
            logAdminAudit($pdo, $userId, 'product.create', 'product', (string)$productId, [
                'name' => $name,
                'product_code' => $product_code,
                'price' => $price,
                'stock' => $stock,
                'location' => $location,
                'aisle' => $aisle,
                'rack' => $rack,
                'bin' => $bin
            ]);
            echo json_encode(['success' => true, 'id' => $productId, 'image_url' => $image_url]);
        } catch (PDOException $e) {
            if ($pdo->inTransaction()) $pdo->rollBack();
            error_log("Product creation failed: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Failed to create product.']);
        }
    } elseif ($action === 'update') {
        $id = (int)($decoded['id'] ?? 0);
        if (!$id) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Product ID is required']);
            exit;
        }

        $image_url = saveBase64File($image_data, ['image/jpeg', 'image/png', 'image/webp']);
        $directions_url = saveBase64File($directions, ['application/pdf']);

        $gallery_urls = [];
        if (is_array($gallery_input)) {
            foreach ($gallery_input as $img) {
                if ($img) $gallery_urls[] = saveBase64File($img, ['image/jpeg', 'image/png', 'image/webp']);
            }
        }
        $gallery_json = json_encode($gallery_urls);

        try {
            $stmt = $pdo->prepare("SELECT image_url, gallery, directions FROM products WHERE id = ?");
            $stmt->execute([$id]);
            $oldProduct = $stmt->fetch(PDO::FETCH_ASSOC);

            $pdo->beginTransaction();
            $stmt = $pdo->prepare("UPDATE products SET name = ?, category = ?, price = ?, discount_percent = ?, sale_ends_at = ?, stock_quantity = ?, rating = ?, description = ?, image_url = ?, gallery = ?, colors = ?, specs = ?, included = ?, directions = ?, product_code = ?, location = ?, aisle = ?, rack = ?, bin = ? WHERE id = ?");
            $stmt->execute([$name, $category, $price, $discount_percent, $sale_ends_at, $stock, $rating, $description, $image_url, $gallery_json, $colors, $specs, $included, $directions_url, $product_code, $location, $aisle, $rack, $bin, $id]);

            if ($oldProduct) {
                if ($image_url !== $oldProduct['image_url'] && $oldProduct['image_url'] && file_exists($oldProduct['image_url']) && is_file($oldProduct['image_url'])) unlink($oldProduct['image_url']);
                if ($directions_url !== $oldProduct['directions'] && $oldProduct['directions'] && file_exists($oldProduct['directions']) && is_file($oldProduct['directions'])) unlink($oldProduct['directions']);
                
                $oldGallery = json_decode($oldProduct['gallery'] ?? '[]', true);
                $newGallery = json_decode($gallery_json, true);
                if (is_array($oldGallery) && is_array($newGallery)) {
                    foreach ($oldGallery as $oldImg) {
                        if ($oldImg && !in_array($oldImg, $newGallery) && file_exists($oldImg) && is_file($oldImg)) unlink($oldImg);
                    }
                }
            }

            if (is_array($variants)) {
                $pdo->prepare("DELETE FROM product_variants WHERE product_id = ?")->execute([$id]);
                $varStmt = $pdo->prepare("INSERT INTO product_variants (product_id, sku, attributes, price_modifier, stock_quantity, image_url) VALUES (?, ?, ?, ?, ?, ?)");
                foreach ($variants as $v) {
                    $attr = is_string($v['attributes']) ? $v['attributes'] : json_encode($v['attributes'] ?? []);
                    $varStmt->execute([$id, sanitizeInput($v['sku'] ?? ''), $attr, (float)($v['price_modifier'] ?? 0), (int)($v['stock_quantity'] ?? 0), sanitizeInput($v['image_url'] ?? '')]);
                }
            }

            $pdo->commit();
            
            logger('info', 'PRODUCTS', "Product updated (ID: {$id}) by {$userName}");
            logAdminAudit($pdo, $userId, 'product.update', 'product', (string)$id, [
                'name' => $name,
                'product_code' => $product_code,
                'price' => $price,
                'stock' => $stock,
                'location' => $location,
                'aisle' => $aisle,
                'rack' => $rack,
                'bin' => $bin
            ]);
            echo json_encode(['success' => true, 'image_url' => $image_url]);
        } catch (PDOException $e) {
            if ($pdo->inTransaction()) $pdo->rollBack();
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
            $stmt = $pdo->prepare("SELECT image_url, gallery, directions FROM products WHERE id = ?");
            $stmt->execute([$id]);
            $product = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($product) {
                $filesToDelete = [$product['image_url'], $product['directions']];
                $gallery = json_decode($product['gallery'] ?? '[]', true);
                if (is_array($gallery)) $filesToDelete = array_merge($filesToDelete, $gallery);
                foreach ($filesToDelete as $file) {
                    if ($file && file_exists($file) && is_file($file)) unlink($file);
                }
            }

            $pdo->prepare("DELETE FROM products WHERE id = ?")->execute([$id]);
            logger('warn', 'PRODUCTS', "Product deleted (ID: {$id}) by {$userName}");
            logAdminAudit($pdo, $userId, 'product.delete', 'product', (string)$id, []);
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
