<?php
// backend/security.php
// Security Utilities and Middleware

// Standardized RBAC Role Groups
if (!defined('RBAC_ADMIN_GROUP')) {
    define('RBAC_ADMIN_GROUP', ['admin', 'store_manager', 'marketing', 'accountant', 'picker']);
}
if (!defined('RBAC_STAFF_GROUP')) {
    define('RBAC_STAFF_GROUP', ['pos_cashier', 'store_manager', 'picker']);
}
if (!defined('RBAC_SUPER_GROUP')) {
    define('RBAC_SUPER_GROUP', ['super']);
}
if (!defined('RBAC_ALL_ADMINS')) {
    define('RBAC_ALL_ADMINS', array_merge(RBAC_ADMIN_GROUP, RBAC_SUPER_GROUP));
}

/**
 * Hash a password using Argon2id with a server-side pepper.
 */
if (!function_exists('hashPassword')) {
    function hashPassword($password)
    {
        $config = $GLOBALS['config'] ?? require_once 'config.php';
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
        $config = $GLOBALS['config'] ?? require_once 'config.php';
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
        if ($data === null) return null;
        if (is_array($data)) {
            return array_map('sanitizeInput', $data);
        }
        return htmlspecialchars(trim((string)$data), ENT_QUOTES, 'UTF-8');
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
        $config = $GLOBALS['config'] ?? require_once 'config.php';
        $key = $config['DATA_ENCRYPTION_KEY'] ?? '';
        if (!$key) return $plaintext;
        $iv = openssl_random_pseudo_bytes(16);
        $ciphertext = openssl_encrypt($plaintext, 'AES-256-CBC', substr(hash('sha256', $key, true), 0, 32), OPENSSL_RAW_DATA, $iv);
        return base64_encode($iv . $ciphertext);
    }
}

/**
 * Helper to get user IP with proxy support
 */
if (!function_exists('getClientIP')) {
    function getClientIP()
    {
        if (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
            return trim(explode(',', $_SERVER['HTTP_X_FORWARDED_FOR'])[0]);
        }
        return $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    }
}

if (!function_exists('decryptData')) {
    function decryptData($ciphertext)
    {
        $config = $GLOBALS['config'] ?? require_once 'config.php';
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
        $config = $GLOBALS['config'] ?? require_once 'config.php';
        $secret = $config['JWT_SECRET'];
        $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
        $payload = json_encode([
            'user_id' => $userId, 
            'exp' => time() + (60 * 60 * 24), 
            'iat' => time(),
            'ip'  => getClientIP()
        ]);
        $b64Header = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
        $b64Payload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));
        $sig = hash_hmac('sha256', "$b64Header.$b64Payload", $secret, true);
        $b64Sig = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($sig));
        return "$b64Header.$b64Payload.$b64Sig";
    }
}

/**
 * Polyfill for getallheaders() if missing (common in php -S or FastCGI)
 */
if (!function_exists('getallheaders')) {
    function getallheaders() {
        $headers = [];
        foreach ($_SERVER as $name => $value) {
            if (substr($name, 0, 5) == 'HTTP_') {
                $headers[str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($name, 5)))))] = $value;
            }
        }
        return $headers;
    }
}

/**
 * Authenticate Request
 */
