import {
  BrowserRouter,
  Navigate,
  Routes,
  Route
} from 'react-router-dom';

import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import DepartmentDashboard from './pages/DepartmentDashboard';
import DepartmentAnalytics from './pages/DepartmentAnalytics';
import UserDashboard from './pages/UserDashboard';

import ProtectedRoute from './components/shared/ProtectedRoute';

function App() {

  return (

    <BrowserRouter>

      <Routes>

        <Route
          path="/"
          element={<LoginPage />}
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/department"
          element={<Navigate to="/department-dashboard" replace />}
        />

        <Route
          path="/department-dashboard"
          element={
            <ProtectedRoute allowedRoles={['department']}>
              <DepartmentDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/department-analytics"
          element={
            <ProtectedRoute allowedRoles={['department']}>
              <DepartmentAnalytics />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={['user']}>
              <UserDashboard />
            </ProtectedRoute>
          }
        />

      </Routes>

    </BrowserRouter>
  );
}

export default App;
