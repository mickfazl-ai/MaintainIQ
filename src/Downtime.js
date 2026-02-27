import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';

function Downtime({ userRole }) {
  const [downtimes, setDowntimes] = useState([]);
  const [assets, setAssets] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newDowntime, setNewDowntime] = useState({
    asset: '', date: '', start_time: '', end_time: '', category: '', description: '', reported_by: ''
  });

  useEffect(() => {
    fetchDowntimes();
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    const { data } = await supabase.from('assets').select('name, hourly_rate');
    setAssets(data || []);
  };

  const fetchDowntimes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('downtime')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      console.log('Error:', error);
    } else {
      setDowntimes(data);
    }
    setLoading(false);
  };

  const handleAdd = async () => {
    if (newDowntime.asset && newDowntime.date && newDowntime.description) {
      const start = new Date(`2000/01/01 ${newDowntime.start_time}`);
      const end = new Date(`2000/01/01 ${newDowntime.end_time}`);
      const hours = ((end - start) / 3600000).toFixed(1);
      const assetData = assets.find(a => a.name === newDowntime.asset);
      const cost = assetData?.hourly_rate ? (parseFloat(hours) * parseFloat(assetData.hourly_rate)).toFixed(2) : 0;
      const { error } = await supabase
        .from('downtime')
        .insert([{ ...newDowntime, hours, cost }]);
      if (error) {
        alert('Error: ' + error.message);
      } else {
        fetchDowntimes();
        setNewDowntime({ asset: '', date: '', start_time: '', end_time: '', category: '', description: '', reported_by: '' });
        setShowForm(false);
      }
    }
  };
const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this downtime record?')) {
      const { error } = await supabase
        .from('downtime')
        .delete()
        .eq('id', id);
      if (error) {
        alert('Error: ' + error.message);
      } else {
        fetchDowntimes();
      }
    }
  };
  const totalCost = downtimes.reduce((sum, d) => sum + parseFloat(d.cost || 0), 0);

  return (
    <div className="downtime">
      <div className="page-header">
        <h2>Downtime Log</h2>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          + Log Downtime
        </button>
      </div>

      <div className="cost-banner">
        <span>Total Downtime Cost:</span>
        <span className="cost-total">${totalCost.toLocaleString('en-AU', {minimumFractionDigits: 2})}</span>
      </div>

      {showForm && (
        <div className="form-card">
          <h3>Log New Downtime Event</h3>
          <div className="form-grid">
            <select value={newDowntime.asset}
              onChange={e => setNewDowntime({...newDowntime, asset: e.target.value})}>
              <option value="">Select Asset</option>
              {assets.map(a => (
                <option key={a.name} value={a.name}>{a.name}</option>
              ))}
            </select>
            <input type="date" value={newDowntime.date}
              onChange={e => setNewDowntime({...newDowntime, date: e.target.value})} />
            <input type="time" value={newDowntime.start_time}
              onChange={e => setNewDowntime({...newDowntime, start_time: e.target.value})} />
            <input type="time" value={newDowntime.end_time}
              onChange={e => setNewDowntime({...newDowntime, end_time: e.target.value})} />
            <select value={newDowntime.category}
              onChange={e => setNewDowntime({...newDowntime, category: e.target.value})}>
              <option value="">Fault Category</option>
              <option>Mechanical</option>
              <option>Electrical</option>
              <option>Operator Error</option>
              <option>Scheduled</option>
              <option>Environmental</option>
              <option>Other</option>
            </select>
            <input placeholder="Reported By" value={newDowntime.reported_by}
              onChange={e => setNewDowntime({...newDowntime, reported_by: e.target.value})} />
          </div>
          <textarea
            placeholder="Fault Description"
            value={newDowntime.description}
            onChange={e => setNewDowntime({...newDowntime, description: e.target.value})}
            style={{width:'100%', padding:'10px', borderRadius:'4px', border:'1px solid #1a2f2f', backgroundColor:'#0a0f0f', color:'white', marginBottom:'15px', fontSize:'14px', minHeight:'80px', fontFamily:'Barlow, sans-serif'}}
          />
          <button className="btn-primary" onClick={handleAdd}>Save Downtime</button>
        </div>
      )}

      {loading ? (
        <p style={{color: '#a0b0b0'}}>Loading downtime records...</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Asset</th>
              <th>Date</th>
              <th>Start</th>
              <th>End</th>
              <th>Hours Down</th>
              <th>Cost</th>
              <th>Category</th>
              <th>Description</th>
              <th>Reported By</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {downtimes.map(d => (
              <tr key={d.id}>
                <td>{d.asset}</td>
                <td>{d.date}</td>
                <td>{d.start_time}</td>
                <td>{d.end_time}</td>
                <td><span className="hours-badge">{d.hours}h</span></td>
                <td><span className="cost-badge">${parseFloat(d.cost || 0).toLocaleString('en-AU', {minimumFractionDigits: 2})}</span></td>
                <td><span className="category-badge">{d.category}</span></td>
                <td>{d.description}</td>
                <td>{d.reported_by}</td>
                <td>
                  <button className="btn-delete" onClick={() => handleDelete(d.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Downtime;