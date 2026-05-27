import {
  BrowserRouter,
  Routes,
  Route
} from 'react-router-dom';

import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import UserDashboard from './pages/UserDashboard';

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
          element={<AdminDashboard />}
        />

        <Route
          path="/user"
          element={<UserDashboard />}
        />

      </Routes>

    </BrowserRouter>
  );
}

export default App;