// ============================================================
// FILE 17: frontend/src/context/AuthContext.js
// إدارة الحالة العامة - المستخدم والسلة
// ============================================================

import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [cart, setCart]       = useState([]);
  const [wishlist, setWishlist] = useState([]);

  useEffect(() => {
    loadUser();
    loadCart();
  }, []);

  // =================== AUTH ===================

  const loadUser = async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (token) {
        const { user } = await api.auth.me();
        setUser(user);
      }
    } catch (err) {
      console.log('Token expired, logging out');
      await AsyncStorage.removeItem('auth_token');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email, password) => {
    const { user, token } = await api.auth.login(email, password);
    await AsyncStorage.setItem('auth_token', token);
    setUser(user);
    return user;
  };

  const register = async (userData) => {
    const { user, token } = await api.auth.register(userData);
    await AsyncStorage.setItem('auth_token', token);
    setUser(user);
    return user;
  };

  const logout = async () => {
    await AsyncStorage.multiRemove(['auth_token', 'cart']);
    setUser(null);
    setCart([]);
  };

  const updateUser = (updatedUser) => setUser(prev => ({ ...prev, ...updatedUser }));

  // =================== CART ===================

  const loadCart = async () => {
    try {
      const saved = await AsyncStorage.getItem('cart');
      if (saved) setCart(JSON.parse(saved));
    } catch {}
  };

  const saveCart = async (newCart) => {
    setCart(newCart);
    await AsyncStorage.setItem('cart', JSON.stringify(newCart));
  };

  const addToCart = async (product, quantity = 1) => {
    const existing = cart.find(i => i.product.id === product.id);
    let newCart;
    if (existing) {
      newCart = cart.map(i =>
        i.product.id === product.id
          ? { ...i, quantity: i.quantity + quantity }
          : i
      );
    } else {
      newCart = [...cart, { product, quantity }];
    }
    await saveCart(newCart);
  };

  const removeFromCart = async (productId) => {
    await saveCart(cart.filter(i => i.product.id !== productId));
  };

  const updateCartQuantity = async (productId, quantity) => {
    if (quantity <= 0) return removeFromCart(productId);
    await saveCart(cart.map(i =>
      i.product.id === productId ? { ...i, quantity } : i
    ));
  };

  const clearCart = async () => {
    setCart([]);
    await AsyncStorage.removeItem('cart');
  };

  const isInCart = (productId) => cart.some(i => i.product.id === productId);

  const cartTotal = cart.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  // =================== WISHLIST ===================

  const toggleWishlist = (product) => {
    const exists = wishlist.some(p => p.id === product.id);
    if (exists) {
      setWishlist(wishlist.filter(p => p.id !== product.id));
    } else {
      setWishlist([...wishlist, product]);
    }
  };

  const isWishlisted = (productId) => wishlist.some(p => p.id === productId);

  return (
    <AuthContext.Provider value={{
      // Auth
      user, isLoading, login, register, logout, updateUser,
      // Cart
      cart, cartTotal, cartCount,
      addToCart, removeFromCart, updateCartQuantity, clearCart, isInCart,
      // Wishlist
      wishlist, toggleWishlist, isWishlisted,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook مخصص
export const useAuth = () => useContext(AuthContext);
