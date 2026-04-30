import { Navigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';

/**
 * Protected route wrapper component
 * Redirects unauthenticated users to /login
 * Optionally restricts access by role
 */
const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, role } = useAuthStore();

  // Check authentication
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check role-based access if specified
  if (requiredRole && role !== requiredRole) {
    // Redirect to their respective dashboard instead of a generic unauthorized page
    const redirectPath = role === 'admin' ? '/dashboard-area/analytics' : '/dashboard-area/dashboard';
    return <Navigate to={redirectPath} replace />;
  }

  return children;
};

export default ProtectedRoute;
