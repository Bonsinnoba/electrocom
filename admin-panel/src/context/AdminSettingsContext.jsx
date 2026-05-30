import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fetchSuperSettings, formatImageUrl } from '../services/api';
import { useAuth } from './AuthContext';

const AdminSettingsContext = createContext();

export const useAdminSettings = () => useContext(AdminSettingsContext);

export const AdminSettingsProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refreshSettings = useCallback(async () => {
    const token = localStorage.getItem('ehub_token');
    if (!isAuthenticated || !token) return;
    
    setLoading(true);
    try {
      const response = await fetchSuperSettings();
      if (response.success) {
        setSettings(response.data);
        setError(null);
      } else {
        setError(response.message || 'Failed to fetch settings');
      }
    } catch (err) {
      console.error('Error fetching admin settings:', err);
      setError('Network error fetching settings');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      refreshSettings();
    } else {
      setSettings(null);
      setLoading(false);
    }
  }, [isAuthenticated, refreshSettings]);

  return (
    <AdminSettingsContext.Provider value={{ 
      settings, 
      loading, 
      error, 
      refreshSettings,
      siteName: settings?.siteName || 'ElectroCom',
      siteEmail: settings?.siteEmail || 'support@electrocom.gh',
      primaryColor: settings?.primaryColor || '#3B82F6',
      fontFamily: settings?.fontFamily || 'Inter',
      logoUrl: settings?.siteLogoUrl ? formatImageUrl(settings.siteLogoUrl) : '/logo.png'
    }}>
      {children}
    </AdminSettingsContext.Provider>
  );
};
