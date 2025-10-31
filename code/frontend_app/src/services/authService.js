import apiClient from './apiClient';

export const authService = {
  login: async (username, password) => {
    const response = await apiClient.post('/auth/login', { username, password });
    return response.data;
  },

  register: async (username, password, role) => {
    const response = await apiClient.post('/auth/register', {
      username,
      password,
      role
    });
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
  }
};
