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

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchServerNotifications = async () => {
    if (!user) return;
    try {
      const response = await fetch('/api/get_notifications.php');
      const result = await response.json();
      if (result.success) {
        // Map server notifications to local format
        const mapped = result.data.map(n => ({
          id: n.id,
          text: n.message,
          title: n.title,
          time: n.created_at,
          read: Boolean(parseInt(n.is_read)),
          type: n.type
        }));
        setNotifications(mapped);
      }
    } catch (error) {
      console.error("Failed to fetch notifications", error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchServerNotifications();
      const interval = setInterval(fetchServerNotifications, 30000); // 30s poll
      return () => clearInterval(interval);
    } else {
      setNotifications([]);
    }
  }, [user]);

  const addNotification = (text, type = 'info') => {
    // This adds a temporary local notification, usually for UI actions
    // Real persistent notifications from the server will be fetched next poll
    const newNotif = {
      id: Date.now(),
      text,
      time: new Date().toISOString(),
      read: false,
      type
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const markAsRead = async (id) => {
    // Optimistic update
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    
    // Server update if it's a persistent ID
    if (typeof id === 'number' && id < 1000000000000) { // Simple check for non-timestamp ID
        try {
            await fetch('/api/get_notifications.php?action=mark_read', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
        } catch (error) {
            console.error("Failed to mark notification as read on server", error);
        }
    }
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => {
        if (!n.read) markAsRead(n.id);
        return { ...n, read: true };
    }));
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
