import axios from 'axios';

const API = axios.create({
  baseURL: '/api',
});

// Automatically attach token if logged in
API.interceptors.request.use((req) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

export default API;
