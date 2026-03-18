<?php
// backend/social_auth.php
require __DIR__ . '/cors_middleware.php';
require __DIR__ . '/db.php';
require __DIR__ . '/security.php';
require __DIR__ . '/vendor/autoload.php';

use League\OAuth2\Client\Provider\GenericProvider;

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

header('Content-Type: application/json');

$config = require __DIR__ . '/.env.php';
$provider = $_GET['provider'] ?? '';
$code = $_GET['code'] ?? null;
$state = $_GET['state'] ?? null;

if (!$provider) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Provider parameter is required.']);
    exit;
}

// Initialize OAuth providers using GenericProvider (league/oauth2-client only ships GenericProvider)
$providers = [
    'google' => new GenericProvider([
        'clientId' => $config['GOOGLE_CLIENT_ID'] ?? '',
        'clientSecret' => $config['GOOGLE_CLIENT_SECRET'] ?? '',
        'redirectUri' => $config['GOOGLE_REDIRECT'] ?? '',
        'urlAuthorize' => 'https://accounts.google.com/o/oauth2/v2/auth',
        'urlAccessToken' => 'https://oauth2.googleapis.com/token',
        'urlResourceOwnerDetails' => 'https://www.googleapis.com/oauth2/v2/userinfo',
        'scopes' => ['openid', 'email', 'profile'],
        'scopeSeparator' => ' ',
    ]),
    'facebook' => new GenericProvider([
        'clientId' => $config['FACEBOOK_CLIENT_ID'] ?? '',
        'clientSecret' => $config['FACEBOOK_CLIENT_SECRET'] ?? '',
        'redirectUri' => $config['FACEBOOK_REDIRECT'] ?? '',
        'urlAuthorize' => 'https://www.facebook.com/v18.0/dialog/oauth',
        'urlAccessToken' => 'https://graph.facebook.com/v18.0/oauth/access_token',
        'urlResourceOwnerDetails' => 'https://graph.facebook.com/me?fields=id,name,email',
    ]),
    'github' => new GenericProvider([
        'clientId' => $config['GITHUB_CLIENT_ID'] ?? '',
        'clientSecret' => $config['GITHUB_CLIENT_SECRET'] ?? '',
        'redirectUri' => $config['GITHUB_REDIRECT'] ?? '',
        'urlAuthorize' => 'https://github.com/login/oauth/authorize',
        'urlAccessToken' => 'https://github.com/login/oauth/access_token',
        'urlResourceOwnerDetails' => 'https://api.github.com/user',
    ]),
];

if (!isset($providers[$provider])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Unsupported provider']);
    exit;
}

// Require credentials so we don't send user to provider with missing client_id (e.g. Google "Missing required parameter: client_id")
$requiredKeys = [
    'google'   => ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_REDIRECT'],
    'facebook' => ['FACEBOOK_CLIENT_ID', 'FACEBOOK_CLIENT_SECRET', 'FACEBOOK_REDIRECT'],
    'github'   => ['GITHUB_CLIENT_ID', 'GITHUB_CLIENT_SECRET', 'GITHUB_REDIRECT'],
];
foreach ($requiredKeys[$provider] as $key) {
    if (empty($config[$key]) || !trim((string) $config[$key])) {
        $frontend = $config['FRONTEND_URL'] ?? '';
        $internalMsg = 'Sign-in with ' . ucfirst($provider) . ' is not configured. Please set ' . $key . ' (and related keys) in the server .env.php and in the ' . ucfirst($provider) . ' developer console.';
        error_log("Social Auth Config Error: " . $internalMsg);

        $msg = 'Sign-in with ' . ucfirst($provider) . ' is currently unavailable. Please try another sign-in method or contact support.';

        if ($frontend) {
            header('Location: ' . rtrim($frontend, '/') . '/?social_error=' . urlencode($msg));
            exit;
        }
        http_response_code(503);
        echo json_encode(['success' => false, 'message' => $msg]);
        exit;
    }
}

$oauthProvider = $providers[$provider];

