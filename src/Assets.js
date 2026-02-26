import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';

function Assets() {
  const [assets, setAssets] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [newAsset, setNewAsset] = useState({ name: '', type: '', location: '', status: 'Running' });
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
        setNewAsset({ name: '', type: '', location: '', status: 'Running' });
        setShowForm(false);
      }
    }
  };

  return (
    <div className="assets">
      <div className="page-header">
        <h2>Assets</h2>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          + Add Asset
        </button>
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
          </div>
          <button className="btn-primary" onClick={handleAdd}>Save Asset</button>
        </div>
      )}

      {loading ? (
        <p style={{color: '#a8a8b3'}}>Loading assets...</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Asset Name</th>
              <th>Type</th>
              <th>Location</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {assets.map(asset => (
              <tr key={asset.id}>
                <td>{asset.name}</td>
                <td>{asset.type}</td>
                <td>{asset.location}</td>
                <td>
                  <span className={`status-badge ${asset.status.toLowerCase()}`}>
                    {asset.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Assets;
