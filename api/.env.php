<?php
// .env.php
// DO NOT COMMIT THIS FILE TO VERSION CONTROL
// This file stores sensitive configuration data.

return [
    'JWT_SECRET' => 'ehub_v3_secure_p@ssw0rd_rand_2024_!#$%', // In production, use a 64+ char random string
    'DB_HOST' => 'localhost:10017',
    'DB_USER' => 'root',
    'DB_PASS' => 'root',
    'DB_NAME' => 'local',
    'PAYSTACK_SECRET' => 'sk_test_ReplaceWithYourSecretKeyHere',
    'PASSWORD_PEPPER' => 'ehub_v3_super_secret_pepper_2024_@#!', // Change this to a random string
    'DATA_ENCRYPTION_KEY' => 'replace_with_32+_char_random_key', // used to encrypt Ghana card photos
    'GOV_API_URL' => 'https://example.gov/verify', // endpoint for Ghana card validation
    'GOV_API_KEY' => 'your-government-api-key',
    // --- social login credentials ---
    'GOOGLE_CLIENT_ID' => '',
    'GOOGLE_CLIENT_SECRET' => '',
    'GOOGLE_REDIRECT' => 'http://localhost/social_auth.php?provider=google',

    'FACEBOOK_CLIENT_ID' => '',
    'FACEBOOK_CLIENT_SECRET' => '',
    'FACEBOOK_REDIRECT' => 'http://localhost/social_auth.php?provider=facebook',

    'GITHUB_CLIENT_ID' => '',
    'GITHUB_CLIENT_SECRET' => '',
    'GITHUB_REDIRECT' => 'http://localhost/social_auth.php?provider=github',

    'LINKEDIN_CLIENT_ID' => '',
    'LINKEDIN_CLIENT_SECRET' => '',
    'LINKEDIN_REDIRECT' => 'http://localhost/social_auth.php?provider=linkedin',
    // URL of your frontend application where users should land after social login
    'FRONTEND_URL' => 'http://localhost:5173',

    // --- notification services ---
    'MAIL_FROM' => 'no-reply@essentialshub.com',
    'SMTP_HOST' => '', // e.g., smtp.gmail.com (Real SMTP requires an SMTP library like PHPMailer)
    'SMS_SID' => '',   // Twilio Account SID
    'SMS_TOKEN' => '', // Twilio Auth Token
    'SMS_FROM' => '',  // Twilio Phone Number
];
