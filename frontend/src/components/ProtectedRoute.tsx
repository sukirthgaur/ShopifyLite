import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loader from './Loader';
import type { Role } from '../types';

/**
 * Route Guard Properties Interface
 */
interface ProtectedRouteProps {
  // Optional list of authorized roles that can load this route layout
  allowedRoles?: Role[];
}

/**
 * Route Guard Guardrail Component
 * Wrap routes under this element inside App.tsx to restrict access.
 * 
 * 1. Shows a loading indicator if profile state verification is active.
 * 2. Redirects unauthenticated users to `/login`.
 * 3. Enforces Role-Based Access Control: redirects users lacking authority to `/dashboard`.
 * 4. Yields access to nested components via react-router-dom `<Outlet />` if checks succeed.
 */
const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading, user } = useAuth();

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
    return <Navigate to="/login" replace />;
  }

  // 3. Authority role verify check
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  // 4. Render private children routes
  return <Outlet />;
};

export default ProtectedRoute;
