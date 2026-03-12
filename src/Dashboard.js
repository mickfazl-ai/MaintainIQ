import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabase';

const CSS = `
  @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
  @keyframes toast-in { from{opacity:0;transform:translateX(24px) scale(0.96)} to{opacity:1;transform:translateX(0) scale(1)} }
  @keyframes toast-out { from{opacity:1;transform:translateX(0);max-height:80px;margin-bottom:10px} to{opacity:0;transform:translateX(24px);max-height:0;margin-bottom:0} }
  @keyframes countUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  @keyframes pulse-red { 0%,100%{box-shadow:0 0 0 0 rgba(255,51,102,0.35)} 50%{box-shadow:0 0 0 8px rgba(255,51,102,0)} }
  @keyframes pulse-amber { 0%,100%{box-shadow:0 0 0 0 rgba(255,170,0,0.3)} 50%{box-shadow:0 0 0 6px rgba(255,170,0,0)} }
  @keyframes scan-line { 0%{top:-2px;opacity:0.6} 100%{top:100%;opacity:0} }
  @keyframes data-flicker { 0%,98%{opacity:1} 99%{opacity:0.7} 100%{opacity:1} }

  .dash-kpi {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 22px;
    position: relative;
    overflow: hidden;
    transition: all 0.2s;
    cursor: default;
  }
  .dash-kpi::after {
    content:''; position:absolute; top:0;left:0;right:0;bottom:0;
    background: linear-gradient(135deg, transparent 60%, rgba(0,212,255,0.03));
    pointer-events:none;
  }
  .dash-kpi:hover { transform:translateY(-4px); box-shadow:0 0 32px var(--cyan-glow); border-color:var(--border-glow); }
  .dash-kpi.urgent { animation:pulse-red 2.5s ease-in-out infinite; border-color:rgba(255,51,102,0.3); }
  .dash-kpi.warn   { animation:pulse-amber 2.5s ease-in-out infinite; border-color:rgba(255,170,0,0.3); }

  .scan-bar {
    position:absolute; left:0;right:0; height:1px;
    background:linear-gradient(90deg, transparent, rgba(0,212,255,0.6), transparent);
    animation:scan-line 3s ease-in-out infinite;
    pointer-events:none;
  }

  .hex-badge {
    width:40px; height:40px; position:relative;
    display:flex; align-items:center; justify-content:center;
    flex-shrink:0;
  }
  .hex-badge svg { position:absolute; }
  .hex-badge span { position:relative; z-index:1; font-size:18px; line-height:1; }

  .status-dot {
    width:7px; height:7px; border-radius:50%; flex-shrink:0;
  }
  .status-dot.green  { background:var(--green);  box-shadow:0 0 6px var(--green); }
  .status-dot.red    { background:var(--red);    box-shadow:0 0 6px var(--red); }
  .status-dot.amber  { background:var(--amber);  box-shadow:0 0 6px var(--amber); }
  .status-dot.cyan   { background:var(--cyan);   box-shadow:0 0 6px var(--cyan); }
  .status-dot.purple { background:var(--purple); box-shadow:0 0 6px var(--purple); }

  .wo-row { transition:background 0.12s; }
  .wo-row:hover td { background:var(--surface-2) !important; }

  .activity-line {
    display:flex; gap:12px; align-items:flex-start;
    padding:10px 0; border-bottom:1px solid var(--border-dim);
  }
  .activity-line:last-child { border-bottom:none; }

  .progress-track {
    height:6px; background:var(--base); border-radius:99px; overflow:hidden;
    position:relative;
  }
  .progress-fill {
    height:100%; border-radius:99px;
    transition:width 0.95s cubic-bezier(0.16,1,0.3,1);
  }

  .health-bar-seg { transition:width 1.1s cubic-bezier(0.16,1,0.3,1); }

  .panel {
    background:var(--surface); border:1px solid var(--border);
    border-radius:14px; padding:24px; position:relative; overflow:hidden;
    transition:border-color 0.2s, box-shadow 0.2s;
  }
  .panel:hover { border-color:rgba(0,180,255,0.2); }
  .panel::before {
    content:''; position:absolute; top:0;left:0;right:0; height:1px;
    background:linear-gradient(90deg,transparent,rgba(0,212,255,0.4),transparent);
    opacity:0; transition:opacity 0.2s;
  }
  .panel:hover::before { opacity:1; }

  .panel-title {
    font-family:'Barlow Condensed',sans-serif;
    font-size:13px; font-weight:800; letter-spacing:2px;
    text-transform:uppercase; color:var(--text-muted);
    margin-bottom:18px; display:flex; align-items:center; gap:8px;
  }
  .panel-title::before {
    content:''; width:3px; height:14px; border-radius:2px;
    background:var(--cyan); flex-shrink:0;
  }

  .refresh-btn {
    display:flex; align-items:center; gap:7px;
    padding:8px 16px; background:transparent; color:var(--text-muted);
    border:1px solid var(--border); border-radius:8px;
    font-size:11px; font-weight:700; cursor:pointer;
    transition:all 0.15s; letter-spacing:0.5px;
    font-family:'Rajdhani',sans-serif; text-transform:uppercase;
  }
  .refresh-btn:hover { border-color:var(--cyan-dim); color:var(--cyan); background:var(--cyan-glow); }

  .mono { font-family:'JetBrains Mono',monospace; animation:data-flicker 8s ease-in-out infinite; }
`;

