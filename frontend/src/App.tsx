/**
 * App.tsx — Root router with protected routes
 */

import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import { AuthPage } from './pages/AuthPage';
import { ModeSelectorPage } from './pages/ModeSelectorPage';
import { ChatPage } from './pages/ChatPage';
import { DashboardPage } from './pages/DashboardPage';
import { Loader } from './components/common/Loader';
import { useAuthStore } from './store/authStore';

/* ─── Protected route wrapper ─── */
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/auth" replace />;
  return <>{children}</>;
};

const App: React.FC = () => {
  const { isAuthenticated, restoreSession } = useAuthStore();

  // Restore session from localStorage on mount
  useEffect(() => {
    restoreSession();
  }, []);

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        gutter={8}
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1F2937',
            color: '#F9FAFB',
            border: '1px solid rgba(124,58,237,0.2)',
            borderRadius: '12px',
            fontSize: '13px',
          },
        }}
      />

      <AnimatePresence mode="wait">
        <Routes>
          {/* Public */}
          <Route path="/auth" element={<AuthPage />} />

          {/* Protected */}
          <Route
            path="/mode"
            element={
              <ProtectedRoute>
                <ModeSelectorPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <ChatPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          {/* Default redirect */}
          <Route
            path="/"
            element={
              <Navigate to={isAuthenticated ? '/chat' : '/auth'} replace />
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    </BrowserRouter>
  );
};

export default App;
