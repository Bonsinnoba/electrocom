import React, { createContext, useContext, useState, useEffect } from 'react';
import { useUser } from './UserContext';
import { secureStorage } from '../utils/secureStorage';

const WishlistContext = createContext();

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};

export const WishlistProvider = ({ children }) => {
  const { user } = useUser();

  const [wishlistItems, setWishlistItems] = useState(() => {
    return secureStorage.getItem('wishlist', user?.id) || [];
  });

  useEffect(() => {
    secureStorage.setItem('wishlist', wishlistItems, user?.id);
  }, [wishlistItems, user?.id]);

  const toggleWishlist = (product) => {
    setWishlistItems(prev => {
      const isAlreadyIn = prev.some(item => item.id === product.id);
      if (isAlreadyIn) {
        return prev.filter(item => item.id !== product.id);
      }
      return [...prev, product];
    });
  };

  const isInWishlist = (productId) => {
    return wishlistItems.some(item => item.id === productId);
  };

  const clearWishlist = () => setWishlistItems([]);

  return (
    <WishlistContext.Provider value={{ wishlistItems, toggleWishlist, isInWishlist, clearWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
};
