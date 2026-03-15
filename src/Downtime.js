import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';

const CSS = `
  @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
  .dt-wrap { animation: fadeUp 0.3s ease; }
  .dt-quick-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(220px,1fr)); gap:12px; margin-bottom:24px; }
  .dt-asset-card { background:var(--surface); border:1px solid var(--border); border-radius:12px; padding:14px 16px; display:flex; align-items:center; gap:12px; transition:box-shadow 0.15s; }
  .dt-asset-card:hover { box-shadow:var(--shadow-md); }
  .dt-asset-card.down { border-color:var(--red-border); background:var(--red-bg); }
  .dt-asset-card.maintenance { border-color:var(--amber-border); background:var(--amber-bg); }
  .dt-status-btn { padding:7px 14px; border-radius:8px; font-size:11px; font-weight:700; border:none; cursor:pointer; transition:all 0.15s; white-space:nowrap; letter-spacing:0.3px; }
  .dt-status-btn:disabled { opacity:0.5; cursor:not-allowed; }
  .dt-status-btn.down-btn { background:var(--red-bg); color:var(--red); border:1px solid var(--red-border); }
  .dt-status-btn.down-btn:hover:not(:disabled) { background:var(--red); color:#fff; }
  .dt-status-btn.running-btn { background:var(--green-bg); color:var(--green); border:1px solid var(--green-border); }
  .dt-status-btn.running-btn:hover:not(:disabled) { background:var(--green); color:#fff; }
  .dt-status-btn.maint-btn { background:var(--amber-bg); color:var(--amber); border:1px solid var(--amber-border); }
  .dt-status-btn.maint-btn:hover:not(:disabled) { background:var(--amber); color:#fff; }
  .dt-table-wrap { overflow-x:auto; -webkit-overflow-scrolling:touch; }
  .dt-table { width:100%; border-collapse:collapse; min-width:500px; }
  .dt-table th { text-align:left; padding:0 14px 10px 0; font-size:10px; font-weight:700; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px; border-bottom:1px solid var(--border); }
  .dt-table td { padding:11px 14px 11px 0; font-size:13px; color:var(--text-secondary); border-bottom:1px solid var(--border); }
  .dt-table tr:last-child td { border-bottom:none; }
  .dt-table tr:hover td { background:var(--surface-2); }
  .dt-form-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(180px,1fr)); gap:12px; margin-bottom:14px; }
  .dt-input { width:100%; padding:9px 12px; border:1px solid var(--border); border-radius:8px; background:var(--surface-2); color:var(--text-primary); font-size:13px; font-family:inherit; outline:none; box-sizing:border-box; transition:border-color 0.15s; }
  .dt-input:focus { border-color:var(--accent); }
  .dt-label { display:block; font-size:10px; font-weight:700; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px; margin-bottom:5px; }
  .dt-section-title { font-size:12px; font-weight:800; color:var(--text-muted); text-transform:uppercase; letter-spacing:1px; margin-bottom:12px; padding-bottom:8px; border-bottom:1px solid var(--border); display:flex; align-items:center; gap:8px; }
  .dt-section-title::before { content:''; width:3px; height:14px; background:var(--accent); border-radius:2px; flex-shrink:0; }
`;

const CATEGORIES = ['Mechanical','Electrical','Hydraulic','Operator Error','Scheduled Maintenance','Environmental','Other'];

function Sk({ w='100%', h='13px' }) {
  return <div style={{ width:w, height:h, borderRadius:6, background:'linear-gradient(90deg,var(--surface-2) 25%,var(--surface-3) 50%,var(--surface-2) 75%)', backgroundSize:'200% 100%', animation:'shimmer 1.4s infinite linear', flexShrink:0 }} />;
}

const getIcon = (type) => {
  const t = (type||'').toLowerCase();
  if (t.includes('truck')||t.includes('ute')) return '🚛';
  if (t.includes('excavat')) return '🦺';
  if (t.includes('dozer')||t.includes('bull')) return '🚧';
  if (t.includes('crane')) return '🏗️';
  return '⚙️';
};

