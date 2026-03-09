<?php
// backend/security.php
// Security Utilities and Middleware

// Standardized RBAC Role Groups
if (!defined('RBAC_ADMIN_GROUP')) {
    define('RBAC_ADMIN_GROUP', ['admin', 'branch_admin', 'marketing', 'accountant']);
}
if (!defined('RBAC_SUPER_GROUP')) {
    define('RBAC_SUPER_GROUP', ['super']);
}

/**
 * Hash a password using Argon2id with a server-side pepper.
 */
if (!function_exists('hashPassword')) {
    function hashPassword($password)
    {
        $config = require '.env.php';
        $pepper = $config['PASSWORD_PEPPER'] ?? '';
        return password_hash($password . $pepper, PASSWORD_ARGON2ID);
    }
}

/**
 * Verify a password against a hash.
 */
if (!function_exists('verifyPassword')) {
    function verifyPassword($password, $hash, &$needsRehash = false)
    {
        $config = require '.env.php';
        $pepper = $config['PASSWORD_PEPPER'] ?? '';
        if (password_verify($password . $pepper, $hash)) {
            $needsRehash = false;
            return true;
        }
        if (password_verify($password, $hash)) {
            $needsRehash = true;
            return true;
        }
        return false;
    }
}

/**
 * Sanitize input to prevent XSS
 */
if (!function_exists('sanitizeInput')) {
    function sanitizeInput($data)
    {
        if (is_array($data)) {
            return array_map('sanitizeInput', $data);
        }
        return htmlspecialchars(trim($data), ENT_QUOTES, 'UTF-8');
    }
}

/**
 * Validate Email Format
 */
if (!function_exists('isValidEmail')) {
    function isValidEmail($email)
    {
        return filter_var($email, FILTER_VALIDATE_EMAIL);
    }
}

/**
 * AES-256-CBC Encryption
 */
if (!function_exists('encryptData')) {
    function encryptData($plaintext)
    {
        $config = require '.env.php';
        $key = $config['DATA_ENCRYPTION_KEY'] ?? '';
        if (!$key) return $plaintext;
        $iv = openssl_random_pseudo_bytes(16);
        $ciphertext = openssl_encrypt($plaintext, 'AES-256-CBC', substr(hash('sha256', $key, true), 0, 32), OPENSSL_RAW_DATA, $iv);
        return base64_encode($iv . $ciphertext);
    }
}

if (!function_exists('decryptData')) {
    function decryptData($ciphertext)
    {
        $config = require '.env.php';
        $key = $config['DATA_ENCRYPTION_KEY'] ?? '';
        if (!$key) return $ciphertext;
        $data = base64_decode($ciphertext);
        if ($data === false || strlen($data) < 16) return '';
        $iv = substr($data, 0, 16);
        $raw = substr($data, 16);
        $plaintext = openssl_decrypt($raw, 'AES-256-CBC', substr(hash('sha256', $key, true), 0, 32), OPENSSL_RAW_DATA, $iv);
        return $plaintext === false ? '' : $plaintext;
    }
}

/**
 * Generate JWT Token
 */
if (!function_exists('generateToken')) {
    function generateToken($userId)
    {
        $config = require '.env.php';
        $secret = $config['JWT_SECRET'];
        $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
        $payload = json_encode(['user_id' => $userId, 'exp' => time() + (60 * 60 * 24), 'iat' => time()]);
        $b64Header = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
        $b64Payload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));
        $sig = hash_hmac('sha256', "$b64Header.$b64Payload", $secret, true);
        $b64Sig = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($sig));
        return "$b64Header.$b64Payload.$b64Sig";
    }
}

/**
 * Authenticate Request
 */
if (!function_exists('authenticate')) {
    function authenticate()
    {
        $token = $_COOKIE['ehub_session'] ?? null;

        if (!$token) {
            $headers = getallheaders();
            $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? null;
            if ($authHeader && preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
                $token = $matches[1];
            }
        }

        if (!$token) {
            header('Content-Type: application/json');
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Unauthorized: Missing or invalid token.']);
            exit;
        }

        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            header('Content-Type: application/json');
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Unauthorized: Invalid token.']);
            exit;
        }
        $payload = json_decode(base64_decode(str_replace(['-', '_'], ['+', '/'], $parts[1])), true);
        if (isset($payload['exp']) && $payload['exp'] < time()) {
            header('Content-Type: application/json');
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Unauthorized: Token expired.']);
            exit;
        }
        return $payload['user_id'] ?? null;
    }
}

/**
 * Get User Role
 */
