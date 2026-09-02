import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

/**
 * Gate for authenticated routes. This is a UX guard, not a security boundary —
 * the API independently verifies the JWT on every request, which is what
 * actually protects the data.
 */
export function ProtectedRoute() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    // replace: true keeps the protected URL out of history, so "back" after
    // logging in does not bounce through the redirect again. Remembering the
    // location lets us return the user where they were headed.
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
