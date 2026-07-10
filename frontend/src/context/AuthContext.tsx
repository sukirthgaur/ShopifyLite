import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import * as authApi from '../api/auth';
import type { User } from '../types';

/**
 * Authentication Context Type definition
 * Describes state attributes and authentication callbacks.
 */
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

// React Context instance initialization
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Authentication Context Provider Component
 * Wraps our entire application (inside App.tsx) to supply auth states and methods.
 */
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // Initialize user profile as null and retrieve auth token from localStorage if present
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);

  // Derived auth state helpers
  const isAuthenticated = !!user && !!token;
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isStoreAdmin = user?.role === 'STORE_ADMIN';

  /**
   * Refreshes the currently authenticated user's profile metadata from the backend.
   * Cleans up local session if fetch fails.
   */
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

  /**
   * Session Initialization Hook
   * Validates stored credentials token with backend on initial load or token changes.
   */
  useEffect(() => {
    const init = async () => {
      if (token) {
        try {
          const res = await authApi.getProfile() as any;
          setUser(res.data);
        } catch {
          // If token verification fails, dump session
          setUser(null);
          setToken(null);
          localStorage.removeItem('token');
        }
      }
      setIsLoading(false);
    };
    init();
  }, [token]);

  /**
   * Executes merchant sign-in.
   * Stores token in localStorage and updates current auth state.
   */
  const login = async (email: string, password: string) => {
    const res = await authApi.login(email, password) as any;
    const { user: userData, token: authToken } = res.data;
    
    localStorage.setItem('token', authToken);
    setToken(authToken);
    setUser(userData);
  };

  /**
   * Registers a new merchant storefront owner and logs them in immediately.
   */
  const register = async (name: string, email: string, password: string) => {
    const res = await authApi.register(name, email, password) as any;
    const { user: userData, token: authToken } = res.data;
    
    localStorage.setItem('token', authToken);
    setToken(authToken);
    setUser(userData);
  };

  /**
   * Destroys current session and redirects to the sign-in page.
   */
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

/**
 * Custom Hook helper to access AuthContext attributes.
 * Throws if context is consumed outside of the <AuthProvider> tree.
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
