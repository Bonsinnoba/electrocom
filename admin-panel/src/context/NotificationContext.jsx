/* @refresh reload */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '../services/api';

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [loading, setLoading] = useState(false);

  const addToast = (text, type = 'info') => {
    const id = Date.now();
    const newToast = { id, text, type };
    setToasts(prev => [...prev, newToast]);
    setTimeout(() => {
      removeToast(id);
    }, 3000);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const fetchServerNotifications = async () => {
    const token = localStorage.getItem('ehub_token');
    if (!token) return;

    try {
        const response = await fetch(`${API_BASE_URL}/get_notifications.php?admin=true&_t=${Date.now()}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.status === 401) {
             // Stop polling if unauthorized
             return false;
        }

        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
            setNotifications(result.data.map(n => ({
                id: n.id,
                text: n.message,
                title: n.title,
                time: n.created_at,
                read: Boolean(parseInt(n.is_read)),
                type: n.type,
                userName: n.user_name
            })));
        }
    } catch (error) {
        console.error("Failed to fetch admin notifications", error);
    }
    return true;
  };

  useEffect(() => {
    // Initial fetch
    fetchServerNotifications();
    
    // Polling setup
    const interval = setInterval(async () => {
        const shouldContinue = await fetchServerNotifications();
        if (shouldContinue === false) {
            clearInterval(interval);
        }
    }, 45000); // Relaxed to 45s

    return () => clearInterval(interval);
  }, []);

  const addNotification = (text, type = 'info') => {
    const newNotif = {
      id: Date.now(),
      text,
      type,
      time: new Date().toISOString(),
      read: false
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const markAsRead = async (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    
    if (typeof id === 'number' && id < 1000000000000) {
        try {
            await fetch(`${API_BASE_URL}/get_notifications.php?action=mark_read`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('ehub_token')}`
                },
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

  const deleteNotification = async (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));

    if (typeof id === 'number' && id < 1000000000000) {
        try {
            await fetch(`${API_BASE_URL}/get_notifications.php?action=delete`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('ehub_token')}`
                },
                body: JSON.stringify({ id })
            });
        } catch (error) {
            console.error("Failed to delete notification on server", error);
        }
    }
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
      clearAllNotifications,
      toasts,
      addToast,
      removeToast
    }}>
      {children}
    </NotificationContext.Provider>
  );
};
