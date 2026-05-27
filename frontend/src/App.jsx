import {
  BrowserRouter,
  Routes,
  Route
} from 'react-router-dom';

import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
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
            <ProtectedRoute role="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute role="user">
              <UserDashboard />
            </ProtectedRoute>
          }
        />

      </Routes>

    </BrowserRouter>
  );
}

export default App;