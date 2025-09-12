import React from 'react';
import { useAuth } from '../auth/AuthContext';
import './LoginPage.css';

const LoginPage: React.FC = () => {
  const { login } = useAuth();

  const handleLogin = () => {
    // Redirect to Keycloak login page
    login();
  };

  return (
    <div className="d-flex flex-column align-items-center justify-content-center vh-100 bg-light">
      <div className="card shadow p-4 text-center login-card">
        <h1 className="mb-3">MapLibre GL App</h1>
        <p className="mb-4">Please log in to access the application</p>
        <button 
          className="btn btn-primary" 
          onClick={handleLogin}
        >
          Login with Keycloak
        </button>
      </div>
    </div>
  );
};

export default LoginPage;