if (!function_exists('authenticate')) {
    function authenticate($pdo = null, $dieOnError = true)
    {
        $token = null;
        $headers = function_exists('getallheaders') ? getallheaders() : [];

        // 0. Identify the calling application for cookie selection
        $appId = $headers['X-App-ID'] ?? $headers['x-app-id'] ?? null;

        // 1. Explicit Headers (Highest priority to prevent cross-app local HTTP cookie contamination)
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? null;
        if ($authHeader && preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
            $token = $matches[1];
        }

        if (!$token) {
            $token = $headers['X-Session-Token'] ?? $headers['x-session-token'] ?? null;
        }

        // 2. Isolated Cookie Check
        if (!$token) {
            if ($appId === 'admin') {
                $token = $_COOKIE['ehub_admin_session'] ?? null;
            } elseif ($appId === 'storefront') {
                $token = $_COOKIE['ehub_store_session'] ?? null;
            }
            
            // Fallback for transition or missing headers
            if (!$token) {
                $token = $_COOKIE['ehub_session'] ?? null;
            }
        }

        if (!$token) {
            if (function_exists('logApp')) logApp('error', 'AUTH', "AUTH FAIL: No token found. App-ID: $appId | Headers: " . json_encode($headers));
            if ($dieOnError) {
                header('Content-Type: application/json');
                http_response_code(401);
                echo json_encode(['success' => false, 'message' => 'Unauthorized: Missing or invalid token.']);
                exit;
            }
            return null;
        }

        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            if ($dieOnError) {
                header('Content-Type: application/json');
                http_response_code(401);
                echo json_encode(['success' => false, 'message' => 'Unauthorized: Invalid token format.']);
                exit;
            }
            return null;
        }

        // SECURITY FIX: Verify Signature
        $config = $GLOBALS['config'] ?? require_once 'config.php';
        $secret = $config['JWT_SECRET'];
        $headerAndPayload = $parts[0] . '.' . $parts[1];
        
        // Re-calculate signature
        $expectedSig = hash_hmac('sha256', $headerAndPayload, $secret, true);
        $encodedSig = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($expectedSig));

        if (!hash_equals($encodedSig, $parts[2])) {
            if (function_exists('logApp')) logApp('error', 'AUTH', "AUTH FAIL: Invalid token signature. Header+Payload: " . $headerAndPayload);
            if ($dieOnError) {
                header('Content-Type: application/json');
                http_response_code(401);
                echo json_encode(['success' => false, 'message' => 'Unauthorized: Invalid token signature.']);
                exit;
            }
            return null;
        }

        $payload = json_decode(base64_decode(str_replace(['-', '_'], ['+', '/'], $parts[1])), true);

        // Security: Verify IP Pinning (Hijack Prevention)
        $tokenIp = $payload['ip'] ?? '';
        $currentIp = getClientIP();
        
        // Only enforce mismatch if token has a valid IP (prevents logout if IP detection fails during login)
        if (!empty($tokenIp) && $tokenIp !== 'unknown' && $tokenIp !== $currentIp) {
            if (function_exists('logApp')) logApp('warn', 'AUTH_HIJACK', "Session IP mismatch. Token IP: $tokenIp | Current IP: $currentIp");
            clearSession();
            if ($dieOnError) {
                header('Content-Type: application/json');
                http_response_code(401);
                echo json_encode(['success' => false, 'message' => 'Security Error: Session originated from a different network. Please log in again.']);
                exit;
            }
            return null;
        }

        if (isset($payload['exp']) && $payload['exp'] < time()) {
            if (function_exists('logApp')) logApp('error', 'AUTH', "AUTH FAIL: Token expired.");
            clearSession();
            if ($dieOnError) {
                header('Content-Type: application/json');
                http_response_code(401);
                echo json_encode(['success' => false, 'message' => 'Unauthorized: Token expired.']);
                exit;
            }
            return null;
        }

        $userId = $payload['user_id'] ?? null;

        // If PDO is available, verify the user actually exists in the database
        if ($userId && $pdo) {
            $stmt = $pdo->prepare("SELECT id FROM users WHERE id = ?");
            $stmt->execute([$userId]);
            if (!$stmt->fetch()) {
                clearSession();
                if ($dieOnError) {
                    header('Content-Type: application/json');
                    http_response_code(401);
                    echo json_encode(['success' => false, 'message' => 'Account no longer exists. Please log in again.']);
                    exit;
                }
                return null;
            }
        }

        return $userId;
    }
}

/**
 * Clear the session cookie
 */
