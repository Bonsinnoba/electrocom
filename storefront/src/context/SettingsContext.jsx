import React, { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext();

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('ehub_settings_v2');
    return saved ? JSON.parse(saved) : {
      emailNotif: true,
      pushNotif: true,
      twoFactor: false,
      orderTracking: true,
      currency: 'GHS',
      language: 'English (UK)',
      currencySymbol: 'GH₵',
      currencyRate: 1
    };
  });

  useEffect(() => {
    localStorage.setItem('ehub_settings_v2', JSON.stringify(settings));
  }, [settings]);

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const updateCurrency = (currency) => {
    const symbols = { 'GHS': 'GH₵', 'USD': '$', 'EUR': '€', 'GBP': '£' };
    const rates = { 'GHS': 1, 'USD': 0.083, 'EUR': 0.077, 'GBP': 0.065 }; // Simple mock rates
    setSettings(prev => ({
      ...prev,
      currency,
      currencySymbol: symbols[currency] || '$',
      currencyRate: rates[currency] || 1
    }));
  };

  const formatPrice = (price) => {
    const converted = (price * settings.currencyRate).toFixed(2);
    return `${settings.currencySymbol}${converted}`;
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSetting, updateCurrency, formatPrice }}>
      {children}
    </SettingsContext.Provider>
  );
};
