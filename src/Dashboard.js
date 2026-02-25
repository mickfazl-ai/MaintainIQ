import React from 'react';

function Dashboard() {
  return (
    <div className="dashboard">
      <h2>Dashboard</h2>
      <p className="subtitle">Welcome back, Mick. Here's your overview.</p>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Assets</h3>
          <p className="stat-number">24</p>
        </div>
        <div className="stat-card down">
          <h3>Machines Down</h3>
          <p className="stat-number">3</p>
        </div>
        <div className="stat-card warning">
          <h3>Pending Maintenance</h3>
          <p className="stat-number">7</p>
        </div>
        <div className="stat-card overdue">
          <h3>Overdue PM's</h3>
          <p className="stat-number">2</p>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;