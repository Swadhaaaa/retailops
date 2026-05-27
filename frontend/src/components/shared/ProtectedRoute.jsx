import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, role }) => {

  const token = localStorage.getItem('token');

  const user = JSON.parse(localStorage.getItem('user'));

  // No token → redirect login
  if (!token) {
    return <Navigate to="/" />;
  }

  // Role mismatch
  if (role && user?.role !== role) {

    if (user?.role === 'admin') {
      return <Navigate to="/admin" />;
    }

    return <Navigate to="/dashboard" />;
  }

  return children;
};

export default ProtectedRoute;