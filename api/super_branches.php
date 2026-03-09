<?php
// backend/super_branches.php
require_once 'db.php';

require_once 'security.php';
requireRole('super', $pdo);

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $stmt = $pdo->query("SELECT * FROM store_branches ORDER BY name ASC");
        $branches = $stmt->fetchAll();

        // Inject simulated load metrics for the UI
        foreach ($branches as &$branch) {
            $branch['load'] = rand(10, 85);
            $branch['capacity'] = 100;
            $branch['uptime'] = '99.' . rand(1, 9) . '%';
        }

        echo json_encode(['success' => true, 'data' => $branches]);
    } catch (PDOException $e) {
        error_log("Super Branches GET error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to fetch branches.']);
    }
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $rawData = file_get_contents('php://input');
    $data = json_decode($rawData, true);

    $name = $data['name'] ?? '';
    $branchCode = $data['branch_code'] ?? null;
    $address = $data['address'] ?? null;
    $region = $data['region'] ?? null;
    $status = $data['status'] ?? 'Standby';
    $lat = $data['lat'] ?? null;
    $lon = $data['lon'] ?? null;

    if (empty($name)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Branch name is required.']);
        exit;
    }

    try {
        $stmt = $pdo->prepare("INSERT INTO store_branches (name, branch_code, address, region, status, lat, lon) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$name, $branchCode, $address, $region, $status, $lat, $lon]);
        $newId = $pdo->lastInsertId();

        // Log action
        if (function_exists('logger')) {
            logger('info', 'BRANCH', "Super Admin added new branch: $name");
        }

        echo json_encode([
            'success' => true,
            'message' => 'Branch added successfully.',
            'data' => [
                'id' => $newId,
                'name' => $name,
                'branch_code' => $branchCode,
                'region' => $region,
                'status' => $status
            ]
        ]);
    } catch (PDOException $e) {
        // Handle constraint violations (e.g. duplicate branch code)
        if ($e->getCode() == 23000) {
            http_response_code(409);
            echo json_encode(['success' => false, 'message' => 'A branch with this code may already exist.']);
        } else {
            error_log("Super Branches POST error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Failed to add branch.']);
        }
    }
    exit;
}

http_response_code(405);
echo json_encode(['success' => false, 'message' => 'Method Not Allowed']);
