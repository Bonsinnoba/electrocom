<?php
require_once 'cors_middleware.php';

$settingsFile = __DIR__ . '/data/super_settings.json';

$DEFAULTS = [
    // Identity
    'siteName'    => 'ElectroCom',
    'siteEmail'   => 'admin@electrocom.gh',
    'phone1'      => '0536683393',
    'phone2'      => '0506408074',
    'whatsapp'    => '233536683393',
    'maintenanceMode' => false,
    // General
    'siteLogoUrl'  => '',
    'faviconUrl'   => '',
    'storeAddress' => '',
    'businessHours'=> 'Mon–Fri, 8am–6pm',
    'socialInstagram' => '',
    'socialTwitter'   => '',
    'socialFacebook'  => '',
    'socialTikTok'    => '',
    'socialYoutube'   => '',
    // Branding
    'primaryColor'      => '#3b82f6',
    'accentColor'       => '#f59e0b',
    'headerBg'          => '#0f172a',
    'fontFamily'        => 'Inter',
    'heroBannerTagline' => '',
    'heroBannerSubtext' => '',
    'heroCTAText'       => 'Shop Now',
    'heroCTAUrl'        => '/products',
    // Storefront behaviour
    'defaultItemsPerPage'      => 9,
    'homepageSectionTitle'     => 'Product Catalog',
    'homepageFeaturedCategory' => '',
    'vatRate'                  => 10,
    'allowRegistration'        => true,
    'orderReceiptFooterNote'   => '',
];

$stored = file_exists($settingsFile) ? json_decode(file_get_contents($settingsFile), true) : [];
$merged = array_merge($DEFAULTS, $stored ?? []);

// Only expose non-sensitive public keys to the storefront
$publicKeys = array_keys($DEFAULTS);
$publicSettings = array_intersect_key($merged, array_flip($publicKeys));

header('Content-Type: application/json');
echo json_encode(['success' => true, 'data' => $publicSettings]);

