import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';

const LoginPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('pathologist'); // Default role
    // Removed uniqueDoctorIdentifier state
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const userData = await authService.login(username, password);
            
            // Navigate based on user's actual role
            if (userData.role === 'Admin') {
                navigate('/admin-dashboard');
            } else if (userData.role === 'Doctor') {
                navigate('/doctor-dashboard');
            } else if (userData.role === 'pathologist') {
                navigate('/pathologist-dashboard');
            } else {
                // Fallback to general dashboard
                navigate('/dashboard');
            }
        } catch (error) {
            setMessage('Login failed. Please check your credentials.');
            console.error('Login error:', error);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            // Pass undefined for uniqueDoctorIdentifier, backend will handle for Doctors
            await authService.register(username, password, role, undefined);
            setMessage('Registration successful! Please log in.');
        } catch (error) {
            setMessage('Registration failed. Username might exist or invalid data.');
            console.error('Registration error:', error);
        }
    };

    return (
        <div>
            <h2>Login / Register</h2>
            <form onSubmit={handleLogin}>
                <div>
                    <label>Username:</label>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label>Password:</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <button type="submit">Login</button>
            </form>

            <h3>Register New User</h3>
            <form onSubmit={handleRegister}>
                <div>
                    <label>Username:</label>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label>Password:</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label>Role:</label>
                    <select value={role} onChange={(e) => setRole(e.target.value)}>
                        <option value="pathologist">Pathologist</option>
                        <option value="Doctor">Doctor</option>
                        <option value="Admin">Admin</option>
                    </select>
                </div>
                <button type="button" onClick={handleRegister}>Register</button>
            </form>
            {message && <p>{message}</p>}
        </div>
    );
};

export default LoginPage;