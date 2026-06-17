import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles }) => {

  const token = localStorage.getItem('token');

  const user = JSON.parse(localStorage.getItem('user'));

  // No token → redirect login
  if (!token) {
    return <Navigate to="/" />;
  }

  // Role mismatch
  if (allowedRoles && !allowedRoles.includes(user?.role)) {

    if (user?.role === 'super_admin' || user?.role === 'admin') {
      return <Navigate to="/admin" />;
    } else if (user?.role === 'department') {
      return <Navigate to="/department" />;
    }

    return <Navigate to="/dashboard" />;
  }

  return children;
};

export default ProtectedRoute;
