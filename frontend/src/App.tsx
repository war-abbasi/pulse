import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';
import { AuthProvider } from './context/AuthProvider';
import { NotificationsProvider } from './context/NotificationsProvider';
import { ThemeProvider } from './context/ThemeProvider';
import { DashboardPage } from './pages/DashboardPage';
import { EditNotificationPage } from './pages/EditNotificationPage';
import { LoginPage } from './pages/LoginPage';
import { NewNotificationPage } from './pages/NewNotificationPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { RegisterPage } from './pages/RegisterPage';

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        {/*
          AuthProvider wraps NotificationsProvider because the notification
          list depends on who is signed in — it loads on login and clears on
          logout. Both sit above the router so navigating between pages does
          not discard the data.
        */}
        <AuthProvider>
          <NotificationsProvider>
            <Routes>
              <Route element={<AppLayout />}>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                <Route element={<ProtectedRoute />}>
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/notifications/new" element={<NewNotificationPage />} />
                  <Route path="/notifications/:id" element={<EditNotificationPage />} />
                </Route>

                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Routes>
          </NotificationsProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
