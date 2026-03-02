import React, { createContext, useContext, useState, useEffect } from 'react';
import { useUser } from './UserContext';
import { secureStorage } from '../utils/secureStorage';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { user } = useUser();

  const [notifications, setNotifications] = useState(() => {
    return secureStorage.getItem('notifications', user?.id) || [];
  });

  useEffect(() => {
    secureStorage.setItem('notifications', notifications, user?.id);
  }, [notifications, user?.id]);

  const addNotification = (text, type = 'info') => {
    setNotifications(prev => {
      // Check for existing unread notification with same text and type
      const existingIdx = prev.findIndex(n => !n.read && n.text === text && n.type === type);
      
      if (existingIdx !== -1) {
        // If found, update its time and bring it to top
        const updated = [...prev];
        const item = { ...updated[existingIdx], time: new Date().toISOString() };
        updated.splice(existingIdx, 1);
        return [item, ...updated];
      }

      // Otherwise add new
      const newNotif = {
        id: Date.now(),
        text,
        time: new Date().toISOString(),
        read: false,
        type
      };
      return [newNotif, ...prev];
    });
  };

  const markAsRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, addNotification, markAsRead, markAllAsRead, deleteNotification, clearAllNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
};
