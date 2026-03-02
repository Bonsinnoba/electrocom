import React, { createContext, useContext, useState, useEffect } from 'react';

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem('ehub_admin_notifications');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('ehub_admin_notifications', JSON.stringify(notifications));
  }, [notifications]);

  const addNotification = (text, type = 'info') => {
    setNotifications(prev => {
      // Deduplication logic
      const existingIndex = prev.findIndex(n => n.text === text && n.type === type && !n.read);
      
      if (existingIndex !== -1) {
        const updated = [...prev];
        const existing = updated[existingIndex];
        // Move to top and update time
        updated.splice(existingIndex, 1);
        return [{ ...existing, time: new Date().toISOString() }, ...updated];
      }

      const newNotif = {
        id: Date.now(),
        text,
        type,
        time: new Date().toISOString(),
        read: false
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
    <NotificationContext.Provider value={{ 
      notifications, 
      unreadCount, 
      addNotification, 
      markAsRead, 
      markAllAsRead, 
      deleteNotification, 
      clearAllNotifications 
    }}>
      {children}
    </NotificationContext.Provider>
  );
};
