import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api, getAccessToken, setTokens, clearTokens, getActiveTenantId, setActiveTenantId as storeTenantId } from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  activeTenantId: string | null;
  setActiveTenant: (id: string | null) => void;
  login: (access: string, refresh: string, user: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTenantId, setActiveTenantState] = useState<string | null>(getActiveTenantId());

  const setActiveTenant = (id: string | null) => {
    storeTenantId(id);
    setActiveTenantState(id);
  };

  const refreshUser = async () => {
    try {
      const data = await api.me();
      setUser(data);
      if (data.client && !activeTenantId) {
        setActiveTenant(String(data.client));
      }
    } catch {
      setUser(null);
      clearTokens();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = getAccessToken();
    if (token) {
      refreshUser();
    } else {
      setLoading(false);
    }

    const handleLogout = () => {
      setUser(null);
      setActiveTenant(null);
    };

    window.addEventListener('bitbyte-auth-logout', handleLogout);
    return () => window.removeEventListener('bitbyte-auth-logout', handleLogout);
  }, []);

  const login = (access: string, refresh: string, userData: User) => {
    setTokens(access, refresh);
    setUser(userData);
    if (userData.client) {
      setActiveTenant(String(userData.client));
    }
  };

  const logout = () => {
    clearTokens();
    setUser(null);
    setActiveTenant(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, activeTenantId, setActiveTenant, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