if (!function_exists('clearSession')) {
    function clearSession() {
        $cookieParams = [
            'expires' => time() - 3600,
            'path' => '/',
            'domain' => '',
            'secure' => isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on',
            'httponly' => true,
            'samesite' => 'Strict'
        ];
        
        // Clear all possible session cookies to ensure clean isolation
        setcookie('ehub_session', '', $cookieParams);
        setcookie('ehub_admin_session', '', $cookieParams);
        setcookie('ehub_store_session', '', $cookieParams);
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
 * Admin audit trail logger for critical mutations.
 */
if (!function_exists('logAdminAudit')) {
    function logAdminAudit($pdo, $actorUserId, $action, $entityType, $entityId = null, $changes = null)
    {
        try {
            $pdo->exec("CREATE TABLE IF NOT EXISTS admin_audit_logs (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                actor_user_id INT NOT NULL,
                actor_role VARCHAR(50) DEFAULT NULL,
                action VARCHAR(120) NOT NULL,
                entity_type VARCHAR(80) NOT NULL,
                entity_id VARCHAR(120) DEFAULT NULL,
                changes_json JSON DEFAULT NULL,
                ip_address VARCHAR(45) DEFAULT NULL,
                user_agent VARCHAR(255) DEFAULT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_actor_created (actor_user_id, created_at),
                INDEX idx_entity (entity_type, entity_id)
            )");

            $role = getUserRole($actorUserId, $pdo);
            $ip = getClientIP();
            $ua = substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 255);
            $changesJson = $changes !== null ? json_encode($changes) : null;

            $stmt = $pdo->prepare("INSERT INTO admin_audit_logs (actor_user_id, actor_role, action, entity_type, entity_id, changes_json, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                (int)$actorUserId,
                $role,
                (string)$action,
                (string)$entityType,
                $entityId !== null ? (string)$entityId : null,
                $changesJson,
                $ip,
                $ua
            ]);
        } catch (Throwable $e) {
            if (function_exists('logger')) {
                logger('error', 'AUDIT', 'Failed to write audit log: ' . $e->getMessage());
            }
        }
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
            // Also check X-Session-Token (matches cors_middleware.php)
            if (!$token) {
                $token = $headers['X-Session-Token'] ?? $headers['x-session-token'] ?? null;
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
 * Get User Details including Branch
 */
if (!function_exists('getUserDetails')) {
    function getUserDetails($userId, $pdo)
    {
        $stmt = $pdo->prepare("SELECT id, name as username, role FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
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
        static $isLogging = false;
        if ($isLogging) return; // Prevent log recursion (e.g. logApp -> logger -> authenticate -> logApp)
        $isLogging = true;

        $level = strtolower($level);
        // Only log info messages if debug mode is on
        if ($level === 'info' && function_exists('isDebugEnabled') && !isDebugEnabled()) {
            $isLogging = false;
            return;
        }

        $logDir = __DIR__ . '/logs';
        if (!is_dir($logDir)) mkdir($logDir, 0755, true);
        
        $userIdCtx = '';
        // SAFELY Extract UID without triggering authenticate() recursion
        // Check for Bearer token or cookie manually
        $token = null;
        $headers = function_exists('getallheaders') ? getallheaders() : [];
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? null;
        if ($authHeader && preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
            $token = $matches[1];
        } elseif (isset($_COOKIE['ehub_session'])) {
            $token = $_COOKIE['ehub_session'];
        }

        if ($token) {
            $parts = explode('.', $token);
            if (count($parts) === 3) {
                $payload = json_decode(base64_decode(str_replace(['-', '_'], ['+', '/'], $parts[1])), true);
                if (isset($payload['user_id'])) {
                    $userIdCtx = " [UID:{$payload['user_id']}]";
                }
            }
        }

        $line = date('Y-m-d H:i:s') . " [" . strtoupper($level) . "] [" . strtoupper($source) . "]$userIdCtx $message" . PHP_EOL;
        $dailyFile = $logDir . '/app-' . date('Y-m-d') . '.log';
        file_put_contents($dailyFile, $line, FILE_APPEND);
        
        $isLogging = false;
    }
}

/**
 * Rate Limiter
 * $limit: request count per window
 * $window: time window in seconds (e.g., 60 for minute, 3600 for hour)
 */
if (!function_exists('checkRateLimit')) {
    function checkRateLimit($pdo, $limit = 300, $window = 60, $action = 'default')
    {
        // Self-heal table if needed
        try {
            $pdo->exec("CREATE TABLE IF NOT EXISTS api_rate_limits (
                ip_address VARCHAR(45),
                action VARCHAR(50) DEFAULT 'default',
                request_count INT DEFAULT 1,
                last_request TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (ip_address, action)
            )");
        } catch (Exception $e) {}

        $ip = getClientIP();
        try {
            $stmt = $pdo->prepare("SELECT request_count, last_request FROM api_rate_limits WHERE ip_address = ? AND action = ?");
            $stmt->execute([$ip, $action]);
            $row = $stmt->fetch();
            
            if ($row) {
                $lastTime = strtotime($row['last_request']);
                // Check if we are still within the same window since the last request
                if (time() - $lastTime < $window) {
                    if ($row['request_count'] >= $limit) {
                        header('Content-Type: application/json');
                        http_response_code(429);
                        $remainingSeconds = max(0, $window - (time() - $lastTime));
                        $unit = ($window >= 3600) ? 'hour' : 'minute';
                        $waitLabel = ($remainingSeconds >= 60) ? ceil($remainingSeconds / 60) . ' minutes' : $remainingSeconds . ' seconds';
                        
                        echo json_encode([
                            'success' => false, 
                            'message' => "Too many attempts ($limit per $unit). Please wait about $waitLabel."
                        ]);
                        exit;
                    }
                    $pdo->prepare("UPDATE api_rate_limits SET request_count = request_count + 1, last_request = CURRENT_TIMESTAMP WHERE ip_address = ? AND action = ?")->execute([$ip, $action]);
                } else {
                    // Reset if the window has passed since the last attempt
                    $pdo->prepare("UPDATE api_rate_limits SET request_count = 1, last_request = CURRENT_TIMESTAMP WHERE ip_address = ? AND action = ?")->execute([$ip, $action]);
                }
            } else {
                $pdo->prepare("INSERT INTO api_rate_limits (ip_address, action, request_count, last_request) VALUES (?, ?, 1, CURRENT_TIMESTAMP)")->execute([$ip, $action]);
            }
        } catch (Exception $e) {
            if (function_exists('logger')) logger('error', 'SECURITY', "Rate limit error: " . $e->getMessage());
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



/**
 * Calculate Regional Shipping Fee
 * Returns array with 'fee', 'city'
 */
if (!function_exists('calculateRegionalShipping')) {
    function calculateRegionalShipping($userRegion, $subtotal, $pdo)
    {
        $baseFee = 35.00; // Default: Regional/Upcountry
        
        // Define 'Local' as Greater Accra (Main Hub Location)
        $localRegions = ['Greater Accra', 'Accra'];
        if ($userRegion && in_array($userRegion, $localRegions)) {
            $baseFee = 15.00;
        }
        
        // Dynamic discount for large orders
        if ($subtotal >= 1500) {
            $baseFee = $baseFee * 0.5;
        }
        return [
            'fee' => (float)$baseFee,
            'city' => 'Accra'
        ];
    }
}
/**
 * Get Effective Price
 * Calculates the current price based on percentage discounts and expiry
 */
if (!function_exists('getEffectivePrice')) {
    function getEffectivePrice($product)
    {
        $basePrice = (float)($product['price'] ?? 0);
        $discountPercent = (int)($product['discount_percent'] ?? 0);
        $saleEndsAt = $product['sale_ends_at'] ?? null;

        if ($discountPercent > 0) {
            $isExpired = false;
            if ($saleEndsAt) {
                $expiryTime = strtotime($saleEndsAt);
                if ($expiryTime < time()) {
                    $isExpired = true;
                }
            }

            if (!$isExpired) {
                $discountAmount = $basePrice * ($discountPercent / 100);
                return max(0, $basePrice - $discountAmount);
            }
        }

        return $basePrice;
    }
}
/**
 * Update User Level based on spend
 */
if (!function_exists('updateUserLevel')) {
    function updateUserLevel($userId, $pdo)
    {
        try {
            // 1. Calculate total spend from completed orders
            $stmt = $pdo->prepare("
                SELECT SUM(total_amount) 
                FROM orders 
                WHERE user_id = ? AND status IN ('delivered', 'completed')
            ");
            $stmt->execute([$userId]);
            $totalSpend = (float)$stmt->fetchColumn() ?: 0;

            // 2. Determine Level based on spend
            $config = $GLOBALS['config'] ?? require_once 'config.php';
            $eliteThreshold = $config['ELITE_THRESHOLD'] ?? 500;
            $vipThreshold = $config['VIP_THRESHOLD'] ?? 2000;

            $levelName = "Starter";
            $levelNum = 1;

            if ($totalSpend >= $vipThreshold) {
                $levelName = "VIP"; $levelNum = 3;
            } elseif ($totalSpend >= $eliteThreshold) {
                $levelName = "Elite"; $levelNum = 2;
            }

            // 3. Update user level in DB if it changed
            $stmt = $pdo->prepare("UPDATE users SET level = ?, level_name = ? WHERE id = ? AND (level != ? OR level_name != ? OR level_name IS NULL)");
            $stmt->execute([$levelNum, $levelName, $userId, $levelNum, $levelName]);
            
            return [
                'total_spend' => $totalSpend,
                'level_name' => $levelName,
                'level_num' => $levelNum
            ];
        } catch (Exception $e) {
            error_log("Update user level error: " . $e->getMessage());
            return null;
        }
    }
}
/**
 * Centrally scrub user object for safe API transmission.
 * Strips password hashes, secrets, and other sensitive metadata.
 */
if (!function_exists('scrubUser')) {
    function scrubUser($user)
    {
        if (!$user || !is_array($user)) return null;
        
        $sensitiveFields = [
            'password_hash', 
            'two_factor_secret', 
            'temp_otp', 
            'reset_token', 
            'profile_image_raw', // Large binary data
            'auth_provider_id'
        ];

        foreach ($sensitiveFields as $field) {
            unset($user[$field]);
        }

        // Cast numeric types for consistency
        if (isset($user['id'])) $user['id'] = (int)$user['id'];
        if (isset($user['level'])) $user['level'] = (int)$user['level'];
        if (isset($user['id_verified'])) $user['id_verified'] = (bool)$user['id_verified'];
        
        return $user;
    }
}
