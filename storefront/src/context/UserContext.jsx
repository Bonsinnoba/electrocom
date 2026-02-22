import React, { createContext, useContext, useState, useEffect } from 'react';

const UserContext = createContext();

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('ehub_user');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (user) {
        localStorage.setItem('ehub_user', JSON.stringify(user));
    } else {
        localStorage.removeItem('ehub_user');
    }
  }, [user]);

  const updateUser = (newData) => {
    setUser(prev => ({ ...prev, ...newData }));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('ehub_user');
    localStorage.removeItem('ehub_token');
  };

  const resetUser = () => {
    setUser(prev => {
        if (!prev) return null; // If not logged in, remain logged out
        return {
            ...prev,
            name: 'Guest User', 
            address: '', 
            profileImage: null,
            avatar: 'G'
        };
    });
  };

  return (
    <UserContext.Provider value={{ user, updateUser, resetUser, logout }}>
      {children}
    </UserContext.Provider>
  );
};
