import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';

interface ProtectedRouteProps {
  redirectPath?: string;
}

/**
 * ProtectedRoute component that redirects to login if not authenticated
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  redirectPath = '/login',
}) => {
  const { authenticated, initialized } = useAuth();

  // If auth not initialized yet, you could show a loading screen
  if (!initialized) {
    return <div>Loading authentication...</div>;
  }

  // If not authenticated, redirect to the specified path
  if (!authenticated) {
    return <Navigate to={redirectPath} replace />;
  }

  // If authenticated, render the child routes
  return <Outlet />;
};

/**
 * LoginRoute component that redirects to home if already authenticated
 */
export const LoginRoute: React.FC<ProtectedRouteProps> = ({
  redirectPath = '/',
}) => {
  const { authenticated, initialized } = useAuth();

  // If auth not initialized yet, you could show a loading screen
  if (!initialized) {
    return <div>Loading authentication...</div>;
  }

  // If already authenticated, redirect to the specified path
  if (authenticated) {
    return <Navigate to={redirectPath} replace />;
  }

  // If not authenticated, render the login page
  return <Outlet />;
};