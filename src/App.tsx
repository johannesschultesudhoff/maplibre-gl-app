
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { SignalRProvider } from './context/SignalRContext';
import { ProtectedRoute, LoginRoute } from './auth/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <SignalRProvider>
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route element={<LoginRoute />}>
              <Route path="/login" element={<LoginPage />} />
            </Route>

          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<HomePage />} />
            {/* Add more protected routes here */}
          </Route>

          {/* Default redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </BrowserRouter>
      </SignalRProvider>
    </AuthProvider>
  );
}

export default App;