if (!function_exists('getUserRole')) {
    function getUserRole($userId, $pdo)
    {
        $stmt = $pdo->prepare("SELECT role FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $row = $stmt->fetch();
        return $row ? $row['role'] : null;
    }
}

/**
 * Get User Name
 */
if (!function_exists('getUserName')) {
    function getUserName($userId, $pdo)
    {
        $stmt = $pdo->prepare("SELECT name FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $row = $stmt->fetch();
        return $row ? $row['name'] : 'System';
    }
}


/**
 * Check if Super Admin (non-blocking)
 */
if (!function_exists('isSuperAdmin')) {
    function isSuperAdmin($pdo)
    {
        $token = $_COOKIE['ehub_session'] ?? null;

        if (!$token) {
            $headers = getallheaders();
            $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? null;
            if ($authHeader && preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
                $token = $matches[1];
            }
        }

        if (!$token) return false;

        $parts = explode('.', $token);
        if (count($parts) !== 3) return false;
        $payload = json_decode(base64_decode(str_replace(['-', '_'], ['+', '/'], $parts[1])), true);
        if (!$payload || !isset($payload['user_id'])) return false;
        if (isset($payload['exp']) && $payload['exp'] < time()) return false;
        return getUserRole($payload['user_id'], $pdo) === 'super';
    }
}

/**
 * Require Role
 */
if (!function_exists('requireRole')) {
    function requireRole($roles, $pdo)
    {
        $userId = authenticate();
        $role = getUserRole($userId, $pdo);
        if (!is_array($roles)) $roles = [$roles];
        if ($role === 'super' || in_array($role, $roles)) return $userId;
        header('Content-Type: application/json');
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Forbidden.']);
        exit;
    }
}

/**
 * Logger
 */
if (!function_exists('logger')) {
    function logger($level, $source, $message)
    {
        $logDir = __DIR__ . '/logs';
        if (!is_dir($logDir)) mkdir($logDir, 0755, true);
        $line = date('Y-m-d H:i:s') . " [" . strtoupper($level) . "] [" . strtoupper($source) . "] $message" . PHP_EOL;
        file_put_contents($logDir . '/app.log', $line, FILE_APPEND);
    }
}

/**
 * Rate Limiter
 */
if (!function_exists('checkRateLimit')) {
    function checkRateLimit($pdo)
    {
        $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        try {
            $stmt = $pdo->prepare("SELECT request_count, last_request FROM api_rate_limits WHERE ip_address = ?");
            $stmt->execute([$ip]);
            $row = $stmt->fetch();
            if ($row && (time() - strtotime($row['last_request']) < 60)) {
                if ($row['request_count'] >= 300) {
                    header('Content-Type: application/json');
                    http_response_code(429);
                    echo json_encode(['success' => false, 'message' => 'Too many requests. Please wait a minute.']);
                    exit;
                }
                $pdo->prepare("UPDATE api_rate_limits SET request_count = request_count + 1 WHERE ip_address = ?")->execute([$ip]);
            } else {
                $pdo->prepare("INSERT INTO api_rate_limits (ip_address, request_count) VALUES (?, 1) ON DUPLICATE KEY UPDATE request_count = 1, last_request = CURRENT_TIMESTAMP")->execute([$ip]);
            }
        } catch (Exception $e) {
        }
    }
}

/**
 * Maintenance Mode Check
 */
if (!function_exists('checkMaintenanceMode')) {
    function checkMaintenanceMode($pdo)
    {
        $settingsFile = __DIR__ . '/data/super_settings.json';
        if (file_exists($settingsFile)) {
            $settings = json_decode(file_get_contents($settingsFile), true);
            if (isset($settings['maintenanceMode']) && $settings['maintenanceMode'] === true) {
                if (isSuperAdmin($pdo)) return;
                $script = basename($_SERVER['SCRIPT_NAME']);
                if (in_array($script, ['super_settings.php', 'login.php'])) return;
                header('Content-Type: application/json');
                http_response_code(503);
                echo json_encode(['success' => false, 'maintenance' => true, 'message' => 'Under maintenance.']);
                exit;
            }
        }
    }
}

/**
 * Debug Mode Status
 */
if (!function_exists('isDebugEnabled')) {
    function isDebugEnabled()
    {
        $settingsFile = __DIR__ . '/data/super_settings.json';
        if (file_exists($settingsFile)) {
            $settings = json_decode(file_get_contents($settingsFile), true);
            return isset($settings['debugMode']) && $settings['debugMode'] === true;
        }
        return false;
    }
}