if (!$code) {
    // Build the base authorization URL from the provider
    $authorizationUrl = $oauthProvider->getAuthorizationUrl();
    $_SESSION['oauth_state'] = $oauthProvider->getState();

    // Force account selection screen — prevent silent re-auth on every provider.
    // GenericProvider sends 'approval_prompt' by default; Google rejects it
    // alongside 'prompt', so we strip it out and inject only 'prompt'.
    $parsed = parse_url($authorizationUrl);
    parse_str($parsed['query'] ?? '', $queryParams);

    if ($provider === 'google') {
        // Remove GenericProvider's 'approval_prompt' and use 'prompt' instead
        unset($queryParams['approval_prompt']);
        $queryParams['prompt'] = 'select_account';
    } elseif ($provider === 'github') {
        // GitHub supports 'prompt=select_account' to force the account chooser
        $queryParams['prompt'] = 'select_account';
        // Also clear any cached login hint
        unset($queryParams['login']);
    } elseif ($provider === 'facebook') {
        $queryParams['auth_type'] = 'rerequest';
    }

    $authorizationUrl = $parsed['scheme'] . '://' . $parsed['host'] . $parsed['path'] . '?' . http_build_query($queryParams);

    header('Location: ' . $authorizationUrl);
    exit;
}

try {
    // exchange code for access token
    $accessToken = $oauthProvider->getAccessToken('authorization_code', [
        'code' => $code
    ]);

    // fetch user profile
    $resourceOwner = $oauthProvider->getResourceOwner($accessToken);
    $userInfo = $resourceOwner->toArray();

    // extract email and name (provider-specific)
    $email = null;
    $name = null;

    switch ($provider) {
        case 'google':
            $email = $userInfo['email'] ?? null;
            $name = $userInfo['name'] ?? null;
            break;
        case 'facebook':
            $email = $userInfo['email'] ?? null;
            $name = $userInfo['name'] ?? null;
            break;
        case 'github':
            $email = $userInfo['email'] ?? null;
            $name = $userInfo['name'] ?? $userInfo['login'] ?? null;
            // GitHub users can set their email to private; fetch from /user/emails API as fallback
            if (!$email) {
                $emailsResponse = @file_get_contents(
                    'https://api.github.com/user/emails',
                    false,
                    stream_context_create(['http' => [
                        'header' => [
                            'Authorization: Bearer ' . $accessToken->getToken(),
                            'User-Agent: ElectroCom-App',
                            'Accept: application/vnd.github+json'
                        ]
                    ]])
                );
                if ($emailsResponse) {
                    $emails = json_decode($emailsResponse, true);
                    foreach ($emails as $emailEntry) {
                        if ($emailEntry['primary'] && $emailEntry['verified']) {
                            $email = $emailEntry['email'];
                            break;
                        }
                    }
                }
            }
            break;
    }

    if (!$email) {
        throw new Exception('No email returned by provider. If using GitHub, please make your email public in GitHub settings.');
    }

    // --- Self-healing Schema ---
    if ($config['DB_AUTO_REPAIR'] ?? false) {
        try {
            $cols = $pdo->query("DESCRIBE users")->fetchAll(PDO::FETCH_COLUMN);
            if (!in_array('auth_provider', $cols)) {
                $pdo->exec("ALTER TABLE users ADD COLUMN auth_provider VARCHAR(50) DEFAULT 'local'");
            }
            if (!in_array('auth_provider_id', $cols)) {
                $pdo->exec("ALTER TABLE users ADD COLUMN auth_provider_id VARCHAR(255) DEFAULT NULL");
            }
        } catch (Exception $e) {
            error_log("Schema auto-repair failed in social_auth: " . $e->getMessage());
        }
    }

    // look up or create local user
    $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        $providerId = $userInfo['id'] ?? $userInfo['sub'] ?? null;
        $randomPassword = password_hash(bin2hex(random_bytes(16)), PASSWORD_BCRYPT);
        
        $insertStmt = $pdo->prepare("INSERT INTO users (name, email, password_hash, id_verified, auth_provider, auth_provider_id, created_at, updated_at) VALUES (?, ?, ?, 0, ?, ?, NOW(), NOW())");
        $insertStmt->execute([$name ?: 'New User', $email, $randomPassword, $provider, $providerId]);
        
        $newUserId = $pdo->lastInsertId();
        
        // Fetch the newly created user
        $stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
        $stmt->execute([$newUserId]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Log the auto-registration
        logger('ok', 'AUTH_SOCIAL', "User automatically registered via $provider: {$email}");
    } else {
        // Option: Link the provider ID if it was a local account
        if (empty($user['auth_provider']) || $user['auth_provider'] === 'local') {
             $providerId = $userInfo['id'] ?? $userInfo['sub'] ?? null;
             $updateStmt = $pdo->prepare("UPDATE users SET auth_provider = ?, auth_provider_id = ? WHERE id = ?");
             $updateStmt->execute([$provider, $providerId, $user['id']]);
        }
        logger('info', 'AUTH_SOCIAL', "User logged in via $provider: {$email}");
    }

    // issue token
    $token = generateToken($user['id']);
    // if front-end URL configured, redirect there with token instead of dumping JSON
    $frontend = $config['FRONTEND_URL'] ?? '';
    if ($frontend) {
        // Only encode the minimal fields the frontend needs.
        // NEVER include password_hash, two_factor_secret, profile_image (base64 LONGTEXT), etc.
        // Those cause ERR_RESPONSE_HEADERS_TOO_BIG.
        $minimalUser = [
            'id'                 => (int)$user['id'],
            'name'               => $user['name'],
            'email'              => $user['email'],
            'phone'              => $user['phone'] ?? '',
            'address'            => $user['address'] ?? '',
            'level'              => (int)($user['level'] ?? 1),
            'level_name'         => $user['level_name'] ?? 'Starter',
            'avatar_text'        => $user['avatar_text'] ?? strtoupper(substr($user['name'] ?? 'U', 0, 2)),
            'profile_image'      => null, // omit — can be fetched later from profile
            'role'               => $user['role'] ?? 'customer',
            'email_notif'        => (bool)($user['email_notif'] ?? true),
            'push_notif'         => (bool)($user['push_notif'] ?? true),
            'sms_tracking'       => (bool)($user['sms_tracking'] ?? true),
            'two_factor_enabled' => (bool)($user['two_factor_enabled'] ?? false),
            'theme'              => $user['theme'] ?? 'blue',
        ];
        $encodedUser = urlencode(base64_encode(json_encode($minimalUser)));
        $location = rtrim($frontend, '/') . '/?social_token=' . urlencode($token) . '&social_user=' . $encodedUser;
        header('Location: ' . $location);
        exit;
    }

    echo json_encode(['success' => true, 'data' => [
        'token' => $token,
        'user' => [
            'id' => (int)$user['id'],
            'name' => $user['name'],
            'email' => $user['email'],
            'phone' => $user['phone'] ?? '',
            'address' => $user['address'] ?? '',
            'level' => $user['level'] ?? 1,
            'levelName' => $user['level_name'] ?? 'Starter',
            'avatar' => $user['avatar_text'] ?? '',
            'profileImage' => $user['profile_image'] ?? null,
            'role' => $user['role'],
            'email_notif' => (bool)($user['email_notif'] ?? true),
            'push_notif' => (bool)($user['push_notif'] ?? true),
            'sms_tracking' => (bool)($user['sms_tracking'] ?? true),
            'two_factor_enabled' => (bool)($user['two_factor_enabled'] ?? false)
        ]
    ]]);
} catch (Exception $e) {
    // on error, try to redirect back to front-end with message
    $err = $e->getMessage();
    error_log("SOCIAL AUTH FATAL EXCEPTION: " . get_class($e) . " - " . $e->getMessage() . (method_exists($e, "getResponseBody") ? " BODY: " . print_r($e->getResponseBody(), true) : "") . "\n", 3, __DIR__ . "/social_debug.log");
    $frontend = $config['FRONTEND_URL'] ?? '';
    if ($frontend) {
        $location = rtrim($frontend, '/') . '/?social_error=' . urlencode($err);
        header('Location: ' . $location);
        exit;
    }

    http_response_code(400);
    echo json_encode(['success' => false, 'message' => $err]);
}
