import React, { useState } from 'react';

function Assets() {
  const [assets, setAssets] = useState([
    { id: 1, name: 'Excavator CAT 390', type: 'Mobile Plant', location: 'Site A', status: 'Running' },
    { id: 2, name: 'Drill Rig DR750', type: 'Drilling Plant', location: 'Site B', status: 'Down' },
    { id: 3, name: 'Crusher Fixed 01', type: 'Fixed Plant', location: 'Site A', status: 'Running' },
    { id: 4, name: 'Angle Grinder 04', type: 'Small Machinery', location: 'Workshop', status: 'Maintenance' },
  ]);

  const [showForm, setShowForm] = useState(false);
  const [newAsset, setNewAsset] = useState({ name: '', type: '', location: '', status: 'Running' });

  const handleAdd = () => {
    if (newAsset.name && newAsset.type && newAsset.location) {
      setAssets([...assets, { ...newAsset, id: assets.length + 1 }]);
      setNewAsset({ name: '', type: '', location: '', status: 'Running' });
      setShowForm(false);
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
    </div>
  );
}

export default Assets;