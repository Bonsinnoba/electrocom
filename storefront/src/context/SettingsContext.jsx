import React, { createContext, useContext, useState, useEffect } from 'react';
import { updateProfile, formatImageUrl } from '../services/api';
import { useUser } from './UserContext';

const SettingsContext = createContext();

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export const SettingsProvider = ({ children }) => {
  const { user, updateUser } = useUser();
  const [siteSettings, setSiteSettings] = useState({
    // Identity (overridden by get_site_settings.php)
    siteName:     'My Store',
    siteEmail:    'hello@example.com',
    siteTagline:  'Shop online',
    metaDescription: '',
    phone1:       '',
    phone2:       '',
    whatsapp:     '',
    maintenanceMode: false,
    // Assets
    siteLogoUrl:  '',
    faviconUrl:   '',
    // Location
    storeAddress: '',
    businessHours:'Mon–Fri, 8am–6pm',
    // Social
    socialInstagram: '',
    socialTwitter:   '',
    socialFacebook:  '',
    socialTikTok:    '',
    socialYoutube:   '',
    // Branding
    primaryColor:      '#3b82f6',
    accentColor:       '#f59e0b',
    headerBg:          '#0f172a',
    fontFamily:        'Inter',
    heroBannerTagline: '',
    heroBannerSubtext: '',
    heroCTAText:       'Shop Now',
    heroCTAUrl:        '/products',
    // Storefront behaviour
    defaultItemsPerPage:      12,
    homepageSectionTitle:     'New Arrivals',
    homepageFeaturedCategory: '',
    vatRate:                  0,
    allowDoorToDoorDelivery:  false,
  });

  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('ehub_settings_v2');
    return saved ? JSON.parse(saved) : {
      email_notif: true,
      push_notif: true,
      sms_tracking: true,
      currency: 'GHS',
      language: 'English (UK)',
      currencySymbol: '₵',
      currencyRate: 1
    };
  });

  // Fetch site settings from backend
  useEffect(() => {
    const loadSiteSettings = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/get_site_settings.php`);
        const result = await response.json();
        if (result.success) {
          const data = result.data || {};
          // Ensure branding URLs are absolute
          if (data.siteLogoUrl) data.siteLogoUrl = formatImageUrl(data.siteLogoUrl);
          if (data.faviconUrl) data.faviconUrl = formatImageUrl(data.faviconUrl);
          
          setSiteSettings(prev => ({ ...prev, ...data }));
        }
      } catch (error) {
        console.error('Error loading site settings:', error);
      }
    };
    loadSiteSettings();
  }, []);

  // Sync with user object on load/change
  useEffect(() => {
    if (user) {
      setSettings(prev => ({
        ...prev,
        email_notif: user.email_notif ?? prev.email_notif,
        push_notif: user.push_notif ?? prev.push_notif,
        sms_tracking: user.sms_tracking ?? prev.sms_tracking
      }));
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('ehub_settings_v2', JSON.stringify(settings));
  }, [settings]);

  const updateSetting = async (key, value) => {
    const prevValue = settings[key];
    setSettings(prev => ({ ...prev, [key]: value }));

    // Persist to backend if a user is logged in and it's a preference field
    const persistentKeys = ['email_notif', 'push_notif', 'sms_tracking'];
    if (user && persistentKeys.includes(key)) {
      try {
        const result = await updateProfile({ [key]: value });
        if (result.success) {
          updateUser({ ...user, [key]: value });
        } else {
          // Revert on failure
          setSettings(prev => ({ ...prev, [key]: prevValue }));
        }
      } catch (error) {
        setSettings(prev => ({ ...prev, [key]: prevValue }));
      }
    }
  };

  const updateCurrency = (currency) => {
    // Only GHS is supported now
    setSettings(prev => ({
      ...prev,
      currency: 'GHS',
      currencySymbol: '₵',
      currencyRate: 1
    }));
  };

  const formatPrice = (price) => {
    const amount = Number(price) || 0;
    return `₵${amount.toFixed(2)}`;
  };

  return (
    <SettingsContext.Provider value={{ settings, siteSettings, updateSetting, updateCurrency, formatPrice }}>
      {children}
    </SettingsContext.Provider>
  );
};
