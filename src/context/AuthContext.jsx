import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminToken, setAdminToken] = useState(null);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

  useEffect(() => {
    const savedToken = localStorage.getItem('ganesh_admin_token');
    if (savedToken) {
      setAdminToken(savedToken);
      setIsAdmin(true);
    }
  }, []);

  const login = async (pin) => {
    try {
      const data = await api.adminLogin(pin);
      if (data.success) {
        localStorage.setItem('ganesh_admin_token', data.token);
        setAdminToken(data.token);
        setIsAdmin(true);
        setIsAdminModalOpen(false);
        return { success: true };
      }
    } catch (err) {
      return { success: false, error: err.message || 'Invalid PIN' };
    }
  };

  const logout = () => {
    localStorage.removeItem('ganesh_admin_token');
    setAdminToken(null);
    setIsAdmin(false);
  };

  return (
    <AuthContext.Provider
      value={{
        isAdmin,
        adminToken,
        isAdminModalOpen,
        setIsAdminModalOpen,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
