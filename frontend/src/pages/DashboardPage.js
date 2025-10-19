import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/auth/';

const DashboardPage = () => {
    const [profileData, setProfileData] = useState(null);
    const [adminData, setAdminData] = useState(null);
    const [message, setMessage] = useState('');
    const navigate = useNavigate();
    const user = authService.getCurrentUser();

    useEffect(() => {
        const fetchProfile = async () => {
            if (user && user.token) {
                try {
                    const config = {
                        headers: {
                            Authorization: `Bearer ${user.token}`,
                        },
                    };
                    const response = await axios.get(API_URL + 'profile', config);
                    setProfileData(response.data);
                } catch (error) {
                    console.log('Profile fetch failed, using local user data');
                    // Use local user data as fallback
                    setProfileData({
                        _id: user._id,
                        username: user.username,
                        role: user.role,
                        uniqueDoctorIdentifier: user.uniqueDoctorIdentifier
                    });
                }
            }
        };

        const fetchAdminData = async () => {
            if (user && user.token && user.role === 'Admin') {
                try {
                    const config = {
                        headers: {
                            Authorization: `Bearer ${user.token}`,
                        },
                    };
                    const response = await axios.get(API_URL + 'admin-data', config);
                    setAdminData(response.data);
                } catch (error) {
                    setMessage('Failed to fetch admin data.');
                    console.error('Admin data fetch error:', error);
                }
            }
        };

        fetchProfile();
        fetchAdminData();
    }, [user, navigate]);

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    if (!user) {
        return <p>Loading...</p>; // Should be redirected by ProtectedRoute
    }

    return (
        <div>
            <h2>{user.role} Dashboard</h2>
            <button onClick={handleLogout}>Logout</button>
            {message && <p>{message}</p>}

            {profileData && (
                <div>
                    <h3>Welcome, {profileData.username}!</h3>
                    <p>Your Role: {profileData.role}</p>
                    {/* Add more dashboard specific content here based on role */}
                    {profileData.role === 'pathologist' && (
                        <p>This is the pathologist dashboard area. You can upload reports here.</p>
                    )}
                    {profileData.role === 'Doctor' && (
                        <p>This is the doctor dashboard area. You can review reports here.</p>
                    )}
                    {profileData.role === 'Admin' && (
                        <p>This is the admin dashboard area. You can manage users here.</p>
                    )}
                </div>
            )}

            {adminData && (
                <div>
                    <h3>Admin Section:</h3>
                    <p>{adminData.message}</p>
                </div>
            )}
             
            {/* Example image for a dashboard, you can remove or change this */}
            <p>Here's a visual representation for your dashboard:</p>
            

        </div>
    );
};

export default DashboardPage;