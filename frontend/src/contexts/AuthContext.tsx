import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { authStorage } from '../utils/auth';
import { authApi } from '../api/auth';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated on mount
    const checkAuth = () => {
      setIsLoading(false);
      // Note: In a real app, you might want to validate the token with the backend
      // For now, we just check if tokens exist
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const { user: userData, tokens } = await authApi.login(email, password);
    authStorage.setTokens(tokens);
    setUser(userData);
  };

  const register = async (email: string, password: string) => {
    const { user: userData, tokens } = await authApi.register(email, password);
    authStorage.setTokens(tokens);
    setUser(userData);
  };

  const logout = () => {
    authStorage.clearTokens();
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: authStorage.isAuthenticated(),
    isLoading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
