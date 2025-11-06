import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Home.css';

export const Home = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="home-container">
      <div className="home-hero">
        <h1>🏥 Cancer Risk Stratification System</h1>
        <p className="tagline">
          Intelligent pathology report analysis powered by OCR and LLM
        </p>

        {!isAuthenticated ? (
          <div className="cta-buttons">
            <Link to="/login" className="btn btn-primary">
              Login
            </Link>
            <Link to="/register" className="btn btn-secondary">
              Register
            </Link>
          </div>
        ) : (
          <div className="welcome-section">
            <h2>Welcome, {user?.username}! 👋</h2>
            <p>Role: <strong>{user?.role}</strong></p>
            
            {user?.role === 'pathologist' && (
              <div className="role-card">
                <h3>📋 Pathologist Portal</h3>
                <p>Upload and manage pathology reports for analysis</p>
                <Link to="/upload" className="btn btn-primary">
                  Go to Upload
                </Link>
              </div>
            )}

            {user?.role === 'doctor' && (
              <div className="role-card">
                <h3>📊 Doctor Portal</h3>
                <p>Review and verify analyzed pathology reports</p>
                <Link to="/reports" className="btn btn-primary">
                  View Reports
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="features-section">
        <h2>Key Features</h2>
        <div className="features-grid">
          <div className="feature-card">
            <span className="feature-icon">🔍</span>
            <h3>OCR Technology</h3>
            <p>Automatic text extraction from pathology reports</p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">🤖</span>
            <h3>LLM Analysis</h3>
            <p>Intelligent severity assessment and scoring</p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">💾</span>
            <h3>Secure Storage</h3>
            <p>MongoDB integration for reliable data management</p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">✅</span>
            <h3>Doctor Review</h3>
            <p>Professional verification and final assessment</p>
          </div>
        </div>
      </div>

      <div className="info-section">
        <h2>How It Works</h2>
        <div className="steps">
          <div className="step">
            <div className="step-number">1</div>
            <h4>Upload Report</h4>
            <p>Pathologist uploads a pathology report image or PDF</p>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <h4>Process</h4>
            <p>System performs OCR extraction and LLM analysis</p>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <h4>Store</h4>
            <p>Results stored in MongoDB with patient information</p>
          </div>
          <div className="step">
            <div className="step-number">4</div>
            <h4>Review</h4>
            <p>Doctor reviews and verifies the analysis</p>
          </div>
        </div>
      </div>
    </div>
  );
};
