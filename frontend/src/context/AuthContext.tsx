import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import * as authApi from '../api/auth';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  isStoreAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user && !!token;
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isStoreAdmin = user?.role === 'STORE_ADMIN';

  const refreshProfile = useCallback(async () => {
    try {
      const res = await authApi.getProfile() as any;
      setUser(res.data);
    } catch {
      setUser(null);
      setToken(null);
      localStorage.removeItem('token');
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      if (token) {
        try {
          const res = await authApi.getProfile() as any;
          setUser(res.data);
        } catch {
          setUser(null);
          setToken(null);
          localStorage.removeItem('token');
        }
      }
      setIsLoading(false);
    };
    init();
  }, [token]);

  const login = async (email: string, password: string) => {
    const res = await authApi.login(email, password) as any;
    const { user: userData, token: authToken } = res.data;
    localStorage.setItem('token', authToken);
    setToken(authToken);
    setUser(userData);
  };

  const register = async (name: string, email: string, password: string) => {
    const res = await authApi.register(name, email, password) as any;
    const { user: userData, token: authToken } = res.data;
    localStorage.setItem('token', authToken);
    setToken(authToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setToken(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated,
        isSuperAdmin,
        isStoreAdmin,
        login,
        register,
        logout,
        refreshProfile,
      }}
    >
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
