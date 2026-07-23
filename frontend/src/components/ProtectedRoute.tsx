import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loader from './Loader';
import type { Role } from '../types';

/**
 * Route Guard Properties Interface
 */
interface ProtectedRouteProps {
  // Optional list of authorized roles that can load this route layout
  allowedRoles?: Role[];
  // If true, user must have a store associated. Redirect to /create-store if not.
  requireStore?: boolean;
  // If true, user must not have a store associated. Redirect to /manage if they do.
  requireNoStore?: boolean;
}

/**
 * Route Guard Guardrail Component
 * Wrap routes under this element inside App.tsx to restrict access.
 * 
 * 1. Shows a loading indicator if profile state verification is active.
 * 2. Redirects unauthenticated users to `/login`.
 * 3. Enforces Role-Based Access Control: redirects users lacking authority to `/dashboard`.
 * 4. Checks store presence/absence for STORE_ADMIN.
 * 5. Yields access to nested components via react-router-dom `<Outlet />` if checks succeed.
 */
const ProtectedRoute = ({ allowedRoles, requireStore, requireNoStore }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  // 1. Loading state placeholder
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Loader />
      </div>
    );
  }

  // 2. Authentication verify check
  if (!isAuthenticated) {
    const redirectParam = encodeURIComponent(location.pathname + location.search);
    const storeMatch = location.pathname.match(/\/store\/([^/]+)/);
    const loginTarget = storeMatch ? `/store/${storeMatch[1]}/login` : '/login';
    return <Navigate to={`${loginTarget}?redirect=${redirectParam}`} replace />;
  }

  // 3. Authority role verify check
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    if (user.role === 'STORE_ADMIN') {
      return <Navigate to={user.storeId ? "/manage" : "/create-store"} replace />;
    }
    if (user.role === 'CUSTOMER') {
      const slug = user.store?.slug;
      return <Navigate to={slug ? `/store/${slug}/orders` : "/login"} replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  // 4. Store-specific routing checks for STORE_ADMINs
  if (user && user.role === 'STORE_ADMIN') {
    if (requireStore && !user.storeId) {
      return <Navigate to="/create-store" replace />;
    }
    if (requireNoStore && user.storeId) {
      return <Navigate to="/manage" replace />;
    }
  }

  // 5. Render private children routes
  return <Outlet />;
};

export default ProtectedRoute;
