import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import * as authApi from '../api/auth';
import type { User, Role } from '../types';

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
  isCustomer: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string, role?: string) => Promise<User>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  actingStoreId: string | null;
  setActingStoreId: (storeId: string | null) => void;
  originalRole: Role | null;
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

  // Store acting ID in state and local storage
  const [actingStoreId, setActingStoreIdState] = useState<string | null>(localStorage.getItem('actingStoreId'));

  const setActingStoreId = (storeId: string | null) => {
    if (storeId) {
      localStorage.setItem('actingStoreId', storeId);
    } else {
      localStorage.removeItem('actingStoreId');
    }
    setActingStoreIdState(storeId);
  };

  const originalRole = user?.role || null;

  // Derive effective user context if acting as a store
  const effectiveUser = user && actingStoreId && user.role === 'SUPER_ADMIN' ? {
    ...user,
    role: 'STORE_ADMIN' as const,
    storeId: actingStoreId,
  } : user;

  // Derived auth state helpers
  const isAuthenticated = !!effectiveUser && !!token;
  const isSuperAdmin = effectiveUser?.role === 'SUPER_ADMIN';
  const isStoreAdmin = effectiveUser?.role === 'STORE_ADMIN';
  const isCustomer = effectiveUser?.role === 'CUSTOMER';

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
      localStorage.removeItem('actingStoreId');
      setActingStoreIdState(null);
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
          localStorage.removeItem('actingStoreId');
          setActingStoreIdState(null);
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
    return userData;
  };

  /**
   * Registers a new merchant storefront owner and logs them in immediately.
   */
  const register = async (name: string, email: string, password: string, role?: string) => {
    const res = await authApi.register(name, email, password, role) as any;
    const { user: userData, token: authToken } = res.data;
    
    localStorage.setItem('token', authToken);
    setToken(authToken);
    setUser(userData);
    return userData;
  };

  /**
   * Destroys current session and redirects to the sign-in page.
   */
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('actingStoreId');
    setUser(null);
    setToken(null);
    setActingStoreIdState(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider
      value={{
        user: effectiveUser,
        token,
        isLoading,
        isAuthenticated,
        isSuperAdmin,
        isStoreAdmin,
        isCustomer,
        login,
        register,
        logout,
        refreshProfile,
        actingStoreId,
        setActingStoreId,
        originalRole,
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
