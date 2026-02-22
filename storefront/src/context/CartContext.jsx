import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    const savedCart = localStorage.getItem('ehub_cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  useEffect(() => {
    localStorage.setItem('ehub_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product, quantity = 1, color = 'Default') => {
    setCartItems(prev => {
      const existingItemIndex = prev.findIndex(
        item => item.id === product.id && item.selectedColor === color
      );

      if (existingItemIndex > -1) {
        const updatedItems = [...prev];
        updatedItems[existingItemIndex].quantity += quantity;
        return updatedItems;
      }

      return [...prev, { ...product, quantity, selectedColor: color }];
    });
  };

  const removeFromCart = (itemId, color) => {
    setCartItems(prev => prev.filter(item => !(item.id === itemId && item.selectedColor === color)));
  };

  const updateQuantity = (itemId, color, delta) => {
    setCartItems(prev => {
      return prev.map(item => {
        if (item.id === itemId && item.selectedColor === color) {
          const newQty = Math.max(1, item.quantity + delta);
          return { ...item, quantity: newQty };
        }
        return item;
      });
    });
  };

  const clearCart = () => setCartItems([]);

  const subtotal = cartItems.reduce((acc, item) => acc + (parseFloat(item.price) * item.quantity), 0);
  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <CartContext.Provider value={{ 
      cartItems, 
      addToCart, 
      removeFromCart, 
      updateQuantity, 
      clearCart,
      subtotal,
      cartCount
    }}>
      {children}
    </CartContext.Provider>
  );
};
