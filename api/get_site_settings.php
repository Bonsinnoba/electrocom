<?php
require_once 'cors_middleware.php';
require_once __DIR__ . '/brand_settings.php';

$merged = eh_merged_super_settings();
$publicKeys = eh_storefront_public_setting_keys();
$publicSettings = array_intersect_key($merged, array_flip($publicKeys));

header('Content-Type: application/json');
echo json_encode(['success' => true, 'data' => $publicSettings]);