function useToast() {
  const [toasts, setToasts] = useState([]);
  const add = useCallback((msg, type = 'info') => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, type, exiting: false }]);
    setTimeout(() => {
      setToasts(t => t.map(x => x.id === id ? { ...x, exiting: true } : x));
      setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 350);
    }, 4200);
  }, []);
  return { toasts, add };
}

function ToastContainer({ toasts }) {
  const P = {
    success: { border: '#00ff88', icon: '✓', bg: 'rgba(0,255,136,0.08)' },
    error:   { border: '#ff3366', icon: '✕', bg: 'rgba(255,51,102,0.08)' },
    warning: { border: '#ffaa00', icon: '⚠', bg: 'rgba(255,170,0,0.08)' },
    info:    { border: '#00d4ff', icon: 'ℹ', bg: 'rgba(0,212,255,0.08)' },
  };
  return (
    <div style={{ position:'fixed', bottom:28, right:28, zIndex:9999, display:'flex', flexDirection:'column', gap:10, pointerEvents:'none' }}>
      {toasts.map(t => {
        const p = P[t.type] || P.info;
        return (
          <div key={t.id} style={{
            display:'flex', alignItems:'center', gap:12,
            background:p.bg, border:`1px solid ${p.border}40`,
            borderLeft:`3px solid ${p.border}`,
            borderRadius:10, padding:'12px 18px',
            boxShadow:'0 8px 32px rgba(0,0,0,0.5)',
            minWidth:280, maxWidth:360, backdropFilter:'blur(12px)',
            animation:t.exiting?'toast-out 0.35s ease forwards':'toast-in 0.35s cubic-bezier(0.16,1,0.3,1)',
            pointerEvents:'auto',
          }}>
            <div style={{ width:24, height:24, borderRadius:'50%', backgroundColor:p.border+'22', display:'flex', alignItems:'center', justifyContent:'center', color:p.border, fontWeight:800, fontSize:11, flexShrink:0 }}>{p.icon}</div>
            <span style={{ fontSize:13, color:'var(--text-bright)', fontWeight:500, fontFamily:'Rajdhani,sans-serif' }}>{t.msg}</span>
          </div>
        );
      })}
    </div>
  );
}

function Sk({ w = '100%', h = '13px', r = '6px' }) {
  return <div style={{ width:w, height:h, borderRadius:r, flexShrink:0, background:'linear-gradient(90deg,var(--surface-2) 25%,var(--surface-3) 50%,var(--surface-2) 75%)', backgroundSize:'200% 100%', animation:'shimmer 1.5s infinite linear' }} />;
}

