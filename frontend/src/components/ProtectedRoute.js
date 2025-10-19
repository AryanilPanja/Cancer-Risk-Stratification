import React from 'react';
import { Navigate } from 'react-router-dom';
import authService from '../services/authService';

const ProtectedRoute = ({ children, roles }) => {
    let user;
    
    try {
        user = authService.getCurrentUser();
    } catch (error) {
        console.error('Error getting current user:', error);
        user = null;
    }

    // Check if user exists and has valid token
    if (!user || !user.token || !authService.isTokenValid()) {
        // Not logged in or invalid user data, redirect to login page
        return <Navigate to="/login" replace />;
    }

    // Check role-based access
    if (roles && roles.length > 0) {
        // Ensure user has a role property
        if (!user.role) {
            console.warn('User object missing role property');
            return <Navigate to="/login" replace />;
        }
        
        // Check if user's role is in the allowed roles
        if (!roles.includes(user.role)) {
            // Not authorized for this route, redirect to dashboard
            return <Navigate to="/dashboard" replace />;
        }
    }

    return children;
};

export default ProtectedRoute;