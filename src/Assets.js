import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';

function Assets({ userRole }) {
  const [assets, setAssets] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [newAsset, setNewAsset] = useState({ name: '', type: '', location: '', status: 'Running', hourly_rate: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      console.log('Error fetching assets:', error);
    } else {
      setAssets(data);
    }
    setLoading(false);
  };

  const handleAdd = async () => {
    if (newAsset.name && newAsset.type && newAsset.location) {
      const { error } = await supabase
        .from('assets')
        .insert([newAsset]);
      if (error) {
        alert('Error: ' + error.message);
      } else {
        fetchAssets();
        setNewAsset({ name: '', type: '', location: '', status: 'Running', hourly_rate: '' });
        setShowForm(false);
      }
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete ${name}?`)) {
      const { error } = await supabase
        .from('assets')
        .delete()
        .eq('id', id);
      if (error) {
        alert('Error: ' + error.message);
      } else {
        fetchAssets();
      }
    }
  };

  return (
    <div className="assets">
      <div className="page-header">
        <h2>Assets</h2>
        {userRole?.role !== 'technician' && (
          <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
            + Add Asset
          </button>
        )}
      </div>

      {showForm && (
        <div className="form-card">
          <h3>Register New Asset</h3>
          <div className="form-grid">
            <input placeholder="Asset Name" value={newAsset.name}
              onChange={e => setNewAsset({...newAsset, name: e.target.value})} />
            <select value={newAsset.type}
              onChange={e => setNewAsset({...newAsset, type: e.target.value})}>
              <option value="">Select Type</option>
              <option>Mobile Plant</option>
              <option>Fixed Plant</option>
              <option>Drilling Plant</option>
              <option>Small Machinery</option>
            </select>
            <input placeholder="Location / Site" value={newAsset.location}
              onChange={e => setNewAsset({...newAsset, location: e.target.value})} />
            <select value={newAsset.status}
              onChange={e => setNewAsset({...newAsset, status: e.target.value})}>
              <option>Running</option>
              <option>Down</option>
              <option>Maintenance</option>
            </select>
            <input
              placeholder="Hourly Rate ($/hr)"
              type="number"
              value={newAsset.hourly_rate}
              onChange={e => setNewAsset({...newAsset, hourly_rate: e.target.value})}
            />
          </div>
          <button className="btn-primary" onClick={handleAdd}>Save Asset</button>
        </div>
      )}

      {loading ? (
        <p style={{color: '#a0b0b0'}}>Loading assets...</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Asset Name</th>
              <th>Type</th>
              <th>Location</th>
              <th>Hourly Rate</th>
              <th>Status</th>
              {userRole?.role !== 'technician' && <th>Action</th>}
            </tr>
          </thead>
          <tbody>
            {assets.map(asset => (
              <tr key={asset.id}>
                <td>{asset.name}</td>
                <td>{asset.type}</td>
                <td>{asset.location}</td>
                <td>{asset.hourly_rate ? `$${asset.hourly_rate}/hr` : '-'}</td>
                <td>
                  <span className={`status-badge ${asset.status.toLowerCase()}`}>
                    {asset.status}
                  </span>
                </td>
                {userRole?.role !== 'technician' && (
                  <td>
                    <button className="btn-delete" onClick={() => handleDelete(asset.id, asset.name)}>
                      Delete
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Assets;