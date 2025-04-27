// components/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';

const ProtectedRoutes = ({ permissionKey, permissions, children }) => {
  if (!permissions?.actions?.[permissionKey]) {
    return <Navigate to="/admin/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoutes;
