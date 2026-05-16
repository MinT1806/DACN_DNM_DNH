import React, { createContext, useContext, useState } from 'react';
import { authAPI } from '../api/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(false);

  const login = async (credentials) => {
    setLoading(true);
    try {
      const { data: responseData } = await authAPI.login(credentials);
      const authData = responseData.data; // AuthResponse is wrapped in responseData.data
      localStorage.setItem('token', authData.token);
      localStorage.setItem('user', JSON.stringify(authData));
      setUser(authData);
      return authData;
    } finally {
      setLoading(false);
    }
  };

  // Handle social login (Google/Facebook callback)
  const handleSocialLogin = (data) => {
    const authData = data.data || data; // Support both wrapped and unwrapped responses
    localStorage.setItem('token', authData.token);
    localStorage.setItem('user', JSON.stringify(authData));
    setUser(authData);
  };

  const register = async (userData) => {
    setLoading(true);
    try {
      const { data } = await authAPI.register(userData);
      return data;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, handleSocialLogin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
