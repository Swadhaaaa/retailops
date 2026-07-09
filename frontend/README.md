# QMS Frontend

This is the Vite React frontend for the Query Management System.

## Stack

- React
- Vite
- React Router
- Axios
- Tailwind CSS
- Chart.js
- react-chartjs-2

## Main Files

- `src/App.jsx` - Route definitions for login, user, admin, and department dashboards
- `src/main.jsx` - React app entrypoint
- `src/context/AuthContext.jsx` - Auth provider and login/logout state
- `src/components/shared/ProtectedRoute.jsx` - Role-based route protection
- `src/utils/api.ts` - Axios client pointed at `http://localhost:5000/api`
- `src/pages/LoginPage.jsx` - Login and password reset screen
- `src/pages/UserDashboard.jsx` - User dashboard; Messages is currently disabled by feature flag
- `src/pages/AdminDashboard.jsx` - Admin dashboard; Messages is currently disabled by feature flag
- `src/pages/DepartmentDashboard.jsx` - Department-scoped dashboard
- `src/components/RaiseTicketModal.jsx` - Query creation modal

## Current Notes

- Messages UI is temporarily disabled in both user and admin dashboards with `MESSAGES_FEATURE_ENABLED = false`.
- `src/context/AuthContextBase.jsx` was removed because it duplicated `AuthContext.jsx` and was unused.
- The app uses the root project `README.md` as the main source of truth for full-stack setup, backend APIs, and current project status.

## Commands

```bash
npm install
npm run dev
npm run build
```
