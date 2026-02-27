import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

function Reports() {
  const [downtimeData, setDowntimeData] = useState([]);
  const [assetCount, setAssetCount] = useState(0);
  const [totalHours, setTotalHours] = useState(0);
  const [totalCost, setTotalCost] = useState(0);
  const [loading, setLoading] = useState(true);

  const getDefaultDates = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 7);
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    };
  };

  const [dateRange, setDateRange] = useState(getDefaultDates());

  useEffect(() => { fetchReportData(); }, []);

  const fetchReportData = async () => {
    setLoading(true);
    const { data: assets } = await supabase.from('assets').select('id');
    setAssetCount(assets?.length || 0);
    const { data: downtime } = await supabase.from('downtime').select('*').order('date', { ascending: false });
    if (downtime) {
      setDowntimeData(downtime);
      setTotalHours(downtime.reduce((sum, d) => sum + parseFloat(d.hours || 0), 0).toFixed(1));
      setTotalCost(downtime.reduce((sum, d) => sum + parseFloat(d.cost || 0), 0).toFixed(2));
    }
    setLoading(false);
  };

  const getFilteredData = () => downtimeData.filter(d => d.date >= dateRange.start && d.date <= dateRange.end);

  const getCategoryTotals = () => {
    const totals = {};
    downtimeData.forEach(d => { if (d.category) totals[d.category] = (totals[d.category] || 0) + parseFloat(d.hours || 0); });
    return Object.entries(totals).map(([category, hours]) => ({ category, hours: hours.toFixed(1) })).sort((a, b) => b.hours - a.hours);
  };

  const getAssetTotals = () => {
    const totals = {};
    downtimeData.forEach(d => {
      if (d.asset) totals[d.asset] = { hours: (totals[d.asset]?.hours || 0) + parseFloat(d.hours || 0), cost: (totals[d.asset]?.cost || 0) + parseFloat(d.cost || 0) };
    });
    return Object.entries(totals).map(([asset, data]) => ({ asset, hours: data.hours.toFixed(1), cost: data.cost.toFixed(2) })).sort((a, b) => b.hours - a.hours).slice(0, 6);
  };

  const filteredData = getFilteredData();
  const filteredHours = filteredData.reduce((sum, d) => sum + parseFloat(d.hours || 0), 0);
  const filteredCost = filteredData.reduce((sum, d) => sum + parseFloat(d.cost || 0), 0);
  const maxHours = Math.max(...getCategoryTotals().map(i => parseFloat(i.hours)), ...getAssetTotals().map(i => parseFloat(i.hours)), 1);
  const barColors = ['#00c2e0', '#ff6b00', '#ffc800', '#00c264', '#a0b0b0', '#e94560'];

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFillColor(13, 21, 21); doc.rect(0, 0, 210, 297, 'F');
    doc.setTextColor(0, 194, 224); doc.setFontSize(28); doc.setFont('helvetica', 'bold'); doc.text('MAINTAINIQ', 14, 20);
    doc.setTextColor(160, 176, 176); doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.text('by Coastline Machine Management', 14, 27);
    doc.setTextColor(255, 255, 255); doc.setFontSize(16); doc.setFont('helvetica', 'bold'); doc.text('DOWNTIME REPORT', 14, 40);
    doc.setTextColor(160, 176, 176); doc.setFontSize(10); doc.setFont('helvetica', 'normal');
    doc.text('Period: ' + dateRange.start + ' - ' + dateRange.end, 14, 48);
    doc.text('Generated: ' + new Date().toLocaleDateString('en-AU'), 14, 54);
    doc.setDrawColor(26, 47, 47); doc.line(14, 58, 196, 58);
    doc.setFillColor(26, 47, 47); doc.rect(14, 62, 55, 20, 'F'); doc.rect(74, 62, 55, 20, 'F'); doc.rect(134, 62, 62, 20, 'F');
    doc.setTextColor(160, 176, 176); doc.setFontSize(8);
    doc.text('TOTAL EVENTS', 18, 68); doc.text('HOURS LOST', 78, 68); doc.text('TOTAL COST', 138, 68);
    doc.setTextColor(255, 255, 255); doc.setFontSize(16); doc.setFont('helvetica', 'bold');
    doc.text(String(filteredData.length), 18, 78); doc.text(filteredHours.toFixed(1) + 'h', 78, 78);
    doc.setTextColor(255, 107, 0); doc.text('$' + filteredCost.toLocaleString('en-AU', {minimumFractionDigits:2}), 138, 78);
    doc.setTextColor(0, 194, 224); doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.text('DOWNTIME EVENTS', 14, 95);
    if (filteredData.length === 0) {
      doc.setTextColor(160, 176, 176); doc.setFontSize(10); doc.setFont('helvetica', 'normal');
      doc.text('No downtime events recorded for this period.', 14, 105);
    } else {
      autoTable(doc, { startY: 98, head: [['Asset', 'Date', 'Category', 'Hours', 'Cost', 'Description']], body: filteredData.map(d => [d.asset, d.date, d.category, d.hours + 'h', '$' + parseFloat(d.cost || 0).toLocaleString('en-AU', {minimumFractionDigits:2}), d.description]), theme: 'plain', headStyles: { fillColor: [26, 47, 47], textColor: [160, 176, 176], fontSize: 8, fontStyle: 'bold' }, bodyStyles: { fillColor: [13, 21, 21], textColor: [255, 255, 255], fontSize: 9 }, alternateRowStyles: { fillColor: [20, 30, 30] }, styles: { lineColor: [26, 47, 47], lineWidth: 0.1 } });
    }
    const finalY = doc.lastAutoTable?.finalY || 105;
    doc.setTextColor(0, 194, 224); doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.text('DOWNTIME BY CATEGORY', 14, finalY + 15);
    autoTable(doc, { startY: finalY + 18, head: [['Category', 'Hours Lost']], body: getCategoryTotals().map(c => [c.category, c.hours + 'h']), theme: 'plain', headStyles: { fillColor: [26, 47, 47], textColor: [160, 176, 176], fontSize: 8, fontStyle: 'bold' }, bodyStyles: { fillColor: [13, 21, 21], textColor: [255, 255, 255], fontSize: 9 }, styles: { lineColor: [26, 47, 47], lineWidth: 0.1 } });
    doc.setTextColor(160, 176, 176); doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.text('Generated by MaintainIQ - coastlinemm.com.au', 14, 285);
    doc.save('MaintainIQ-Report-' + dateRange.start + '-to-' + dateRange.end + '.pdf');
  };

  const exportExcel = async () => {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'MaintainIQ';

    const blue = '1E6FA8';
    const lightBlue = 'D6EAF8';
    const white = 'FFFFFF';
    const dark = '1A1A1A';
    const border = 'BBCFDD';

    const colHeader = (cell) => {
      cell.font = { bold: true, color: { argb: white }, size: 9, name: 'Calibri' };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: blue } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = { bottom: { style: 'thin', color: { argb: white } } };
    };

    const dataCell = (cell, isAlt) => {
      cell.font = { color: { argb: dark }, size: 9, name: 'Calibri' };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: isAlt ? lightBlue : white } };
      cell.alignment = { vertical: 'middle', indent: 1 };
      cell.border = { bottom: { style: 'hair', color: { argb: border } } };
    };

    const numCell = (cell, isAlt, color) => {
      cell.font = { bold: true, color: { argb: color || blue }, size: 9, name: 'Calibri' };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: isAlt ? lightBlue : white } };
      cell.alignment = { vertical: 'middle', horizontal: 'right' };
      cell.border = { bottom: { style: 'hair', color: { argb: border } } };
    };

    const sectionTitle = (ws, row, text, numCols) => {
      ws.mergeCells(row.number, 1, row.number, numCols);
      row.getCell(1).value = text;
      row.getCell(1).font = { bold: true, color: { argb: white }, size: 11, name: 'Calibri' };
      row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '2E86C1' } };
      row.getCell(1).alignment = { vertical: 'middle', indent: 1 };
    };

    const addHeader = (ws, title, numCols) => {
      ws.addRow([]);
      const r1 = ws.addRow(['MAINTAINIQ  —  ' + title]);
      r1.height = 35;
      ws.mergeCells(r1.number, 1, r1.number, numCols);
      r1.getCell(1).font = { bold: true, color: { argb: white }, size: 18, name: 'Calibri' };
      r1.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: blue } };
      r1.getCell(1).alignment = { vertical: 'middle', indent: 1 };
      const r2 = ws.addRow(['Coastline Machine Management  |  ' + dateRange.start + ' to ' + dateRange.end + '  |  Generated: ' + new Date().toLocaleDateString('en-AU')]);
      r2.height = 20;
      ws.mergeCells(r2.number, 1, r2.number, numCols);
      r2.getCell(1).font = { italic: true, color: { argb: white }, size: 9, name: 'Calibri' };
      r2.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '2E86C1' } };
      r2.getCell(1).alignment = { vertical: 'middle', indent: 1 };
      ws.addRow([]).height = 6;
    };

    const addStatRow = (ws, values) => {
      const sv = ws.addRow(values);
      sv.height = 30;
      ['A','B','C'].forEach((col, idx) => {
        const colors = [dark, blue, 'CC4400'];
        sv.getCell(col).font = { bold: true, color: { argb: colors[idx] }, size: 20, name: 'Calibri' };
        sv.getCell(col).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: lightBlue } };
        sv.getCell(col).alignment = { vertical: 'middle', horizontal: 'center' };
      });
    };

    // SUMMARY SHEET
    const ss = wb.addWorksheet('Summary', { properties: { tabColor: { argb: blue } } });
    ss.views = [{ showGridLines: false }];
    addHeader(ss, 'SUMMARY REPORT', 4);

    const sh = ss.addRow(['TOTAL EVENTS', 'HOURS LOST', 'TOTAL COST ($)']);
    sh.height = 22;
    ['A','B','C'].forEach(c => colHeader(sh.getCell(c)));
    addStatRow(ss, [filteredData.length, parseFloat(filteredHours.toFixed(1)), parseFloat(filteredCost.toFixed(2))]);

    ss.addRow([]).height = 8;
    const ar = ss.addRow(['ASSET BREAKDOWN']);
    ar.height = 22;
    sectionTitle(ss, ar, 'ASSET BREAKDOWN', 4);

    const ah = ss.addRow(['Asset', 'Events', 'Hours', 'Cost ($)']);
    ah.height = 20;
    ['A','B','C','D'].forEach(c => colHeader(ah.getCell(c)));
    getAssetTotals().forEach((a, i) => {
      const r = ss.addRow([a.asset, filteredData.filter(d => d.asset === a.asset).length, parseFloat(a.hours), parseFloat(a.cost)]);
      r.height = 18;
      dataCell(r.getCell('A'), i % 2 !== 0); numCell(r.getCell('B'), i % 2 !== 0, dark);
      numCell(r.getCell('C'), i % 2 !== 0, blue); numCell(r.getCell('D'), i % 2 !== 0, 'CC4400');
    });

    ss.addRow([]).height = 8;
    const cr = ss.addRow(['CATEGORY BREAKDOWN']);
    cr.height = 22;
    sectionTitle(ss, cr, 'CATEGORY BREAKDOWN', 4);

    const ch = ss.addRow(['Category', 'Hours Lost']);
    ch.height = 20;
    ['A','B'].forEach(c => colHeader(ch.getCell(c)));
    getCategoryTotals().forEach((c, i) => {
      const r = ss.addRow([c.category, parseFloat(c.hours)]);
      r.height = 18;
      dataCell(r.getCell('A'), i % 2 !== 0); numCell(r.getCell('B'), i % 2 !== 0, blue);
    });
    ss.columns = [{ width: 28 }, { width: 14 }, { width: 14 }, { width: 16 }];

    // ALL EVENTS SHEET
    const es = wb.addWorksheet('All Events', { properties: { tabColor: { argb: '2E86C1' } } });
    es.views = [{ showGridLines: false }];
    addHeader(es, 'ALL DOWNTIME EVENTS', 9);
    const eh = es.addRow(['Asset', 'Date', 'Start', 'End', 'Hours', 'Cost ($)', 'Category', 'Description', 'Reported By']);
    eh.height = 22;
    ['A','B','C','D','E','F','G','H','I'].forEach(c => colHeader(eh.getCell(c)));
    filteredData.forEach((d, i) => {
      const r = es.addRow([d.asset, d.date, d.start_time, d.end_time, parseFloat(d.hours || 0), parseFloat(d.cost || 0), d.category, d.description, d.reported_by]);
      r.height = 18;
      dataCell(r.getCell('A'), i % 2 !== 0); dataCell(r.getCell('B'), i % 2 !== 0);
      dataCell(r.getCell('C'), i % 2 !== 0); dataCell(r.getCell('D'), i % 2 !== 0);
      numCell(r.getCell('E'), i % 2 !== 0, blue); numCell(r.getCell('F'), i % 2 !== 0, 'CC4400');
      dataCell(r.getCell('G'), i % 2 !== 0); dataCell(r.getCell('H'), i % 2 !== 0); dataCell(r.getCell('I'), i % 2 !== 0);
    });
    es.columns = [{ width: 16 }, { width: 12 }, { width: 10 }, { width: 10 }, { width: 10 }, { width: 12 }, { width: 16 }, { width: 42 }, { width: 16 }];

    // INDIVIDUAL ASSET SHEETS
    const uniqueAssets = [...new Set(filteredData.map(d => d.asset))];
    uniqueAssets.forEach(assetName => {
      const assetEvents = filteredData.filter(d => d.asset === assetName);
      const assetHours = assetEvents.reduce((sum, d) => sum + parseFloat(d.hours || 0), 0);
      const assetCost = assetEvents.reduce((sum, d) => sum + parseFloat(d.cost || 0), 0);
      const as = wb.addWorksheet(assetName.substring(0, 31), { properties: { tabColor: { argb: blue } } });
      as.views = [{ showGridLines: false }];
      addHeader(as, assetName.toUpperCase(), 8);

      const ash = as.addRow(['TOTAL EVENTS', 'HOURS DOWN', 'TOTAL COST ($)']);
      ash.height = 22;
      ['A','B','C'].forEach(c => colHeader(ash.getCell(c)));
      addStatRow(as, [assetEvents.length, parseFloat(assetHours.toFixed(1)), parseFloat(assetCost.toFixed(2))]);

      as.addRow([]).height = 8;
      const aeh = as.addRow(['DOWNTIME EVENTS']);
      aeh.height = 22;
      sectionTitle(as, aeh, 'DOWNTIME EVENTS', 8);

      const ach = as.addRow(['Date', 'Start', 'End', 'Hours', 'Cost ($)', 'Category', 'Description', 'Reported By']);
      ach.height = 22;
      ['A','B','C','D','E','F','G','H'].forEach(c => colHeader(ach.getCell(c)));
      assetEvents.forEach((d, i) => {
        const r = as.addRow([d.date, d.start_time, d.end_time, parseFloat(d.hours || 0), parseFloat(d.cost || 0), d.category, d.description, d.reported_by]);
        r.height = 18;
        dataCell(r.getCell('A'), i % 2 !== 0); dataCell(r.getCell('B'), i % 2 !== 0); dataCell(r.getCell('C'), i % 2 !== 0);
        numCell(r.getCell('D'), i % 2 !== 0, blue); numCell(r.getCell('E'), i % 2 !== 0, 'CC4400');
        dataCell(r.getCell('F'), i % 2 !== 0); dataCell(r.getCell('G'), i % 2 !== 0); dataCell(r.getCell('H'), i % 2 !== 0);
      });
      as.columns = [{ width: 12 }, { width: 10 }, { width: 10 }, { width: 10 }, { width: 12 }, { width: 16 }, { width: 42 }, { width: 16 }];
    });

    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, 'MaintainIQ-Report-' + dateRange.start + '-to-' + dateRange.end + '.xlsx');
  };

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
          <h3>Downtime Report</h3>
          <div className="week-selector">
            <button className="btn-primary" onClick={exportPDF}>Export PDF</button>
            <button className="btn-excel" onClick={exportExcel}>Export Excel</button>
          </div>
        </div>

        <div className="date-range-selector">
          <div className="date-field">
            <label>From</label>
            <input type="date" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} />
          </div>
          <div className="date-field">
            <label>To</label>
            <input type="date" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} />
          </div>
          <div className="date-shortcuts">
            <button className="week-btn" onClick={() => { const end = new Date(); const start = new Date(); start.setDate(start.getDate() - 7); setDateRange({ start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] }); }}>Last 7 Days</button>
            <button className="week-btn" onClick={() => { const end = new Date(); const start = new Date(); start.setDate(start.getDate() - 30); setDateRange({ start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] }); }}>Last 30 Days</button>
            <button className="week-btn" onClick={() => { const now = new Date(); const start = new Date(now.getFullYear(), now.getMonth(), 1); setDateRange({ start: start.toISOString().split('T')[0], end: now.toISOString().split('T')[0] }); }}>This Month</button>
          </div>
        </div>

        <div className="weekly-stats">
          <div className="weekly-stat">
            <span className="weekly-stat-label">Events</span>
            <span className="weekly-stat-value">{filteredData.length}</span>
          </div>
          <div className="weekly-stat">
            <span className="weekly-stat-label">Hours Lost</span>
            <span className="weekly-stat-value">{filteredHours.toFixed(1)}h</span>
          </div>
          <div className="weekly-stat">
            <span className="weekly-stat-label">Total Cost</span>
            <span className="weekly-stat-value" style={{color:'#ff6b00'}}>${filteredCost.toLocaleString('en-AU', {minimumFractionDigits:2})}</span>
          </div>
        </div>

        {filteredData.length === 0 ? (
          <p style={{color:'#a0b0b0', marginTop:'15px'}}>No downtime events recorded for this period</p>
        ) : (
          <table className="data-table" style={{marginTop:'15px'}}>
            <thead>
              <tr>
                <th>Asset</th><th>Date</th><th>Category</th><th>Hours</th><th>Cost</th><th>Description</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map(d => (
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
          {getCategoryTotals().length === 0 ? <p style={{color:'#a0b0b0'}}>No downtime data yet</p> : (
            getCategoryTotals().map((item, index) => (
              <div key={item.category} className="bar-row">
                <span className="bar-label">{item.category}</span>
                <div className="bar-track"><div className="bar-fill" style={{ width: (parseFloat(item.hours) / maxHours) * 100 + '%', backgroundColor: barColors[index % barColors.length] }} /></div>
                <span className="bar-value">{item.hours}h</span>
              </div>
            ))
          )}
        </div>
        <div className="chart-card">
          <h3>Downtime Cost by Asset</h3>
          {getAssetTotals().length === 0 ? <p style={{color:'#a0b0b0'}}>No downtime data yet</p> : (
            getAssetTotals().map((item, index) => (
              <div key={item.asset} className="bar-row">
                <span className="bar-label">{item.asset}</span>
                <div className="bar-track"><div className="bar-fill" style={{ width: (parseFloat(item.hours) / maxHours) * 100 + '%', backgroundColor: barColors[index % barColors.length] }} /></div>
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