function Sparkline({ values = [], color = '#00d4ff', height = 28, width = 68 }) {
  if (!values || values.length < 2) return null;
  const max = Math.max(...values, 1), min = Math.min(...values), range = max - min || 1;
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * width},${height - ((v - min) / range) * (height - 6) - 3}`).join(' ');
  const lastPt = pts.split(' ').pop().split(',');
  return (
    <svg width={width} height={height} style={{ overflow:'visible', flexShrink:0 }}>
      <polyline points={pts} fill="none" stroke={color+'30'} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={lastPt[0]} cy={lastPt[1]} r="3" fill={color} style={{ filter:`drop-shadow(0 0 4px ${color})` }} />
    </svg>
  );
}

const STATUS_CONFIG = {
  'Down':        { dot:'red',    badge:['#ff3366','rgba(255,51,102,0.12)','rgba(204,34,68,0.4)'] },
  'Maintenance': { dot:'amber',  badge:['#ffaa00','rgba(255,170,0,0.12)','rgba(204,136,0,0.4)'] },
  'Running':     { dot:'green',  badge:['#00ff88','rgba(0,255,136,0.12)','rgba(0,204,106,0.4)'] },
  'Overdue':     { dot:'red',    badge:['#ff3366','rgba(255,51,102,0.12)','rgba(204,34,68,0.4)'] },
  'Due Soon':    { dot:'amber',  badge:['#ffaa00','rgba(255,170,0,0.12)','rgba(204,136,0,0.4)'] },
  'Upcoming':    { dot:'cyan',   badge:['#00d4ff','rgba(0,212,255,0.12)','rgba(0,153,204,0.4)'] },
  'Open':        { dot:'cyan',   badge:['#00d4ff','rgba(0,212,255,0.12)','rgba(0,153,204,0.4)'] },
  'In Progress': { dot:'purple', badge:['#aa55ff','rgba(170,85,255,0.12)','rgba(136,68,204,0.4)'] },
  'Critical':    { dot:'red',    badge:['#ff3366','rgba(255,51,102,0.12)','rgba(204,34,68,0.4)'] },
  'Complete':    { dot:'green',  badge:['#00ff88','rgba(0,255,136,0.12)','rgba(0,204,106,0.4)'] },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || { dot:'cyan', badge:['#7ab8e8','rgba(122,184,232,0.1)','rgba(0,100,150,0.3)'] };
  const [color, bg, border] = cfg.badge;
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'3px 9px', borderRadius:4, background:bg, border:`1px solid ${border}`, color, fontSize:10, fontWeight:700, letterSpacing:'0.8px', textTransform:'uppercase', fontFamily:'Rajdhani,sans-serif', whiteSpace:'nowrap' }}>
      <span style={{ width:5, height:5, borderRadius:'50%', background:color, boxShadow:`0 0 5px ${color}` }} />
      {status}
    </span>
  );
}

function KPICard({ label, value, icon, accentColor, sub, trend, delay = 0, urgent = false, warn = false }) {
  const [vis, setVis] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVis(true), delay); return () => clearTimeout(t); }, [delay]);
  const spark = [3,5,4,6,5,7,6,value && parseInt(value) ? parseInt(value) : 5].map(v => Math.max(1, v + Math.random()*2));
  return (
    <div className={`dash-kpi${urgent?' urgent':warn?' warn':''}`} style={{
      borderTop:`2px solid ${accentColor}40`,
      opacity:vis?1:0, transform:vis?'translateY(0)':'translateY(20px)',
      transition:`opacity 0.5s ease ${delay}ms, transform 0.5s ease ${delay}ms`,
    }}>
      <div className="scan-bar" style={{ animationDelay:`${delay*2}ms` }} />
      {/* Corner glow */}
      <div style={{ position:'absolute', top:0, right:0, width:80, height:80, background:`radial-gradient(circle at top right, ${accentColor}18, transparent 70%)`, pointerEvents:'none' }} />

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
        <span style={{ fontSize:10, fontWeight:700, color:'var(--text-muted)', letterSpacing:'1.5px', textTransform:'uppercase', fontFamily:'Rajdhani,sans-serif' }}>{label}</span>
        <div style={{ width:36, height:36, borderRadius:8, background:`${accentColor}18`, border:`1px solid ${accentColor}30`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>{icon}</div>
      </div>

      <div style={{
        fontFamily:"'Barlow Condensed',sans-serif", fontSize:52, fontWeight:800,
        color: urgent||warn ? accentColor : 'var(--text-bright)', lineHeight:1, marginBottom:12,
        textShadow: (urgent||warn) ? `0 0 20px ${accentColor}50` : 'none',
        animation:vis?`countUp 0.4s ease ${delay+120}ms both`:'none',
      }}>{value}</div>

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ display:'flex', alignItems:'center', gap:7 }}>
          {trend !== undefined && trend !== 0 && (
            <span style={{ fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:4, color:trend>0?'var(--red)':'var(--green)', background:trend>0?'var(--red-glow)':'var(--green-glow)', border:`1px solid ${trend>0?'var(--red-dim)':'var(--green-dim)'}` }}>
              {trend>0?'↑':'↓'} {Math.abs(trend)}%
            </span>
          )}
          <span style={{ fontSize:12, color:'var(--text-muted)', fontFamily:'Rajdhani,sans-serif' }}>{sub}</span>
        </div>
        <Sparkline values={spark} color={accentColor} />
      </div>
    </div>
  );
}

function FleetHealthBar({ running, down, maintenance, total }) {
  const [vis, setVis] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVis(true), 400); return () => clearTimeout(t); }, []);
  const segs = [
    { count:running,     pct:total>0?(running/total)*100:0,     color:'var(--green)',  label:'Running',     glow:'rgba(0,255,136,0.4)' },
    { count:maintenance, pct:total>0?(maintenance/total)*100:0, color:'var(--amber)',  label:'Maintenance', glow:'rgba(255,170,0,0.4)' },
    { count:down,        pct:total>0?(down/total)*100:0,        color:'var(--red)',    label:'Down',        glow:'rgba(255,51,102,0.4)' },
  ];
  return (
    <div style={{ marginBottom:28, opacity:vis?1:0, transition:'opacity 0.5s ease' }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
        <span style={{ fontSize:10, fontWeight:700, color:'var(--text-muted)', letterSpacing:'1.5px', textTransform:'uppercase', fontFamily:'Rajdhani,sans-serif' }}>Fleet Health Matrix</span>
        <span className="mono" style={{ fontSize:11, color:'var(--cyan)', fontWeight:700 }}>{total} UNITS REGISTERED</span>
      </div>
      <div style={{ display:'flex', height:8, borderRadius:99, overflow:'hidden', background:'var(--base)', gap:2, border:'1px solid var(--border)' }}>
        {segs.map(s => s.count > 0 && (
          <div key={s.label} title={`${s.label}: ${s.count}`} className="health-bar-seg" style={{
            width:vis?`${s.pct}%`:'0%', background:s.color,
            boxShadow:`0 0 8px ${s.glow}`,
          }} />
        ))}
      </div>
      <div style={{ display:'flex', gap:20, marginTop:10 }}>
        {segs.map(s => (
          <div key={s.label} style={{ display:'flex', alignItems:'center', gap:6 }}>
            <div style={{ width:8, height:8, borderRadius:2, background:s.color, boxShadow:`0 0 5px ${s.glow}` }} />
            <span style={{ fontSize:11, color:'var(--text-mid)', fontWeight:600, fontFamily:'Rajdhani,sans-serif' }}>
              {s.label} <span style={{ color:'var(--text-muted)' }}>({s.count})</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProgressBar({ label, current, max }) {
  const [anim, setAnim] = useState(false);
  useEffect(() => { const t = setTimeout(() => setAnim(true), 250); return () => clearTimeout(t); }, []);
  const pct = Math.min(100, max > 0 ? Math.round((current / max) * 100) : 0);
  const color = pct >= 90 ? 'var(--red)' : pct >= 70 ? 'var(--amber)' : 'var(--cyan)';
  const glow  = pct >= 90 ? 'rgba(255,51,102,0.5)' : pct >= 70 ? 'rgba(255,170,0,0.4)' : 'rgba(0,212,255,0.4)';
  const grad  = pct >= 90 ? 'var(--red)' : pct >= 70 ? 'linear-gradient(90deg,var(--amber),#ffcc44)' : 'linear-gradient(90deg,var(--cyan-dim),var(--cyan))';
  return (
    <div style={{ marginBottom:16 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
        <span style={{ fontSize:12, fontWeight:600, color:'var(--text-mid)', maxWidth:'60%', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontFamily:'Rajdhani,sans-serif' }}>{label}</span>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:11, fontWeight:700, color, fontFamily:'JetBrains Mono,monospace' }}>{pct}%</span>
          <span style={{ fontSize:11, color:'var(--text-faint)', fontFamily:'JetBrains Mono,monospace' }}>{current}/{max}h</span>
        </div>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width:anim?`${pct}%`:'0%', background:grad, boxShadow:pct>60?`0 0 8px ${glow}`:'none' }} />
      </div>
    </div>
  );
}

function EmptyState({ icon, title, desc }) {
  return (
    <div style={{ textAlign:'center', padding:'36px 20px' }}>
      <div style={{ fontSize:32, marginBottom:12, opacity:0.4 }}>{icon}</div>
      <div style={{ fontSize:14, fontWeight:700, color:'var(--text-muted)', marginBottom:6, fontFamily:'Rajdhani,sans-serif', letterSpacing:'0.5px' }}>{title}</div>
      <div style={{ fontSize:12, color:'var(--text-faint)', maxWidth:220, margin:'0 auto', lineHeight:1.65 }}>{desc}</div>
    </div>
  );
}

const P_COLOR = { Critical:'var(--red)', High:'var(--amber)', Medium:'var(--cyan)', Low:'var(--green)' };

function Dashboard({ companyId }) {
  const [stats, setStats]   = useState(null);
  const [dt, setDT]         = useState([]);
  const [maint, setMaint]   = useState([]);
  const [assets, setAssets] = useState([]);
  const [wos, setWOs]       = useState([]);
  const [loading, setLoad]  = useState(true);
  const [refreshing, setRef]= useState(false);
  const [hVis, setHVis]     = useState(false);
  const { toasts, add: toast } = useToast();

  useEffect(() => {
    if (!document.getElementById('dash-css')) {
      const s = document.createElement('style'); s.id = 'dash-css'; s.textContent = CSS; document.head.appendChild(s);
    }
    setTimeout(() => setHVis(true), 60);
    if (companyId) load();
  }, [companyId]);

  const load = async (isRefresh = false) => {
    if (isRefresh) setRef(true); else setLoad(true);
    try {
      const [{ data:aD }, { data:dD }, { data:mD }, { data:wD }] = await Promise.all([
        supabase.from('assets').select('*').eq('company_id', companyId),
        supabase.from('downtime').select('*').eq('company_id', companyId).order('created_at', { ascending:false }).limit(8),
        supabase.from('maintenance').select('*').eq('company_id', companyId).order('next_service_date').limit(8),
        supabase.from('work_orders').select('*').eq('company_id', companyId).neq('status','Complete').order('created_at', { ascending:false }).limit(6),
      ]);
      const a = aD || [];
      setAssets(a); setDT(dD||[]); setMaint(mD||[]); setWOs(wD||[]);
      const ov = (mD||[]).filter(m => m.status==='Overdue').length;
      const dn = a.filter(x => x.status==='Down').length;
      setStats({ total:a.length, running:a.filter(x=>x.status==='Running').length, down:dn, maintenance:a.filter(x=>x.status==='Maintenance').length, overdue:ov, dueSoon:(mD||[]).filter(m=>m.status==='Due Soon').length, openWOs:(wD||[]).length, util:a.length>0?Math.round((a.filter(x=>x.status==='Running').length/a.length)*100):0 });
      if (isRefresh) toast('Systems nominal — data refreshed', 'success');
      else if (dn > 0) toast(`${dn} unit${dn>1?'s':''} offline — immediate attention required`, 'error');
      else if (ov > 0) toast(`${ov} service${ov>1?'s':''} overdue — action required`, 'warning');
    } catch { toast('Comms failure — unable to retrieve fleet data', 'error'); }
    setLoad(false); setRef(false);
  };

  const ago = ts => { if(!ts)return''; const m=Math.floor((Date.now()-new Date(ts))/60000); if(m<60)return`${m}m ago`; if(m<1440)return`${Math.floor(m/60)}h ago`; return`${Math.floor(m/1440)}d ago`; };

  const progressAssets = assets.filter(a => a.current_hours && a.next_service_hours).slice(0, 6);
  const activity = [
    ...(dt.slice(0,3).map(d => ({ color:'var(--red)', label:'OFFLINE', title:`${d.asset}`, sub:d.category||'Unplanned downtime', time:ago(d.created_at) }))),
    ...(maint.filter(m=>m.status==='Overdue').slice(0,2).map(m => ({ color:'var(--amber)', label:'OVERDUE', title:m.asset_name||m.asset, sub:m.service_type||'Scheduled service', time:m.next_service_date||'' }))),
    ...(wos.filter(w=>w.priority==='Critical').slice(0,2).map(w => ({ color:'var(--red)', label:'CRITICAL', title:w.title||'Critical work order', sub:w.asset_name||'', time:ago(w.created_at) }))),
  ].slice(0,6);

  const now = new Date();

  return (
    <>
      <ToastContainer toasts={toasts} />
      <div style={{ animation:'fadeUp 0.4s ease both' }}>

        {/* ── HEADER ── */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:28, opacity:hVis?1:0, transform:hVis?'none':'translateY(-8px)', transition:'opacity 0.4s ease, transform 0.4s ease' }}>
          <div>
            <div style={{ fontSize:10, fontWeight:700, color:'var(--cyan)', letterSpacing:'3px', textTransform:'uppercase', fontFamily:'Rajdhani,sans-serif', marginBottom:4 }}>
              ◈ NEURAL COMMAND CENTER
            </div>
            <h2 style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:38, fontWeight:900, color:'var(--text-bright)', letterSpacing:'2px', textTransform:'uppercase', margin:0, lineHeight:1 }}>
              Fleet Intelligence
            </h2>
            <div className="mono" style={{ fontSize:11, color:'var(--text-muted)', marginTop:6 }}>
              {now.toLocaleDateString('en-AU',{weekday:'long',day:'numeric',month:'long',year:'numeric'})} · {now.toLocaleTimeString('en-AU',{hour:'2-digit',minute:'2-digit'})} AEST
            </div>
          </div>
          <button className="refresh-btn" onClick={() => load(true)} disabled={refreshing}>
            <span style={{ fontSize:14, display:'inline-block', animation:refreshing?'spin 0.8s linear infinite':'none' }}>⟳</span>
            {refreshing ? 'Syncing…' : 'Refresh'}
          </button>
        </div>

        {/* ── FLEET HEALTH ── */}
        {!loading && stats && <FleetHealthBar running={stats.running} down={stats.down} maintenance={stats.maintenance} total={stats.total} />}

        {/* ── KPI GRID ── */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:16 }}>
          {loading ? [0,1,2,3].map(i => (
            <div key={i} className="dash-kpi" style={{ padding:22 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:16 }}><Sk w="55%" h="10px" /><Sk w="36px" h="36px" r="8px" /></div>
              <Sk w="38%" h="48px" r="6px" style={{ marginBottom:12 }} /><Sk w="65%" h="10px" />
            </div>
          )) : (<>
            <KPICard label="Total Fleet"      value={stats.total}        icon="⚙" accentColor="#00d4ff" sub="units registered"  delay={0}   />
            <KPICard label="Units Offline"    value={stats.down}         icon="⬟" accentColor="#ff3366" sub="require attention" delay={80}  urgent={stats.down>0}    trend={stats.down>0?12:0} />
            <KPICard label="Overdue Services" value={stats.overdue}      icon="◈" accentColor="#ffaa00" sub="past due date"     delay={160} warn={stats.overdue>0} />
            <KPICard label="Utilisation"      value={`${stats.util}%`}  icon="▲" accentColor="#00ff88" sub="fleet operational" delay={240} trend={stats.util>80?-4:6} />
          </>)}
        </div>

        {/* ── SECONDARY STRIP ── */}
        {!loading && stats && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:24 }}>
            {[
              { label:'Units Running',       value:stats.running, color:'var(--green)', glow:'rgba(0,255,136,0.15)', icon:'◉' },
              { label:'Services Due Soon',   value:stats.dueSoon, color:'var(--amber)', glow:'rgba(255,170,0,0.15)', icon:'◷' },
              { label:'Open Work Orders',    value:stats.openWOs, color:'var(--cyan)',   glow:'rgba(0,212,255,0.15)', icon:'◧' },
            ].map((s,i) => (
              <div key={s.label} style={{
                background:'var(--surface)', border:`1px solid ${s.glow.replace('0.15','0.25')}`,
                borderRadius:12, padding:'14px 20px',
                display:'flex', alignItems:'center', justifyContent:'space-between',
                opacity:0, animation:`fadeUp 0.4s ease ${280+i*65}ms forwards`,
                boxShadow:`0 0 20px ${s.glow}`,
              }}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <span style={{ fontSize:18, color:s.color }}>{s.icon}</span>
                  <span style={{ fontSize:12, fontWeight:600, color:'var(--text-mid)', fontFamily:'Rajdhani,sans-serif', letterSpacing:'0.3px' }}>{s.label}</span>
                </div>
                <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:32, fontWeight:800, color:s.color, textShadow:`0 0 16px ${s.glow.replace('0.15','0.5')}` }}>{s.value}</span>
              </div>
            ))}
          </div>
        )}

        {/* ── ACTIVITY + INTERVALS ── */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:20 }}>

          {/* Activity Feed */}
          <div className="panel">
            <div className="panel-title">Activity Feed <span style={{ marginLeft:'auto', fontSize:10, color:'var(--text-faint)', fontWeight:500, letterSpacing:0 }}>Real-time events</span></div>
            {loading ? [0,1,2,3,4].map(i => (
              <div key={i} className="activity-line">
                <Sk w="40px" h="40px" r="8px" /><div style={{ flex:1 }}><Sk w="65%" h="13px" style={{ marginBottom:7 }} /><Sk w="40%" h="11px" /></div>
              </div>
            )) : activity.length === 0 ? (
              <EmptyState icon="◉" title="All systems nominal" desc="No alerts — fleet operating within normal parameters." />
            ) : activity.map((a,i) => (
              <div key={i} className="activity-line" style={{ opacity:0, animation:`fadeUp 0.35s ease ${i*55}ms forwards` }}>
                <div style={{ width:40, height:40, borderRadius:8, background:`${a.color}15`, border:`1px solid ${a.color}30`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <span style={{ fontSize:9, fontWeight:800, color:a.color, letterSpacing:'0.5px', fontFamily:'Rajdhani,sans-serif' }}>{a.label}</span>
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:'var(--text-bright)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontFamily:'Rajdhani,sans-serif' }}>{a.title}</div>
                  <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:2 }}>{a.sub}</div>
                </div>
                <div className="mono" style={{ fontSize:11, color:'var(--text-faint)', whiteSpace:'nowrap', marginTop:2 }}>{a.time}</div>
              </div>
            ))}
          </div>

          {/* Service Intervals */}
          <div className="panel">
            <div className="panel-title">Service Intervals <span style={{ marginLeft:'auto', fontSize:10, color:'var(--text-faint)', fontWeight:500, letterSpacing:0 }}>Hours to next service</span></div>
            {loading ? [0,1,2,3,4].map(i => (
              <div key={i} style={{ marginBottom:18 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}><Sk w="50%" h="12px" /><Sk w="22%" h="11px" /></div>
                <Sk w="100%" h="6px" r="99px" />
              </div>
            )) : progressAssets.length === 0 ? (
              <EmptyState icon="⚙" title="No interval data" desc="Assets with hours tracked will display service progress here." />
            ) : progressAssets.map(a => (
              <ProgressBar key={a.id} label={a.asset_number?`${a.asset_number} — ${a.name}`:(a.name||'Asset')} current={a.current_hours} max={a.next_service_hours} />
            ))}
          </div>
        </div>

        {/* ── WORK ORDERS ── */}
        <div className="panel" style={{ marginBottom:20 }}>
          <div className="panel-title">Open Work Orders <span style={{ marginLeft:'auto', fontSize:10, color:'var(--text-faint)', fontWeight:500, letterSpacing:0 }}>Active tasks requiring action</span></div>
          {loading ? [0,1,2].map(r => (
            <div key={r} style={{ display:'grid', gridTemplateColumns:'3fr 2fr 1fr 1fr', gap:14, padding:'13px 0', borderBottom:'1px solid var(--border-dim)' }}>
              {[0,1,2,3].map(i => <Sk key={i} h="13px" w={['80%','60%','50%','55%'][i]} />)}
            </div>
          )) : wos.length === 0 ? (
            <EmptyState icon="◉" title="No open work orders" desc="All work orders resolved. Well maintained fleet." />
          ) : (
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ borderBottom:'1px solid var(--border)' }}>
                  {['Work Order','Asset','Priority','Status'].map(h => (
                    <th key={h} style={{ textAlign:'left', padding:'0 14px 12px 0', fontSize:10, fontWeight:700, color:'var(--text-muted)', letterSpacing:'1.5px', textTransform:'uppercase', fontFamily:'Rajdhani,sans-serif' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {wos.map((wo,i) => {
                  const pc = P_COLOR[wo.priority] || 'var(--text-muted)';
                  return (
                    <tr key={wo.id} className="wo-row" style={{ borderBottom:'1px solid var(--border-dim)', opacity:0, animation:`fadeUp 0.3s ease ${i*55+150}ms forwards` }}>
                      <td style={{ padding:'12px 14px 12px 0' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                          <div style={{ width:3, height:28, borderRadius:99, background:pc, boxShadow:`0 0 6px ${pc}`, flexShrink:0 }} />
                          <span style={{ fontSize:13, fontWeight:600, color:'var(--text-bright)', fontFamily:'Rajdhani,sans-serif' }}>{wo.title||wo.description?.slice(0,45)||'—'}</span>
                        </div>
                      </td>
                      <td style={{ padding:'12px 14px 12px 0', fontSize:12, color:'var(--text-muted)', fontFamily:'Rajdhani,sans-serif' }}>{wo.asset_name||wo.asset||'—'}</td>
                      <td style={{ padding:'12px 14px 12px 0' }}>
                        <span style={{ padding:'3px 9px', borderRadius:4, background:`${pc}18`, color:pc, fontSize:10, fontWeight:700, fontFamily:'Rajdhani,sans-serif', letterSpacing:'0.8px', textTransform:'uppercase', border:`1px solid ${pc}40` }}>{wo.priority||'—'}</span>
                      </td>
                      <td style={{ padding:'12px 0' }}><StatusBadge status={wo.status} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* ── DOWNTIME LOG ── */}
        <div className="panel">
          <div className="panel-title">Downtime Log <span style={{ marginLeft:'auto', fontSize:10, color:'var(--text-faint)', fontWeight:500, letterSpacing:0 }}>Last 8 events</span></div>
          {loading ? [0,1,2,3].map(r => (
            <div key={r} style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr 3fr', gap:12, padding:'13px 0', borderBottom:'1px solid var(--border-dim)' }}>
              {[0,1,2,3,4].map(i => <Sk key={i} h="13px" w={['75%','55%','60%','40%','85%'][i]} />)}
            </div>
          )) : dt.length === 0 ? (
            <EmptyState icon="◉" title="No downtime recorded" desc="All fleet events will be logged and analysed here." />
          ) : (
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ borderBottom:'1px solid var(--border)' }}>
                  {['Asset','Date','Category','Hours','Description'].map(h => (
                    <th key={h} style={{ textAlign:'left', padding:'0 12px 12px 0', fontSize:10, fontWeight:700, color:'var(--text-muted)', letterSpacing:'1.5px', textTransform:'uppercase', fontFamily:'Rajdhani,sans-serif' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dt.map((d,i) => (
                  <tr key={d.id} className="wo-row" style={{ borderBottom:'1px solid var(--border-dim)', opacity:0, animation:`fadeUp 0.3s ease ${i*45+100}ms forwards` }}>
                    <td style={{ padding:'12px 12px 12px 0', fontSize:13, fontWeight:700, color:'var(--text-bright)', fontFamily:'Rajdhani,sans-serif' }}>{d.asset}</td>
                    <td style={{ padding:'12px 12px 12px 0', fontSize:11, color:'var(--text-muted)', whiteSpace:'nowrap', fontFamily:'JetBrains Mono,monospace' }}>{d.date}</td>
                    <td style={{ padding:'12px 12px 12px 0' }}>
                      <span style={{ padding:'3px 9px', borderRadius:4, background:'var(--surface-2)', color:'var(--text-mid)', fontSize:10, fontWeight:600, border:'1px solid var(--border)', fontFamily:'Rajdhani,sans-serif', letterSpacing:'0.5px', textTransform:'uppercase' }}>{d.category}</span>
                    </td>
                    <td style={{ padding:'12px 12px 12px 0' }}>
                      <span style={{ padding:'3px 9px', borderRadius:4, background:'var(--amber-glow)', color:'var(--amber)', fontSize:10, fontWeight:700, border:'1px solid var(--amber-dim)', fontFamily:'JetBrains Mono,monospace' }}>{d.hours}h</span>
                    </td>
                    <td style={{ padding:'12px 0', fontSize:12, color:'var(--text-muted)', maxWidth:260, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontFamily:'Rajdhani,sans-serif' }}>{d.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </>
  );
}

export default Dashboard;
