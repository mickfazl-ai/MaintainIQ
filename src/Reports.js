import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';

function Reports() {
  const [downtimeData, setDowntimeData] = useState([]);
  const [assetCount, setAssetCount] = useState(0);
  const [totalHours, setTotalHours] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    setLoading(true);

    const { data: assets } = await supabase
      .from('assets')
      .select('id');
    setAssetCount(assets?.length || 0);

    const { data: downtime } = await supabase
      .from('downtime')
      .select('*');

    if (downtime) {
      setDowntimeData(downtime);
      const hours = downtime.reduce((sum, d) => sum + parseFloat(d.hours || 0), 0);
      setTotalHours(hours.toFixed(1));
    }

    setLoading(false);
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
        totals[d.asset] = (totals[d.asset] || 0) + parseFloat(d.hours || 0);
      }
    });
    return Object.entries(totals)
      .map(([asset, hours]) => ({ asset, hours: hours.toFixed(1) }))
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 6);
  };

  const getMostCommonFault = () => {
    const totals = getCategoryTotals();
    return totals.length > 0 ? totals[0].category : 'N/A';
  };

  const getWorstAsset = () => {
    const totals = getAssetTotals();
    return totals.length > 0 ? totals[0].asset : 'N/A';
  };

  const maxHours = Math.max(
    ...getCategoryTotals().map(i => parseFloat(i.hours)),
    ...getAssetTotals().map(i => parseFloat(i.hours)),
    1
  );

  const barColors = ['#00c2e0', '#ff6b00', '#ffc800', '#00c264', '#a0b0b0', '#e94560'];

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
          <h4>Total Assets</h4>
          <p className="report-number">{assetCount}</p>
          <span className="report-sub">Registered machines</span>
        </div>
        <div className="report-card">
          <h4>Most Common Fault</h4>
          <p className="report-number" style={{fontSize:'20px'}}>{getMostCommonFault()}</p>
          <span className="report-sub">By hours lost</span>
        </div>
        <div className="report-card">
          <h4>Worst Performing Asset</h4>
          <p className="report-number" style={{fontSize:'16px'}}>{getWorstAsset()}</p>
          <span className="report-sub">Most downtime hours</span>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <h3>Downtime by Fault Category</h3>
          {getCategoryTotals().length === 0 ? (
            <p style={{color:'#a0b0b0'}}>No downtime data yet</p>
          ) : (
            getCategoryTotals().map((item, index) => (
              <div key={item.category} className="bar-row">
                <span className="bar-label">{item.category}</span>
                <div className="bar-track">
                  <div
                    className="bar-fill"
                    style={{
                      width: `${(parseFloat(item.hours) / maxHours) * 100}%`,
                      backgroundColor: barColors[index % barColors.length]
                    }}
                  />
                </div>
                <span className="bar-value">{item.hours}h</span>
              </div>
            ))
          )}
        </div>

        <div className="chart-card">
          <h3>Downtime by Asset</h3>
          {getAssetTotals().length === 0 ? (
            <p style={{color:'#a0b0b0'}}>No downtime data yet</p>
          ) : (
            getAssetTotals().map((item, index) => (
              <div key={item.asset} className="bar-row">
                <span className="bar-label">{item.asset}</span>
                <div className="bar-track">
                  <div
                    className="bar-fill"
                    style={{
                      width: `${(parseFloat(item.hours) / maxHours) * 100}%`,
                      backgroundColor: barColors[index % barColors.length]
                    }}
                  />
                </div>
                <span className="bar-value">{item.hours}h</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default Reports;