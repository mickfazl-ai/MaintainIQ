import React, { useState } from 'react';

function Downtime() {
  const [downtimes, setDowntimes] = useState([
    { id: 1, asset: 'Drill Rig DR750', date: '26/02/2026', startTime: '08:00', endTime: '11:30', hours: 3.5, category: 'Mechanical', description: 'Hydraulic hose failure', reportedBy: 'John S' },
    { id: 2, asset: 'Excavator CAT 390', date: '25/02/2026', startTime: '13:00', endTime: '14:00', hours: 1, category: 'Electrical', description: 'Battery fault', reportedBy: 'Mick F' },
  ]);

  const [showForm, setShowForm] = useState(false);
  const [newDowntime, setNewDowntime] = useState({
    asset: '', date: '', startTime: '', endTime: '', category: '', description: '', reportedBy: ''
  });

  const handleAdd = () => {
    if (newDowntime.asset && newDowntime.date && newDowntime.description) {
      const start = new Date(`2000/01/01 ${newDowntime.startTime}`);
      const end = new Date(`2000/01/01 ${newDowntime.endTime}`);
      const hours = ((end - start) / 3600000).toFixed(1);
      setDowntimes([...downtimes, { ...newDowntime, id: downtimes.length + 1, hours }]);
      setNewDowntime({ asset: '', date: '', startTime: '', endTime: '', category: '', description: '', reportedBy: '' });
      setShowForm(false);
    }
  };

  return (
    <div className="downtime">
      <div className="page-header">
        <h2>Downtime Log</h2>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          + Log Downtime
        </button>
      </div>

      {showForm && (
        <div className="form-card">
          <h3>Log New Downtime Event</h3>
          <div className="form-grid">
            <input placeholder="Asset Name" value={newDowntime.asset}
              onChange={e => setNewDowntime({...newDowntime, asset: e.target.value})} />
            <input type="date" value={newDowntime.date}
              onChange={e => setNewDowntime({...newDowntime, date: e.target.value})} />
            <input type="time" placeholder="Start Time" value={newDowntime.startTime}
              onChange={e => setNewDowntime({...newDowntime, startTime: e.target.value})} />
            <input type="time" placeholder="End Time" value={newDowntime.endTime}
              onChange={e => setNewDowntime({...newDowntime, endTime: e.target.value})} />
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
            <input placeholder="Reported By" value={newDowntime.reportedBy}
              onChange={e => setNewDowntime({...newDowntime, reportedBy: e.target.value})} />
          </div>
          <textarea
            placeholder="Fault Description"
            value={newDowntime.description}
            onChange={e => setNewDowntime({...newDowntime, description: e.target.value})}
            style={{width:'100%', padding:'10px', borderRadius:'8px', border:'1px solid #0f3460', backgroundColor:'#1a1a2e', color:'white', marginBottom:'15px', fontSize:'14px', minHeight:'80px'}}
          />
          <button className="btn-primary" onClick={handleAdd}>Save Downtime</button>
        </div>
      )}

      <table className="data-table">
        <thead>
          <tr>
            <th>Asset</th>
            <th>Date</th>
            <th>Start</th>
            <th>End</th>
            <th>Hours Down</th>
            <th>Category</th>
            <th>Description</th>
            <th>Reported By</th>
          </tr>
        </thead>
        <tbody>
          {downtimes.map(d => (
            <tr key={d.id}>
              <td>{d.asset}</td>
              <td>{d.date}</td>
              <td>{d.startTime}</td>
              <td>{d.endTime}</td>
              <td><span className="hours-badge">{d.hours}h</span></td>
              <td><span className="category-badge">{d.category}</span></td>
              <td>{d.description}</td>
              <td>{d.reportedBy}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Downtime;