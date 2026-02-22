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
];
