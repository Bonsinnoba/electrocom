import React, { createContext, useContext, useState, useEffect } from 'react';

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchServerNotifications = async () => {
    try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/get_notifications.php?admin=true&_t=${Date.now()}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('ehub_token')}`
            }
        });
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
  };

  useEffect(() => {
    fetchServerNotifications();
    const interval = setInterval(fetchServerNotifications, 30000); // 30s poll
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
            await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/get_notifications.php?action=mark_read`, {
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
