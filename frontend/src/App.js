import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProtectedRoute from './components/ProtectedRoute';
import authService from './services/authService';

function App() {
    const user = authService.getCurrentUser();

    return (
        <Router>
            <nav>
                <Link to="/">Home</Link> |{' '}
                {user ? (
                    <Link to="/dashboard">Dashboard</Link>
                ) : (
                    <Link to="/login">Login</Link>
                )}
            </nav>
            <Routes>
                <Route path="/" element={<h2>Welcome to the Medical Report System!</h2>} />
                <Route path="/login" element={<LoginPage />} />
                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>
                            <DashboardPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/pathologist-dashboard"
                    element={
                        <ProtectedRoute roles={['pathologist', 'Admin']}>
                            <DashboardPage /> {/* Could be a dedicated page later */}
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/doctor-dashboard"
                    element={
                        <ProtectedRoute roles={['Doctor', 'Admin']}>
                            <DashboardPage /> {/* Could be a dedicated page later */}
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/admin-dashboard"
                    element={
                        <ProtectedRoute roles={['Admin']}>
                            <DashboardPage /> {/* Could be a dedicated page later */}
                        </ProtectedRoute>
                    }
                />
                {/* Fallback route for unmatched paths */}
                <Route path="*" element={<h2>404 Not Found</h2>} />
            </Routes>
        </Router>
    );
}

export default App;