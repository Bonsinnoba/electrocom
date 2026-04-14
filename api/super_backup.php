<?php
// api/super_backup.php
require 'db.php';
require 'security.php';
require_once __DIR__ . '/brand_settings.php';

header('Content-Type: application/json');

try {
    // 1. Authenticate Super User
    $userId = requireRole('super', $pdo);
    $userName = getUserName($userId, $pdo);

    $method = $_SERVER['REQUEST_METHOD'];

    // Ensure backups directory exists
    $backupDir = __DIR__ . '/backups';
    if (!is_dir($backupDir)) {
        mkdir($backupDir, 0755, true);
    }

    if ($method === 'GET') {
        $action = $_GET['action'] ?? 'list';

        if ($action === 'list') {
            $files = glob($backupDir . '/*.sql');
            $backups = [];
            foreach ($files as $file) {
                $backups[] = [
                    'name' => basename($file),
                    'size' => filesize($file),
                    'date' => date('Y-m-d H:i:s', filemtime($file))
                ];
            }
            usort($backups, function ($a, $b) {
                return strtotime($b['date']) - strtotime($a['date']);
            });
            echo json_encode(['success' => true, 'backups' => $backups]);
        } elseif ($action === 'download') {
            $filename = $_GET['file'] ?? '';
            $filepath = $backupDir . '/' . basename($filename);

            if ($filename && file_exists($filepath)) {
                header('Content-Description: File Transfer');
                header('Content-Type: application/octet-stream');
                header('Content-Disposition: attachment; filename="' . basename($filepath) . '"');
                header('Expires: 0');
                header('Cache-Control: must-revalidate');
                header('Pragma: public');
                header('Content-Length: ' . filesize($filepath));
                readfile($filepath);
                exit;
            } else {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'File not found.']);
            }
        }
    } elseif ($method === 'POST') {
        $data = json_decode(file_get_contents("php://input"), true);
        $action = $data['action'] ?? '';

        if ($action === 'create') {
            // PHP-based backup (Dump Tables to SQL)
            $tables = [];
            $result = $pdo->query("SHOW TABLES");
            while ($row = $result->fetch(PDO::FETCH_NUM)) {
                $tables[] = $row[0];
            }

            $sqlDump = '-- ' . eh_brand_site_name() . " Database Backup\n";
            $sqlDump .= "-- Date: " . date('Y-m-d H:i:s') . "\n\n";
            $sqlDump .= "SET FOREIGN_KEY_CHECKS = 0;\n\n";

            foreach ($tables as $table) {
                // Drop table if exists
                $sqlDump .= "DROP TABLE IF EXISTS `$table`;\n";

                // Create table
                $res = $pdo->query("SHOW CREATE TABLE `$table`")->fetch(PDO::FETCH_NUM);
                $sqlDump .= $res[1] . ";\n\n";

                // Data
                $res = $pdo->query("SELECT * FROM `$table`")->fetchAll(PDO::FETCH_ASSOC);
                foreach ($res as $row) {
                    $keys = array_keys($row);
                    $values = array_values($row);
                    $escapedValues = array_map(function ($v) use ($pdo) {
                        if ($v === null) return 'NULL';
                        return $pdo->quote($v);
                    }, $values);

                    $sqlDump .= "INSERT INTO `$table` (`" . implode("`, `", $keys) . "`) VALUES (" . implode(", ", $escapedValues) . ");\n";
                }
                $sqlDump .= "\n";
            }

            $sqlDump .= "SET FOREIGN_KEY_CHECKS = 1;\n";

            $filename = 'backup_' . date('Ymd_His') . '.sql';
            $filepath = $backupDir . '/' . $filename;

            if (file_put_contents($filepath, $sqlDump)) {
                logger('success', 'SYSTEM', "Database backup created: {$filename} by {$userName}");
                echo json_encode(['success' => true, 'message' => "Backup '$filename' created successfully.", 'file' => $filename]);
            } else {
                throw new Exception("Failed to write backup file.");
            }
        } elseif ($action === 'delete') {
            $filename = $data['file'] ?? '';
            $filepath = $backupDir . '/' . basename($filename);

            if ($filename && file_exists($filepath)) {
                unlink($filepath);
                logger('warn', 'SYSTEM', "Database backup deleted: $filename by $userName");
                echo json_encode(['success' => true, 'message' => "Backup deleted."]);
            } else {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'File not found.']);
            }
        }
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Backup error: ' . $e->getMessage()]);
}
