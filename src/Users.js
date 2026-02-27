import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';

function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('user_roles')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      console.log('Error:', error);
    } else {
      setUsers(data);
    }
    setLoading(false);
  };

  const handleRoleChange = async (id, newRole) => {
    const { error } = await supabase
      .from('user_roles')
      .update({ role: newRole })
      .eq('id', id);
    if (error) {
      alert('Error updating role: ' + error.message);
    } else {
      fetchUsers();
    }
  };

  return (
    <div className="users">
      <div className="page-header">
        <h2>User Management</h2>
      </div>

      {loading ? (
        <p style={{color: '#a0b0b0'}}>Loading users...</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>
                  <select
                    value={user.role}
                    onChange={e => handleRoleChange(user.id, e.target.value)}
                    style={{backgroundColor:'#0a0f0f', color:'white', border:'1px solid #1a2f2f', padding:'5px 10px', borderRadius:'4px'}}
                  >
                    <option value="technician">Technician</option>
                    <option value="supervisor">Supervisor</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td>{new Date(user.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Users;