export default function Downtime({ userRole }) {
  const [assets, setAssets]       = useState([]);
  const [downtimes, setDowntimes] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(null);
  const [showForm, setShowForm]   = useState(false);
  const [view, setView]           = useState('quick');
  const [form, setForm] = useState({
    asset:'', date: new Date().toISOString().split('T')[0],
    start_time:'', end_time:'', category:'', description:'', reported_by:''
  });

  useEffect(() => {
    if (!document.getElementById('dt-css')) {
      const s = document.createElement('style'); s.id='dt-css'; s.textContent=CSS;
      document.head.appendChild(s);
    }
  }, []);

  useEffect(() => {
    if (userRole?.company_id) { fetchAssets(); fetchDowntimes(); }
  }, [userRole]);

  const fetchAssets = async () => {
    const { data } = await supabase.from('assets')
      .select('id,name,asset_number,type,status,location')
      .eq('company_id', userRole.company_id)
      .order('name');
    setAssets(data || []);
  };

  const fetchDowntimes = async () => {
    setLoading(true);
    const { data } = await supabase.from('downtime')
      .select('*')
      .eq('company_id', userRole.company_id)
      .order('created_at', { ascending: false });
    setDowntimes(data || []);
    setLoading(false);
  };

  const quickLog = async (asset, newStatus) => {
    setSaving(asset.id);
    try {
      await supabase.from('assets').update({ status: newStatus }).eq('id', asset.id);
      const now = new Date();
      if (newStatus === 'Down' || newStatus === 'Maintenance') {
        await supabase.from('downtime').insert({
          asset: asset.name,
          date: now.toISOString().split('T')[0],
          start_time: now.toTimeString().slice(0,5),
          end_time: '',
          category: newStatus === 'Maintenance' ? 'Scheduled Maintenance' : 'Unplanned',
          description: `${newStatus === 'Down' ? 'Machine reported down' : 'Machine placed in maintenance'} at ${now.toLocaleTimeString('en-AU',{hour:'2-digit',minute:'2-digit'})}`,
          reported_by: userRole.name || userRole.email,
          hours: 0,
          company_id: userRole.company_id,
          source: 'quick_log',
        });
      }
      if (newStatus === 'Running') {
        const open = downtimes.find(d => d.asset === asset.name && (!d.end_time || d.end_time === ''));
        if (open) {
          const start = new Date(`${open.date}T${open.start_time||'00:00'}`);
          const hrs = Math.max(0, (now - start) / 3600000).toFixed(1);
          await supabase.from('downtime').update({ end_time: now.toTimeString().slice(0,5), hours: hrs }).eq('id', open.id);
        }
      }
      await fetchAssets();
      await fetchDowntimes();
    } finally { setSaving(null); }
  };

  const handleManualAdd = async () => {
    if (!form.asset || !form.date || !form.description) {
      alert('Please fill in Asset, Date and Description.'); return;
    }
    setSaving('form');
    try {
      let hours = 0;
      if (form.start_time && form.end_time) {
        const start = new Date(`2000/01/01 ${form.start_time}`);
        const end   = new Date(`2000/01/01 ${form.end_time}`);
        hours = Math.max(0, (end - start) / 3600000).toFixed(1);
      }
      await supabase.from('downtime').insert({ ...form, hours, company_id: userRole.company_id, source: 'manual' });
      setForm({ asset:'', date: new Date().toISOString().split('T')[0], start_time:'', end_time:'', category:'', description:'', reported_by:'' });
      setShowForm(false);
      await fetchDowntimes();
    } finally { setSaving(null); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this record?')) return;
    await supabase.from('downtime').delete().eq('id', id);
    fetchDowntimes();
  };

  const downAssets  = assets.filter(a => a.status === 'Down');
  const maintAssets = assets.filter(a => a.status === 'Maintenance');
  const otherAssets = assets.filter(a => a.status !== 'Down' && a.status !== 'Maintenance');

  return (
    <div className="dt-wrap">

      {/* View toggle + manual entry button */}
      <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap' }}>
        <div style={{ display:'flex', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, padding:4, gap:3 }}>
          {[['quick','⚡ Quick Log'],['log','📋 Downtime Log']].map(([v,l]) => (
            <button key={v} onClick={() => setView(v)} style={{
              padding:'8px 16px', borderRadius:7, border:'none', cursor:'pointer',
              fontSize:13, fontWeight:600, transition:'all 0.15s',
              background: view===v ? 'var(--accent)' : 'transparent',
              color:       view===v ? '#fff' : 'var(--text-muted)',
            }}>{l}</button>
          ))}
        </div>
        <button onClick={() => setShowForm(s=>!s)} style={{
          padding:'9px 18px', background: showForm ? 'var(--surface-2)' : 'var(--surface)',
          border:'1px solid var(--border)', borderRadius:10,
          fontSize:13, fontWeight:600, cursor:'pointer', color:'var(--text-secondary)',
          display:'flex', alignItems:'center', gap:6, transition:'all 0.15s',
        }}>
          {showForm ? '✕ Close' : '+ Manual Entry'}
        </button>
      </div>

      {/* Manual Entry Form */}
      {showForm && (
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:14, padding:20, marginBottom:20, animation:'fadeUp 0.2s ease' }}>
          <div className="dt-section-title">Manual Downtime Entry</div>
          <div className="dt-form-grid">
            <div>
              <label className="dt-label">Asset *</label>
              <select className="dt-input" value={form.asset} onChange={e=>setForm({...form,asset:e.target.value})}>
                <option value="">Select asset…</option>
                {assets.map(a => <option key={a.id} value={a.name}>{a.name}{a.asset_number ? ` (${a.asset_number})` : ''}</option>)}
              </select>
            </div>
            <div>
              <label className="dt-label">Date *</label>
              <input className="dt-input" type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} />
            </div>
            <div>
              <label className="dt-label">Start Time</label>
              <input className="dt-input" type="time" value={form.start_time} onChange={e=>setForm({...form,start_time:e.target.value})} />
            </div>
            <div>
              <label className="dt-label">End Time</label>
              <input className="dt-input" type="time" value={form.end_time} onChange={e=>setForm({...form,end_time:e.target.value})} />
            </div>
            <div>
              <label className="dt-label">Category</label>
              <select className="dt-input" value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>
                <option value="">Select…</option>
                {CATEGORIES.map(cat => <option key={cat}>{cat}</option>)}
              </select>
            </div>
            <div>
              <label className="dt-label">Reported By</label>
              <input className="dt-input" placeholder={userRole?.name||'Your name'} value={form.reported_by} onChange={e=>setForm({...form,reported_by:e.target.value})} />
            </div>
          </div>
          <div style={{ marginBottom:14 }}>
            <label className="dt-label">Description *</label>
            <textarea className="dt-input" rows={3} placeholder="Describe the fault or downtime reason…" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} style={{ resize:'vertical', minHeight:80 }} />
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={handleManualAdd} disabled={saving==='form'} style={{ padding:'9px 22px', background:'var(--accent)', color:'#fff', border:'none', borderRadius:8, fontSize:13, fontWeight:700, cursor:'pointer', opacity:saving==='form'?0.6:1 }}>
              {saving==='form' ? 'Saving…' : 'Save Record'}
            </button>
            <button onClick={() => setShowForm(false)} style={{ padding:'9px 16px', background:'var(--surface-2)', color:'var(--text-secondary)', border:'1px solid var(--border)', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Quick Log View */}
      {view === 'quick' && (
        <div>
          {/* Currently Down */}
          {downAssets.length > 0 && (
            <div style={{ marginBottom:20 }}>
              <div className="dt-section-title" style={{ borderColor:'var(--red-border)' }}>🔴 Currently Down ({downAssets.length})</div>
              <div className="dt-quick-grid">
                {downAssets.map(a => (
                  <div key={a.id} className="dt-asset-card down">
                    <div style={{ fontSize:24, flexShrink:0 }}>{getIcon(a.type)}</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, fontWeight:700, color:'var(--text-primary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{a.name}</div>
                      <div style={{ fontSize:11, color:'var(--text-muted)' }}>{a.asset_number||'—'}</div>
                    </div>
                    <button className="dt-status-btn running-btn" disabled={saving===a.id} onClick={() => quickLog(a,'Running')}>
                      {saving===a.id ? '…' : '✓ Running'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* In Maintenance */}
          {maintAssets.length > 0 && (
            <div style={{ marginBottom:20 }}>
              <div className="dt-section-title" style={{ borderColor:'var(--amber-border)' }}>🟡 In Maintenance ({maintAssets.length})</div>
              <div className="dt-quick-grid">
                {maintAssets.map(a => (
                  <div key={a.id} className="dt-asset-card maintenance">
                    <div style={{ fontSize:24, flexShrink:0 }}>{getIcon(a.type)}</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, fontWeight:700, color:'var(--text-primary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{a.name}</div>
                      <div style={{ fontSize:11, color:'var(--text-muted)' }}>{a.asset_number||'—'}</div>
                    </div>
                    <button className="dt-status-btn running-btn" disabled={saving===a.id} onClick={() => quickLog(a,'Running')}>
                      {saving===a.id ? '…' : '✓ Running'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All other assets */}
          <div>
            <div className="dt-section-title">All Assets — Log Status Change</div>
            {assets.length === 0 ? (
              <div style={{ textAlign:'center', padding:'40px', color:'var(--text-faint)', fontSize:13 }}>No assets found.</div>
            ) : otherAssets.length === 0 ? (
              <div style={{ textAlign:'center', padding:'24px', color:'var(--text-muted)', fontSize:13 }}>All assets accounted for above.</div>
            ) : (
              <div className="dt-quick-grid">
                {otherAssets.map(a => (
                  <div key={a.id} className="dt-asset-card">
                    <div style={{ fontSize:24, flexShrink:0 }}>{getIcon(a.type)}</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, fontWeight:700, color:'var(--text-primary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{a.name}</div>
                      <div style={{ fontSize:11, color:'var(--text-muted)' }}>{a.asset_number||'—'} · <span style={{ color:'var(--green)' }}>{a.status}</span></div>
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', gap:5, flexShrink:0 }}>
                      <button className="dt-status-btn down-btn" disabled={saving===a.id} onClick={() => quickLog(a,'Down')}>
                        {saving===a.id ? '…' : '🔴 Down'}
                      </button>
                      <button className="dt-status-btn maint-btn" disabled={saving===a.id} onClick={() => quickLog(a,'Maintenance')}>
                        {saving===a.id ? '…' : '🟡 Maint.'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Downtime Log View */}
      {view === 'log' && (
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:14, padding:20 }}>
          <div className="dt-section-title">Downtime Records</div>
          {loading ? (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {[0,1,2,3].map(i => <div key={i} style={{ display:'flex', gap:12 }}>{[0,1,2,3].map(j => <Sk key={j} w="25%" h="14px" />)}</div>)}
            </div>
          ) : downtimes.length === 0 ? (
            <div style={{ textAlign:'center', padding:'40px', color:'var(--text-faint)', fontSize:13 }}>No downtime records yet.</div>
          ) : (
            <div className="dt-table-wrap">
              <table className="dt-table">
                <thead>
                  <tr>{['Asset','Date','Start','End','Hours','Category','Description','Reported By','Source',''].map(h => <th key={h}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {downtimes.map((d,i) => (
                    <tr key={d.id} style={{ opacity:0, animation:`fadeUp 0.3s ease ${i*30}ms forwards` }}>
                      <td style={{ fontWeight:600, color:'var(--text-primary)' }}>{d.asset}</td>
                      <td>{d.date}</td>
                      <td>{d.start_time||'—'}</td>
                      <td>{d.end_time || <span style={{ color:'var(--red)', fontWeight:600, fontSize:11 }}>● Open</span>}</td>
                      <td><span style={{ padding:'2px 8px', borderRadius:4, background:'var(--amber-bg)', color:'var(--amber)', fontSize:12, fontWeight:700, border:'1px solid var(--amber-border)' }}>{parseFloat(d.hours||0).toFixed(1)}h</span></td>
                      <td><span style={{ padding:'2px 8px', borderRadius:4, background:'var(--surface-2)', color:'var(--text-secondary)', fontSize:11, border:'1px solid var(--border)' }}>{d.category||'—'}</span></td>
                      <td style={{ maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', color:'var(--text-muted)', fontSize:12 }}>{d.description}</td>
                      <td style={{ fontSize:12, color:'var(--text-muted)' }}>{d.reported_by||'—'}</td>
                      <td><span style={{ padding:'2px 7px', borderRadius:4, fontSize:10, fontWeight:700, background: d.source==='quick_log'?'var(--accent-light)':'var(--surface-2)', color: d.source==='quick_log'?'var(--accent)':'var(--text-muted)', border:`1px solid ${d.source==='quick_log'?'rgba(14,165,233,0.25)':'var(--border)'}` }}>{d.source==='quick_log'?'Quick':'Manual'}</span></td>
                      <td><button onClick={() => handleDelete(d.id)} style={{ background:'transparent', border:'1px solid var(--red-border)', color:'var(--red)', padding:'4px 10px', borderRadius:6, fontSize:11, fontWeight:700, cursor:'pointer' }}>Delete</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
