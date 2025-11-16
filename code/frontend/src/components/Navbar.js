import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

export const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <span className="brand-icon">🏥</span>
          Cancer Risk Stratification
        </Link>

        <div className="navbar-menu">
          {isAuthenticated ? (
            <>
              <span className="user-info">
                👤 {user?.username} ({user?.role})
              </span>
              {user?.role === 'pathologist' && (
                <Link to="/upload" className="nav-link">
                  Upload Report
                </Link>
              )}
              {user?.role === 'doctor' && (
                <Link to="/reports" className="nav-link">
                  View Reports
                </Link>
              )}
              <button onClick={handleLogout} className="logout-btn">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">
                Login
              </Link>
              <Link to="/register" className="nav-link">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};
