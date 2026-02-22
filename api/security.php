<?php
// backend/security.php
// Security Utilities and Middleware

/**
 * Hash a password using the current industry standard
 */
function hashPassword($password)
{
    return password_hash($password, PASSWORD_ARGON2ID);
}

/**
 * Verify a password against a hash
 */
function verifyPassword($password, $hash)
{
    return password_verify($password, $hash);
}

/**
 * Sanitize input to prevent XSS (Cross-Site Scripting)
 */
function sanitizeInput($data)
{
    if (is_array($data)) {
        return array_map('sanitizeInput', $data);
    }
    return htmlspecialchars(trim($data), ENT_QUOTES, 'UTF-8');
}

/**
 * Validate Email Format
 */
function isValidEmail($email)
{
    return filter_var($email, FILTER_VALIDATE_EMAIL);
}

/**
 * Generate a simple secure token for authentication (Basic implementation)
 * In production, consider using a proper JWT library.
 */
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

/**
 * Authenticate Request via Token
 */
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
