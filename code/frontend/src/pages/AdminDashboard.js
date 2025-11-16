import React, { useEffect, useState } from 'react';
import API from '../api/api';

function AdminDashboard() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      const res = await API.get('/admin/users');
      setUsers(res.data);
    };
    fetchUsers();
  }, []);

  return (
    <div style={{ textAlign: 'center' }}>
      <h2>Admin Dashboard</h2>
      {users.map((u) => (
        <div key={u._id}>
          <p>{u.username} — {u.role}</p>
        </div>
      ))}
    </div>
  );
}

export default AdminDashboard;
