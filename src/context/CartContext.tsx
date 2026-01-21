import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useSocketEvent } from '../hooks/useSocketEvent';
import { SOCKET_EVENTS, ProductUpdatedPayload } from '../services/socketEvents.types';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  isInCart: (id: string) => boolean;
}

export const CartContext = createContext<CartContextType | undefined>(undefined);

// Calculate total price of all items
export const calculateTotal = (items: CartItem[]): number => {
  return items.reduce((total, item) => total + item.price * item.quantity, 0);
};

// Get total item count
export const getTotalItems = (items: CartItem[]): number => {
  return items.reduce((count, item) => count + item.quantity, 0);
};

// Find item by ID
export const findItemById = (items: CartItem[], id: string): CartItem | undefined => {
  return items.find(item => item.id === id);
};

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  const addToCart = (item: CartItem) => {
    setItems(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + item.quantity } : i);
      }
      return [...prev, item];
    });
  };

  const removeFromCart = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, quantity } : item));
  };

  const clearCart = () => {
    setItems([]);
  };

  const getCartTotal = () => calculateTotal(items);

  const isInCart = (id: string) => {
    return items.some(item => item.id === id);
  };

  useSocketEvent<ProductUpdatedPayload>(SOCKET_EVENTS.PRODUCT_UPDATED, (payload) => {
    const updatedProduct = payload.data;
    setItems(prevItems => {
      const itemIndex = prevItems.findIndex(item => item.id === updatedProduct._id);
      if (itemIndex > -1) {
        const currentItem = prevItems[itemIndex];
        // Only update if price changed
        if (currentItem.price !== updatedProduct.itemFinalPrice) {
          console.log(`[Cart] Updating price for ${updatedProduct.itemName}: ${currentItem.price} -> ${updatedProduct.itemFinalPrice}`);
          const newItems = [...prevItems];
          newItems[itemIndex] = {
            ...currentItem,
            price: updatedProduct.itemFinalPrice,
            name: updatedProduct.itemName // Update name too just in case
          };
          return newItems;
        }
      }
      return prevItems;
    });
  });

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, getCartTotal, isInCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};
