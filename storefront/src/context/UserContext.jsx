import React, { createContext, useContext, useState, useEffect } from 'react';
import { logoutUser } from '../services/api';
import { secureStorage } from '../utils/secureStorage';

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
    return secureStorage.getItem('user', 'shared'); // Meta info can be shared across sessions
  });

  useEffect(() => {
    if (user) {
        secureStorage.setItem('user', user, 'shared');
    } else {
        secureStorage.removeItem('user', 'shared');
    }
  }, [user]);

  const updateUser = (newData) => {
    setUser(prev => ({ ...prev, ...newData }));
  };

  const logout = async () => {
    setUser(null);
    await logoutUser();
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
