import { Navigate } from 'react-router-dom';
import { getAdminSession } from '../pages/admin/AdminLogin';

/**
 * Wraps admin-only routes.
 * If there's no valid admin session in localStorage, redirect to /admin.
 */
export default function ProtectedAdminRoute({ children }) {
  const session = getAdminSession();

  const allowedRoles = ['admin', 'barista', 'cashier'];
  if (!session || !allowedRoles.includes(session.role)) {
    return <Navigate to="/admin" replace />;
  }

  return children;
}
