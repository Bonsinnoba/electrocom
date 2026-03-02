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
    'linkedin' => new GenericProvider([
        'clientId' => $config['LINKEDIN_CLIENT_ID'] ?? '',
        'clientSecret' => $config['LINKEDIN_CLIENT_SECRET'] ?? '',
        'redirectUri' => $config['LINKEDIN_REDIRECT'] ?? '',
        'urlAuthorize' => 'https://www.linkedin.com/oauth/v2/authorization',
        'urlAccessToken' => 'https://www.linkedin.com/oauth/v2/accessToken',
        'urlResourceOwnerDetails' => 'https://api.linkedin.com/v2/me',
        'scopes' => ['r_emailaddress', 'r_liteprofile'],
        'scopeSeparator' => ' ',
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
    'linkedin' => ['LINKEDIN_CLIENT_ID', 'LINKEDIN_CLIENT_SECRET', 'LINKEDIN_REDIRECT'],
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
    // redirect to provider's authorization page
    $authorizationUrl = $oauthProvider->getAuthorizationUrl();
    $_SESSION['oauth_state'] = $oauthProvider->getState();
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
            break;
        case 'linkedin':
            $email = $userInfo['email'] ?? null;
            $name = trim(($userInfo['localizedFirstName'] ?? '') . ' ' . ($userInfo['localizedLastName'] ?? ''));
            break;
    }

    if (!$email) {
        throw new Exception('No email returned by provider');
    }

    // look up or create local user
    $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        // social login is only for existing accounts
        http_response_code(403);
        throw new Exception('This email has no account yet. Please register using Ghana card verification first.');
    }

    // issue token
    $token = generateToken($user['id']);
    // if front-end URL configured, redirect there with token instead of dumping JSON
    $frontend = $config['FRONTEND_URL'] ?? '';
    if ($frontend) {
        // attach token and user details (base64 encoded) so frontend can update state
        $encodedUser = urlencode(base64_encode(json_encode($user)));
        $location = rtrim($frontend, '/') . '/?social_token=' . urlencode($token) . '&social_user=' . $encodedUser;
        header('Location: ' . $location);
        exit;
    }

    echo json_encode(['success' => true, 'data' => ['token' => $token, 'user' => $user]]);
} catch (Exception $e) {
    // on error, try to redirect back to front-end with message
    $err = $e->getMessage();
    $frontend = $config['FRONTEND_URL'] ?? '';
    if ($frontend) {
        $location = rtrim($frontend, '/') . '/?social_error=' . urlencode($err);
        header('Location: ' . $location);
        exit;
    }

    http_response_code(400);
    echo json_encode(['success' => false, 'message' => $err]);
}
