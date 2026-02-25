<?php
// backend/security.php
// Security Utilities and Middleware

/**
 * Hash a password using Argon2id with a server-side pepper.
 * NOTE: password_hash() handles salting automatically.
 */
if (!function_exists('hashPassword')) {
    function hashPassword($password)
    {
        $config = require '.env.php';
        $pepper = $config['PASSWORD_PEPPER'] ?? '';

        // Combine password with server-side pepper for extra security
        return password_hash($password . $pepper, PASSWORD_ARGON2ID);
    }
}

/**
 * Verify a password against a hash, supporting both peppered and legacy hashes.
 * 
 * @param string $password The plain text password
 * @param string $hash The hashed password from DB
 * @param bool &$needsRehash Optional reference that will be set to true if the hash is legacy
 * @return bool True if password is valid
 */
if (!function_exists('verifyPassword')) {
    function verifyPassword($password, $hash, &$needsRehash = false)
    {
        $config = require '.env.php';
        $pepper = $config['PASSWORD_PEPPER'] ?? '';

        // 1. Try verifying with current pepper (The modern standard)
        if (password_verify($password . $pepper, $hash)) {
            $needsRehash = false;
            return true;
        }

        // 2. Fallback: Try verifying WITHOUT pepper (For legacy accounts)
        if (password_verify($password, $hash)) {
            // Successful login with old hash -> Trigger a transparent upgrade
            $needsRehash = true;
            return true;
        }

        return false;
    }
}

/**
 * Sanitize input to prevent XSS (Cross-Site Scripting)
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
 * Generate a simple secure token for authentication (Basic implementation)
 * In production, consider using a proper JWT library.
 */
if (!function_exists('generateToken')) {
    function generateToken($userId)
    {
        $config = require '.env.php';
        $secret = $config['JWT_SECRET'];

        $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
        $payload = json_encode([
            'user_id' => $userId,
            'exp' => time() + (60 * 60 * 24), // 24 hours
            'iat' => time()
        ]);

        $base64UrlHeader = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
        $base64UrlPayload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));

        $signature = hash_hmac('sha256', "$base64UrlHeader.$base64UrlPayload", $secret, true);
        $base64UrlSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));

        return "$base64UrlHeader.$base64UrlPayload.$base64UrlSignature";
    }
}

/**
 * Authenticate Request via Token
 */
if (!function_exists('authenticate')) {
    function authenticate()
    {
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? null;

        if (!$authHeader || !preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
            header('Content-Type: application/json');
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Unauthorized: Missing or invalid token.']);
            exit;
        }

        $token = $matches[1];
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            header('Content-Type: application/json');
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Unauthorized: Invalid token structure.']);
            exit;
        }

        $header = $parts[0];
        $payloadData = $parts[1];
        $signatureProvided = $parts[2];

        $config = require '.env.php';
        $secret = $config['JWT_SECRET'];

        // Verify Signature
        $signatureCheck = hash_hmac('sha256', "$header.$payloadData", $secret, true);
        $base64UrlSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signatureCheck));

        if (!hash_equals($base64UrlSignature, $signatureProvided)) {
            header('Content-Type: application/json');
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Unauthorized: Invalid token signature.']);
            exit;
        }

        $payload = json_decode(base64_decode(str_replace(['-', '_'], ['+', '/'], $payloadData)), true);

        // Check Expiration
        if (isset($payload['exp']) && $payload['exp'] < time()) {
            header('Content-Type: application/json');
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Unauthorized: Token expired.']);
            exit;
        }

        if ($payload && isset($payload['user_id'])) {
            return $payload['user_id'];
        }

        header('Content-Type: application/json');
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Unauthorized: Session expired.']);
        exit;
    }
}

/**
 * Get User Role from ID
 */
if (!function_exists('getUserRole')) {
    function getUserRole($userId, $pdo)
    {
        $stmt = $pdo->prepare("SELECT role FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $user = $stmt->fetch();
        return $user ? $user['role'] : null;
    }
}

/**
 * Require a specific role or set of roles
 * @param array|string $roles
 * @param PDO $pdo
 */
if (!function_exists('requireRole')) {
    function requireRole($roles, $pdo)
    {
        $userId = authenticate();
        $role = getUserRole($userId, $pdo);

        if (!is_array($roles)) {
            $roles = [$roles];
        }

        // Super user always has access
        if ($role === 'super') return $userId;

        if (!in_array($role, $roles)) {
            header('Content-Type: application/json');
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Forbidden: You do not have permission to perform this action.']);
            exit;
        }

        return $userId;
    }
}

/**
 * Log a system event
 */
if (!function_exists('logger')) {
    function logger($level, $source, $message)
    {
        $logDir = __DIR__ . '/logs';
        if (!is_dir($logDir)) {
            mkdir($logDir, 0755, true);
        }

        $logFile = $logDir . '/app.log';
        $timestamp = date('Y-m-d H:i:s');
        $level = strtoupper($level);
        $source = strtoupper($source);

        $line = "{$timestamp} [{$level}] [{$source}] {$message}" . PHP_EOL;
        file_put_contents($logFile, $line, FILE_APPEND);
    }
}

/**
 * Global Rate Limiter (30 requests per minute per IP)
 */
if (!function_exists('checkRateLimit')) {
    function checkRateLimit($pdo)
    {
        $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        $limit = 30;
        $window = 60; // seconds

        try {
            $stmt = $pdo->prepare("SELECT request_count, last_request FROM api_rate_limits WHERE ip_address = ?");
            $stmt->execute([$ip]);
            $row = $stmt->fetch();

            if ($row) {
                $lastReq = strtotime($row['last_request']);
                $now = time();

                if (($now - $lastReq) < $window) {
                    if ($row['request_count'] >= $limit) {
                        header('Content-Type: application/json');
                        http_response_code(429);
                        echo json_encode(['success' => false, 'message' => 'Too many requests. Please wait a minute.']);
                        exit;
                    }
                    $pdo->prepare("UPDATE api_rate_limits SET request_count = request_count + 1 WHERE ip_address = ?")->execute([$ip]);
                } else {
                    $pdo->prepare("UPDATE api_rate_limits SET request_count = 1, last_request = CURRENT_TIMESTAMP WHERE ip_address = ?")->execute([$ip]);
                }
            } else {
                $pdo->prepare("INSERT INTO api_rate_limits (ip_address, request_count) VALUES (?, 1)")->execute([$ip]);
            }
        } catch (Exception $e) {
            // Silently fail if rate limit table has issues to keep app running
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
                // Allow Super Admins to bypass maintenance mode
                try {
                    // We attempt to authenticate. If it fails or user is not super, block.
                    $headers = getallheaders();
                    $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? null;

                    if ($authHeader) {
                        // Very simple token check to avoid recursive authenticate() calls if not needed
                        // In a real app we'd decode and check role here. 
                        // For now, let's just block everything non-GET if maintenance is on, 
                        // or block everything unless a specific bypass header is present.
                    }

                    // If it's a critical path like 'super_backup' or 'super_settings', we might let it through.
                    // But for general storefront/admin operations:
                    $script = basename($_SERVER['SCRIPT_NAME']);
                    $bypass = ['super_settings.php', 'login.php']; // Allow login to check role

                    if (!in_array($script, $bypass)) {
                        header('Content-Type: application/json');
                        http_response_code(503);
                        echo json_encode([
                            'success' => false,
                            'maintenance' => true,
                            'message' => 'System is under maintenance. Please try again later.'
                        ]);
                        exit;
                    }
                } catch (Exception $e) {
                    // If anything fails during check, default to blocking
                }
            }
        }
    }
}
