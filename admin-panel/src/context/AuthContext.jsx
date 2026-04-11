/* @refresh reload */
import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = () => {
    const savedToken = localStorage.getItem('ehub_token');
    const savedUser = localStorage.getItem('ehub_user');
    
    if (savedToken && savedUser) {
      setToken(savedToken);
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        setUser(null);
      }
    } else {
      setToken(null);
      setUser(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    checkAuth();
    
    const handleStorage = () => checkAuth();
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const login = (newToken, newUser) => {
    try {
        localStorage.setItem('ehub_token', newToken);
        
        // Minimize user data to avoid QuotaExceededError
        const minimizedUser = { ...newUser };
        if (minimizedUser.profileImage && minimizedUser.profileImage.length > 50000) {
            console.warn('Profile image too large for localStorage, omitting.');
            delete minimizedUser.profileImage;
        }
        
        localStorage.setItem('ehub_user', JSON.stringify(minimizedUser));
        setToken(newToken);
        setUser(newUser); // Keep full object in memory
    } catch (e) {
        console.error('Failed to save auth to localStorage:', e);
        // If it still fails, clear everything and try to save AT LEAST the token
        if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
            localStorage.clear();
            try {
                localStorage.setItem('ehub_token', newToken);
            } catch (e2) {
                console.error('CRITICAL: Failed to save token even after clear:', e2);
            }
        }
    }
  };

  const logout = () => {
    localStorage.removeItem('ehub_token');
    localStorage.removeItem('ehub_user');
    localStorage.setItem('admin_theme', 'blue');
    window.dispatchEvent(new Event('themeChange'));
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!token, login, logout, loading, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};
