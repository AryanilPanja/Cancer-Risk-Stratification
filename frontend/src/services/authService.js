import axios from 'axios';

const API_URL = 'http://localhost:5000/api/auth/';

const register = async (username, password, role, uniqueDoctorIdentifier) => {
    const response = await axios.post(API_URL + 'register', {
        username,
        password,
        role,
        uniqueDoctorIdentifier
    });
    if (response.data.token) {
        localStorage.setItem('user', JSON.stringify(response.data));
    }
    return response.data;
};

const login = async (username, password) => {
    const response = await axios.post(API_URL + 'login', {
        username,
        password,
    });
    if (response.data.token) {
        localStorage.setItem('user', JSON.stringify(response.data));
    }
    return response.data;
};

const logout = () => {
    localStorage.removeItem('user');
};

const getCurrentUser = () => {
    try {
        const user = localStorage.getItem('user');
        if (!user) {
            return null;
        }
        return JSON.parse(user);
    } catch (error) {
        console.error('Error parsing user data from localStorage:', error);
        // Remove corrupted data
        localStorage.removeItem('user');
        return null;
    }
};

const isTokenValid = () => {
    const user = getCurrentUser();
    if (!user || !user.token) {
        return false;
    }
    
    // If your backend includes token expiration, you can add validation here
    // For now, we'll assume the token is valid if it exists
    return true;
};

const authService = {
    register,
    login,
    logout,
    getCurrentUser,
    isTokenValid,
};

export default authService;