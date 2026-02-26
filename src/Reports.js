import React from 'react';

function Reports() {
  const downtimeByCategory = [
    { category: 'Mechanical', hours: 24, color: '#4fc3f7' },
    { category: 'Electrical', hours: 12, color: '#f5a623' },
    { category: 'Operator Error', hours: 6, color: '#e94560' },
    { category: 'Scheduled', hours: 8, color: '#4caf7d' },
    { category: 'Environmental', hours: 3, color: '#a8a8b3' },
  ];

  const downtimeByAsset = [
    { asset: 'Drill Rig DR750', hours: 18, color: '#e94560' },
    { asset: 'Excavator CAT 390', hours: 12, color: '#f5a623' },
    { asset: 'Crusher Fixed 01', hours: 8, color: '#4fc3f7' },
    { asset: 'Angle Grinder 04', hours: 4, color: '#4caf7d' },
  ];

  const maxHours = 30;

  return (
    <div className="reports">
      <div className="page-header">
        <h2>Reports & Analysis</h2>
      </div>

      <div className="report-summary">
        <div className="report-card">
          <h4>Total Downtime Hours</h4>
          <p className="report-number">53h</p>
          <span className="report-sub">This month</span>
        </div>
        <div className="report-card">
          <h4>Most Common Fault</h4>
          <p className="report-number">Mechanical</p>
          <span className="report-sub">24 hours lost</span>
        </div>
        <div className="report-card">
          <h4>Worst Performing Asset</h4>
          <p className="report-number">Drill Rig DR750</p>
          <span className="report-sub">18 hours down</span>
        </div>
        <div className="report-card">
          <h4>PM Compliance</h4>
          <p className="report-number">75%</p>
          <span className="report-sub">3 of 4 tasks on track</span>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <h3>Downtime by Fault Category</h3>
          {downtimeByCategory.map(item => (
            <div key={item.category} className="bar-row">
              <span className="bar-label">{item.category}</span>
              <div className="bar-track">
                <div
                  className="bar-fill"
                  style={{
                    width: `${(item.hours / maxHours) * 100}%`,
                    backgroundColor: item.color
                  }}
                />
              </div>
              <span className="bar-value">{item.hours}h</span>
            </div>
          ))}
        </div>

        <div className="chart-card">
          <h3>Downtime by Asset</h3>
          {downtimeByAsset.map(item => (
            <div key={item.asset} className="bar-row">
              <span className="bar-label">{item.asset}</span>
              <div className="bar-track">
                <div
                  className="bar-fill"
                  style={{
                    width: `${(item.hours / maxHours) * 100}%`,
                    backgroundColor: item.color
                  }}
                />
              </div>
              <span className="bar-value">{item.hours}h</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Reports;