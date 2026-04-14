<?php
/**
 * Single source for super_settings.json defaults + merge helpers (brand / site identity).
 */

if (!function_exists('eh_super_settings_path')) {
    function eh_super_settings_path(): string
    {
        return __DIR__ . '/data/super_settings.json';
    }
}

if (!function_exists('eh_super_settings_defaults_full')) {
    /**
     * Full defaults for super_settings (admin + API merge). Keep in sync with admin GlobalSettings.jsx.
     */
    function eh_super_settings_defaults_full(): array
    {
        return [
            'siteName'          => 'My Store',
            'siteEmail'         => 'hello@example.com',
            'phone1'            => '',
            'phone2'            => '',
            'whatsapp'          => '',
            'siteLogoUrl'       => '',
            'faviconUrl'        => '',
            'storeAddress'      => '',
            'businessHours'     => 'Mon–Fri, 9am–5pm',
            'socialInstagram'   => '',
            'socialTwitter'     => '',
            'socialFacebook'    => '',
            'socialTikTok'      => '',
            'socialYoutube'     => '',
            'primaryColor'            => '#3b82f6',
            'accentColor'             => '#f59e0b',
            'headerBg'                => '#0f172a',
            'fontFamily'              => 'Inter',
            'heroBannerTagline'       => '',
            'heroBannerSubtext'       => '',
            'heroCTAText'             => 'Shop Now',
            'heroCTAUrl'              => '/products',
            'siteTagline'             => 'Shop online',
            'metaDescription'         => 'Shop quality products online with secure checkout and support.',
            'maintenanceMode'          => false,
            'allowRegistration'        => true,
            'allowDoorToDoorDelivery'  => false,
            'maxLoginAttempts'         => 5,
            'sessionTimeout'           => 60,
            'twoFactorAdmin'           => false,
            'lockoutDuration'          => 30,
            'passwordMinLength'        => 8,
            'requireEmailVerification' => false,
            'requireNumberInPassword'  => false,
            'emailNotify'       => true,
            'emailProvider'     => 'smtp',
            'emailProviderSmtpEnabled' => true,
            'emailProviderMailgunEnabled' => false,
            'emailProviderSendgridEnabled' => false,
            'securityAlerts'    => true,
            'lowStockThreshold' => 5,
            'lowStockAlertEmail'=> 'hello@example.com',
            'apiRateLimit'             => 100,
            'debugMode'                => false,
            'backupFrequency'          => 'daily',
            'insightsShipWarnHours'       => 24,
            'insightsShipCriticalHours'   => 48,
            'insightsLowStockWarnCount'   => 5,
            'insightsLowStockCriticalCount'=> 12,
            'insightsOnlineRevenueMinPct' => 35,
            'insightsRepeatOrderMin'      => 1.2,
            'insightsWeightShip'          => 35,
            'insightsWeightStock'         => 25,
            'insightsWeightOnline'        => 20,
            'insightsWeightRepeat'        => 20,
            'defaultItemsPerPage'      => 12,
            'orderReceiptFooterNote'   => '',
            'homepageSectionTitle'     => 'New Arrivals',
            'homepageFeaturedCategory' => '',
            'vatRate'                  => 0,
        ];
    }
}

if (!function_exists('eh_storefront_public_setting_keys')) {
    /** Keys safe to expose to the storefront via get_site_settings.php */
    function eh_storefront_public_setting_keys(): array
    {
        return [
            'siteName', 'siteEmail', 'phone1', 'phone2', 'whatsapp', 'maintenanceMode',
            'siteLogoUrl', 'faviconUrl', 'storeAddress', 'businessHours',
            'socialInstagram', 'socialTwitter', 'socialFacebook', 'socialTikTok', 'socialYoutube',
            'primaryColor', 'accentColor', 'headerBg', 'fontFamily',
            'heroBannerTagline', 'heroBannerSubtext', 'heroCTAText', 'heroCTAUrl',
            'siteTagline', 'metaDescription',
            'defaultItemsPerPage', 'homepageSectionTitle', 'homepageFeaturedCategory',
            'vatRate', 'allowRegistration', 'allowDoorToDoorDelivery', 'orderReceiptFooterNote',
        ];
    }
}

if (!function_exists('eh_merged_super_settings')) {
    function eh_merged_super_settings(): array
    {
        static $merged = null;
        if ($merged !== null) {
            return $merged;
        }
        $defaults = eh_super_settings_defaults_full();
        $path = eh_super_settings_path();
        $stored = file_exists($path) ? json_decode(file_get_contents($path), true) : [];
        $merged = array_merge($defaults, is_array($stored) ? $stored : []);

        return $merged;
    }
}

if (!function_exists('eh_brand_site_name')) {
    function eh_brand_site_name(): string
    {
        $m = eh_merged_super_settings();
        $n = trim((string) ($m['siteName'] ?? ''));

        return $n !== '' ? $n : 'My Store';
    }
}

if (!function_exists('eh_brand_site_email')) {
    function eh_brand_site_email(): string
    {
        $m = eh_merged_super_settings();
        $e = trim((string) ($m['siteEmail'] ?? ''));

        return $e !== '' ? $e : 'hello@example.com';
    }
}

if (!function_exists('eh_brand_invoice_block')) {
    /** @return array{name:string,email:string,phone_line:string,address:string,footer_note:string} */
    function eh_brand_invoice_block(): array
    {
        $m = eh_merged_super_settings();
        $p1 = trim((string) ($m['phone1'] ?? ''));
        $p2 = trim((string) ($m['phone2'] ?? ''));
        $phones = array_filter([$p1, $p2]);
        $phoneLine = count($phones) ? implode(' / ', $phones) : '';
        $footer = trim((string) ($m['orderReceiptFooterNote'] ?? ''));

        return [
            'name'        => eh_brand_site_name(),
            'email'       => eh_brand_site_email(),
            'phone_line'  => $phoneLine,
            'address'     => trim((string) ($m['storeAddress'] ?? '')),
            'footer_note' => $footer,
        ];
    }
}
