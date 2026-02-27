import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';

function Reports() {
  const [downtimeData, setDowntimeData] = useState([]);
  const [assetCount, setAssetCount] = useState(0);
  const [totalHours, setTotalHours] = useState(0);
  const [totalCost, setTotalCost] = useState(0);
  const [weeklyDowntime, setWeeklyDowntime] = useState([]);
  const [selectedWeek, setSelectedWeek] = useState('this');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReportData();
  }, []);

  const getWeekRange = (week) => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    monday.setHours(0, 0, 0, 0);

    if (week === 'last') {
      monday.setDate(monday.getDate() - 7);
    }

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    return { start: monday, end: sunday };
  };

  const fetchReportData = async () => {
    setLoading(true);

    const { data: assets } = await supabase.from('assets').select('id');
    setAssetCount(assets?.length || 0);

    const { data: downtime } = await supabase
      .from('downtime')
      .select('*')
      .order('date', { ascending: false });

    if (downtime) {
      setDowntimeData(downtime);
      const hours = downtime.reduce((sum, d) => sum + parseFloat(d.hours || 0), 0);
      const cost = downtime.reduce((sum, d) => sum + parseFloat(d.cost || 0), 0);
      setTotalHours(hours.toFixed(1));
      setTotalCost(cost.toFixed(2));
    }

    setLoading(false);
  };

  const getWeeklyData = () => {
    const { start, end } = getWeekRange(selectedWeek);
    return downtimeData.filter(d => {
      const date = new Date(d.date);
      return date >= start && date <= end;
    });
  };

  const getCategoryTotals = () => {
    const totals = {};
    downtimeData.forEach(d => {
      if (d.category) {
        totals[d.category] = (totals[d.category] || 0) + parseFloat(d.hours || 0);
      }
    });
    return Object.entries(totals)
      .map(([category, hours]) => ({ category, hours: hours.toFixed(1) }))
      .sort((a, b) => b.hours - a.hours);
  };

  const getAssetTotals = () => {
    const totals = {};
    downtimeData.forEach(d => {
      if (d.asset) {
        totals[d.asset] = {
          hours: (totals[d.asset]?.hours || 0) + parseFloat(d.hours || 0),
          cost: (totals[d.asset]?.cost || 0) + parseFloat(d.cost || 0)
        };
      }
    });
    return Object.entries(totals)
      .map(([asset, data]) => ({ asset, hours: data.hours.toFixed(1), cost: data.cost.toFixed(2) }))
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 6);
  };

  const weeklyData = getWeeklyData();
  const weeklyHours = weeklyData.reduce((sum, d) => sum + parseFloat(d.hours || 0), 0);
  const weeklyCost = weeklyData.reduce((sum, d) => sum + parseFloat(d.cost || 0), 0);

  const maxHours = Math.max(
    ...getCategoryTotals().map(i => parseFloat(i.hours)),
    ...getAssetTotals().map(i => parseFloat(i.hours)),
    1
  );

  const barColors = ['#00c2e0', '#ff6b00', '#ffc800', '#00c264', '#a0b0b0', '#e94560'];

  const { start, end } = getWeekRange(selectedWeek);
  const weekLabel = `${start.toLocaleDateString('en-AU')} — ${end.toLocaleDateString('en-AU')}`;

  if (loading) return <p style={{color:'#a0b0b0', padding:'20px'}}>Loading report data...</p>;

  return (
    <div className="reports">
      <div className="page-header">
        <h2>Reports & Analysis</h2>
      </div>

      <div className="report-summary">
        <div className="report-card">
          <h4>Total Downtime Hours</h4>
          <p className="report-number">{totalHours}h</p>
          <span className="report-sub">All time</span>
        </div>
        <div className="report-card">
          <h4>Total Downtime Cost</h4>
          <p className="report-number" style={{color:'#ff6b00'}}>${parseFloat(totalCost).toLocaleString('en-AU', {minimumFractionDigits:2})}</p>
          <span className="report-sub">All time</span>
        </div>
        <div className="report-card">
          <h4>Total Assets</h4>
          <p className="report-number">{assetCount}</p>
          <span className="report-sub">Registered machines</span>
        </div>
        <div className="report-card">
          <h4>Worst Asset</h4>
          <p className="report-number" style={{fontSize:'16px'}}>{getAssetTotals()[0]?.asset || 'N/A'}</p>
          <span className="report-sub">Most downtime hours</span>
        </div>
      </div>

      <div className="weekly-report">
        <div className="weekly-header">
          <h3>Weekly Downtime Report</h3>
          <div className="week-selector">
            <button
              className={selectedWeek === 'this' ? 'week-btn active' : 'week-btn'}
              onClick={() => setSelectedWeek('this')}
            >
              This Week
            </button>
            <button
              className={selectedWeek === 'last' ? 'week-btn active' : 'week-btn'}
              onClick={() => setSelectedWeek('last')}
            >
              Last Week
            </button>
          </div>
        </div>

        <p className="week-label">{weekLabel}</p>

        <div className="weekly-stats">
          <div className="weekly-stat">
            <span className="weekly-stat-label">Events</span>
            <span className="weekly-stat-value">{weeklyData.length}</span>
          </div>
          <div className="weekly-stat">
            <span className="weekly-stat-label">Hours Lost</span>
            <span className="weekly-stat-value">{weeklyHours.toFixed(1)}h</span>
          </div>
          <div className="weekly-stat">
            <span className="weekly-stat-label">Total Cost</span>
            <span className="weekly-stat-value" style={{color:'#ff6b00'}}>${weeklyCost.toLocaleString('en-AU', {minimumFractionDigits:2})}</span>
          </div>
        </div>

        {weeklyData.length === 0 ? (
          <p style={{color:'#a0b0b0', marginTop:'15px'}}>No downtime events recorded for this week</p>
        ) : (
          <table className="data-table" style={{marginTop:'15px'}}>
            <thead>
              <tr>
                <th>Asset</th>
                <th>Date</th>
                <th>Category</th>
                <th>Hours</th>
                <th>Cost</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {weeklyData.map(d => (
                <tr key={d.id}>
                  <td>{d.asset}</td>
                  <td>{d.date}</td>
                  <td><span className="category-badge">{d.category}</span></td>
                  <td><span className="hours-badge">{d.hours}h</span></td>
                  <td><span className="cost-badge">${parseFloat(d.cost || 0).toLocaleString('en-AU', {minimumFractionDigits:2})}</span></td>
                  <td>{d.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="charts-grid" style={{marginTop:'30px'}}>
        <div className="chart-card">
          <h3>Downtime by Fault Category</h3>
          {getCategoryTotals().length === 0 ? (
            <p style={{color:'#a0b0b0'}}>No downtime data yet</p>
          ) : (
            getCategoryTotals().map((item, index) => (
              <div key={item.category} className="bar-row">
                <span className="bar-label">{item.category}</span>
                <div className="bar-track">
                  <div className="bar-fill" style={{
                    width: `${(parseFloat(item.hours) / maxHours) * 100}%`,
                    backgroundColor: barColors[index % barColors.length]
                  }} />
                </div>
                <span className="bar-value">{item.hours}h</span>
              </div>
            ))
          )}
        </div>

        <div className="chart-card">
          <h3>Downtime Cost by Asset</h3>
          {getAssetTotals().length === 0 ? (
            <p style={{color:'#a0b0b0'}}>No downtime data yet</p>
          ) : (
            getAssetTotals().map((item, index) => (
              <div key={item.asset} className="bar-row">
                <span className="bar-label">{item.asset}</span>
                <div className="bar-track">
                  <div className="bar-fill" style={{
                    width: `${(parseFloat(item.hours) / maxHours) * 100}%`,
                    backgroundColor: barColors[index % barColors.length]
                  }} />
                </div>
                <span className="bar-value">${parseFloat(item.cost).toLocaleString('en-AU', {minimumFractionDigits:0})}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default Reports;