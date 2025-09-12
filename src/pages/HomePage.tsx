import React from 'react';
import { useAuth } from '../auth/AuthContext';
import Map from '../Map';
import './HomePage.css';

const HomePage: React.FC = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="d-flex flex-column vh-100">
      <header className="d-flex justify-content-between align-items-center bg-dark text-white px-4 py-2 header-height">
        <h3 className="m-0">MapLibre GL App</h3>
        <div className="d-flex align-items-center">
          <span className="me-3">Welcome, {user?.firstName || user?.name || 'User'}</span>
          <button 
            className="btn btn-danger btn-sm" 
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </header>
      <div className="map-container">
        <Map />
      </div>
    </div>
  );
};

export default HomePage;