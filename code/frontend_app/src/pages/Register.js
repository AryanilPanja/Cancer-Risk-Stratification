import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Auth.css';

function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('doctor');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic input validation
    if (!username || !password) {
      alert('Please enter both username and password.');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5001/api/auth/register', { username, password, role });
      console.log('Register success:', response.data);

      alert('✅ Registration successful! You can now log in.');
      navigate('/login');
    } catch (err) {
      console.error('Registration error:', err.response?.data || err.message);
      if (err.response?.status === 400) {
        alert('⚠️ Username already exists or invalid input.');
      } else {
        alert('❌ Error registering user. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <h2>Register</h2>
      <form onSubmit={handleSubmit}>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
          autoComplete="username"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          autoComplete="new-password"
        />
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="doctor">Doctor</option>
          <option value="pathologist">Pathologist</option>
          <option value="admin">Admin</option>
        </select>

        <button type="submit" disabled={loading}>
          {loading ? 'Registering...' : 'Register'}
        </button>
      </form>

      <p>
        Already have an account?{' '}
        <a href="/login" style={{ textDecoration: 'none', color: '#007bff' }}>
          Login
        </a>
      </p>
    </div>
  );
}

export default Register;
