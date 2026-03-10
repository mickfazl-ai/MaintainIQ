import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabase';

// ─── CSS ──────────────────────────────────────────────────────────────────────
const CSS = `
  @keyframes shimmer {
    0%   { background-position: -200% 0; }
    100% { background-position:  200% 0; }
  }
  @keyframes toast-in {
    from { opacity: 0; transform: translateX(24px) scale(0.96); }
    to   { opacity: 1; transform: translateX(0) scale(1); }
  }
  @keyframes toast-out {
    from { opacity: 1; transform: translateX(0) scale(1); max-height: 80px; margin-bottom: 10px; }
    to   { opacity: 0; transform: translateX(24px) scale(0.96); max-height: 0; margin-bottom: 0; }
  }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes pulse-urgent {
    0%, 100% { box-shadow: 0 0 0 0px rgba(220,38,38,0.35); }
    50%       { box-shadow: 0 0 0 6px rgba(220,38,38,0); }
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes countUp {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .kpi-card {
    background: #fff;
    border: 1px solid #e2ecf5;
    border-radius: 16px;
    padding: 22px;
    position: relative;
    overflow: hidden;
    transition: box-shadow 0.22s ease, transform 0.22s ease;
    cursor: default;
    box-shadow: 0 2px 8px rgba(0,100,180,0.06), 0 1px 2px rgba(0,0,0,0.03);
  }
  .kpi-card:hover {
    box-shadow: 0 14px 40px rgba(0,100,180,0.13), 0 2px 8px rgba(0,0,0,0.05) !important;
    transform: translateY(-3px) !important;
  }
  .kpi-card.urgent { animation: pulse-urgent 2.5s ease-in-out infinite; }
  .panel-card {
    background: #fff;
    border: 1px solid #e2ecf5;
    border-radius: 16px;
    padding: 24px;
    box-shadow: 0 2px 8px rgba(0,100,180,0.05), 0 1px 2px rgba(0,0,0,0.03);
    transition: box-shadow 0.22s ease, transform 0.22s ease;
  }
  .panel-card:hover {
    box-shadow: 0 10px 30px rgba(0,100,180,0.10), 0 2px 6px rgba(0,0,0,0.04);
    transform: translateY(-1px);
  }
  .dash-row { transition: background 0.12s; }
  .dash-row:hover td { background-color: #f4f8fd !important; }
  .refresh-btn {
    display: flex; align-items: center; gap: 7px;
    padding: 9px 18px; background: #fff; color: #3d5166;
    border: 1px solid #d6e6f2; border-radius: 9px;
    font-size: 12px; font-weight: 700; cursor: pointer;
    box-shadow: 0 1px 4px rgba(0,0,0,0.06);
    transition: all 0.18s; letter-spacing: 0.3px;
    font-family: inherit;
  }
  .refresh-btn:hover {
    border-color: #00ABE4 !important;
    color: #00ABE4 !important;
    background: #f0f8ff !important;
  }
  .refresh-btn:disabled { opacity: 0.6; cursor: not-allowed; }
`;

// ─── Toast ─────────────────────────────────────────────────────────────────────
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
    success: { border: '#16a34a', icon: '✓', bg: '#f0fdf4' },
    error:   { border: '#dc2626', icon: '✕', bg: '#fef2f2' },
    warning: { border: '#d97706', icon: '⚠', bg: '#fffbeb' },
    info:    { border: '#00ABE4', icon: 'ℹ', bg: '#f0f8ff' },
  };
  return (
    <div style={{ position: 'fixed', bottom: '28px', right: '28px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '10px', pointerEvents: 'none' }}>
      {toasts.map(t => {
        const p = P[t.type] || P.info;
        return (
          <div key={t.id} style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            background: p.bg, border: `1px solid ${p.border}28`,
            borderLeft: `4px solid ${p.border}`,
            borderRadius: '12px', padding: '13px 18px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            minWidth: '280px', maxWidth: '360px',
            animation: t.exiting ? 'toast-out 0.35s ease forwards' : 'toast-in 0.35s cubic-bezier(0.16,1,0.3,1)',
            pointerEvents: 'auto',
          }}>
            <div style={{ width: '26px', height: '26px', borderRadius: '50%', backgroundColor: p.border + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', color: p.border, fontWeight: 800, fontSize: '12px', flexShrink: 0 }}>{p.icon}</div>
            <span style={{ fontSize: '13px', color: '#1a2b3c', fontWeight: 500, lineHeight: 1.45 }}>{t.msg}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Skeleton ──────────────────────────────────────────────────────────────────
function Sk({ w = '100%', h = '13px', r = '6px', style = {} }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: r, flexShrink: 0,
      background: 'linear-gradient(90deg, #edf2f8 25%, #f5f8fd 50%, #edf2f8 75%)',
      backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite linear',
      ...style,
    }} />
  );
}

// ─── Sparkline ─────────────────────────────────────────────────────────────────
function Sparkline({ values = [], color = '#00ABE4', height = 30, width = 72 }) {
  if (!values || values.length < 2) return null;
  const max = Math.max(...values, 1), min = Math.min(...values), range = max - min || 1;
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * width},${height - ((v - min) / range) * (height - 6) - 3}`).join(' ');
  const lastPt = pts.split(' ').pop().split(',');
  return (
    <svg width={width} height={height} style={{ overflow: 'visible', flexShrink: 0 }}>
      <polyline points={pts} fill="none" stroke={color + '60'} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" strokeDasharray="100" />
      <circle cx={lastPt[0]} cy={lastPt[1]} r="3.5" fill={color} />
    </svg>
  );
}

// ─── Progress Bar ──────────────────────────────────────────────────────────────
function ProgressBar({ label, current, max }) {
  const [anim, setAnim] = useState(false);
  useEffect(() => { const t = setTimeout(() => setAnim(true), 250); return () => clearTimeout(t); }, []);
  const pct   = Math.min(100, max > 0 ? Math.round((current / max) * 100) : 0);
  const color = pct >= 90 ? '#dc2626' : pct >= 70 ? '#d97706' : '#00ABE4';
  const grad  = pct >= 90 ? '#dc2626' : pct >= 70 ? 'linear-gradient(90deg,#d97706,#f59e0b)' : 'linear-gradient(90deg,#00ABE4,#38bdf8)';
  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '7px' }}>
        <span style={{ fontSize: '12px', fontWeight: 600, color: '#1a2b3c', maxWidth: '60%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', fontWeight: 800, color }}>{pct}%</span>
          <span style={{ fontSize: '11px', color: '#b0c4d4' }}>{current}/{max}h</span>
        </div>
      </div>
      <div style={{ height: '7px', backgroundColor: '#edf2f8', borderRadius: '99px', overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: '99px',
          width: anim ? `${pct}%` : '0%',
          background: grad,
          transition: 'width 0.95s cubic-bezier(0.16,1,0.3,1)',
          boxShadow: pct >= 90 ? '0 0 10px #dc262655' : pct >= 70 ? '0 0 8px #d9770640' : 'none',
        }} />
      </div>
    </div>
  );
}

// ─── Empty State ───────────────────────────────────────────────────────────────
function EmptyState({ icon, title, desc }) {
  return (
    <div style={{ textAlign: 'center', padding: '36px 20px' }}>
      <div style={{ fontSize: '36px', marginBottom: '12px' }}>{icon}</div>
      <div style={{ fontSize: '14px', fontWeight: 700, color: '#1a2b3c', marginBottom: '6px' }}>{title}</div>
      <div style={{ fontSize: '12px', color: '#7a92a8', maxWidth: '220px', margin: '0 auto', lineHeight: 1.65 }}>{desc}</div>
    </div>
  );
}

// ─── Fleet Health Bar ──────────────────────────────────────────────────────────
function FleetHealthBar({ running, down, maintenance, total }) {
  const [vis, setVis] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVis(true), 400); return () => clearTimeout(t); }, []);
  const segs = [
    { count: running,     pct: total > 0 ? (running / total) * 100 : 0,     color: '#16a34a', label: 'Running' },
    { count: maintenance, pct: total > 0 ? (maintenance / total) * 100 : 0, color: '#d97706', label: 'Maintenance' },
    { count: down,        pct: total > 0 ? (down / total) * 100 : 0,        color: '#dc2626', label: 'Down' },
  ];
  return (
    <div style={{ marginBottom: '26px', opacity: vis ? 1 : 0, transition: 'opacity 0.5s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span style={{ fontSize: '10px', fontWeight: 700, color: '#7a92a8', letterSpacing: '1.2px', textTransform: 'uppercase' }}>Fleet Health Overview</span>
        <span style={{ fontSize: '11px', color: '#7a92a8', fontWeight: 500 }}>{total} assets</span>
      </div>
      <div style={{ display: 'flex', height: '10px', borderRadius: '99px', overflow: 'hidden', backgroundColor: '#edf2f8', gap: '2px' }}>
        {segs.map(s => s.count > 0 && (
          <div key={s.label} title={`${s.label}: ${s.count}`} style={{
            width: vis ? `${s.pct}%` : '0%', backgroundColor: s.color,
            transition: 'width 1.1s cubic-bezier(0.16,1,0.3,1)',
            boxShadow: `0 0 8px ${s.color}50`,
          }} />
        ))}
      </div>
      <div style={{ display: 'flex', gap: '18px', marginTop: '9px' }}>
        {segs.map(s => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: s.color }} />
            <span style={{ fontSize: '11px', color: '#3d5166', fontWeight: 600 }}>
              {s.label} <span style={{ color: '#7a92a8', fontWeight: 500 }}>({s.count})</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── KPI Card ──────────────────────────────────────────────────────────────────
function KPICard({ label, value, icon, accent, sub, trend, delay = 0, urgent = false }) {
  const [vis, setVis] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVis(true), delay); return () => clearTimeout(t); }, [delay]);
  // Fake sparkline data for visual interest
  const spark = [3,5,4,6,5,7,6,value && parseInt(value) ? parseInt(value) : 5].map(v => v + Math.random());

  return (
    <div className={`kpi-card${urgent ? ' urgent' : ''}`} style={{
      borderTop: `3px solid ${accent}`,
      opacity: vis ? 1 : 0,
      transform: vis ? 'translateY(0)' : 'translateY(20px)',
      transition: `opacity 0.5s ease ${delay}ms, transform 0.5s ease ${delay}ms`,
    }}>
      {/* Glow */}
      <div style={{ position: 'absolute', top: 0, right: 0, width: '90px', height: '90px', background: `radial-gradient(circle at top right, ${accent}14, transparent 70%)`, pointerEvents: 'none' }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
        <span style={{ fontSize: '10px', fontWeight: 700, color: '#7a92a8', letterSpacing: '1.3px', textTransform: 'uppercase' }}>{label}</span>
        <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: accent + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '17px' }}>{icon}</div>
      </div>

      <div style={{
        fontFamily: "'Barlow Condensed', sans-serif", fontSize: '54px', fontWeight: 800,
        color: urgent ? accent : '#1a2b3c', lineHeight: 1, marginBottom: '12px',
        animation: vis ? `countUp 0.4s ease ${delay + 120}ms both` : 'none',
      }}>{value}</div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          {trend !== undefined && trend !== 0 && (
            <span style={{
              fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px',
              color: trend > 0 ? '#dc2626' : '#16a34a',
              backgroundColor: trend > 0 ? '#fee2e2' : '#dcfce7',
            }}>{trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%</span>
          )}
          <span style={{ fontSize: '12px', color: '#7a92a8' }}>{sub}</span>
        </div>
        <Sparkline values={spark} color={accent} />
      </div>
    </div>
  );
}

// ─── Status Badge ──────────────────────────────────────────────────────────────
const BADGE = {
  'Down':        ['#dc2626','#fee2e2'],
  'Maintenance': ['#d97706','#fef3c7'],
  'Running':     ['#16a34a','#dcfce7'],
  'Overdue':     ['#dc2626','#fee2e2'],
  'Due Soon':    ['#d97706','#fef3c7'],
  'Upcoming':    ['#00ABE4','#e0f4ff'],
  'Open':        ['#00ABE4','#e0f4ff'],
  'In Progress': ['#7c3aed','#f5f3ff'],
  'Critical':    ['#dc2626','#fee2e2'],
};
function Badge({ status }) {
  const [c, bg] = BADGE[status] || ['#7a92a8','#f1f5f9'];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 10px', borderRadius: '20px', backgroundColor: bg, color: c, fontSize: '11px', fontWeight: 700, whiteSpace: 'nowrap' }}>
      <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: c }} />{status}
    </span>
  );
}

// ─── Section Title ─────────────────────────────────────────────────────────────
function Title({ children, sub }) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '17px', fontWeight: 800, color: '#1a2b3c', letterSpacing: '0.8px', textTransform: 'uppercase', margin: 0 }}>{children}</h3>
      {sub && <p style={{ fontSize: '11px', color: '#7a92a8', margin: '3px 0 0', fontWeight: 500 }}>{sub}</p>}
    </div>
  );
}

// ─── Activity Item ─────────────────────────────────────────────────────────────
function ActivityItem({ icon, title, sub, time, accent, delay = 0 }) {
  const [vis, setVis] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVis(true), delay); return () => clearTimeout(t); }, [delay]);
  return (
    <div style={{
      display: 'flex', gap: '12px', alignItems: 'flex-start',
      padding: '11px 0', borderBottom: '1px solid #f0f5fa',
      opacity: vis ? 1 : 0, transform: vis ? 'translateX(0)' : 'translateX(-10px)',
      transition: `opacity 0.4s ease ${delay}ms, transform 0.4s ease ${delay}ms`,
    }}>
      <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: accent + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', flexShrink: 0 }}>{icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: '#1a2b3c', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</div>
        <div style={{ fontSize: '11px', color: '#7a92a8', marginTop: '2px' }}>{sub}</div>
      </div>
      <div style={{ fontSize: '11px', color: '#b0c4d4', whiteSpace: 'nowrap', marginTop: '2px', fontWeight: 500 }}>{time}</div>
    </div>
  );
}

// ─── Work Order Row ────────────────────────────────────────────────────────────
const P_COLOR = { Critical: '#dc2626', High: '#d97706', Medium: '#00ABE4', Low: '#16a34a' };
function WORow({ wo, i }) {
  const [vis, setVis] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVis(true), i * 55 + 150); return () => clearTimeout(t); }, [i]);
  const pc = P_COLOR[wo.priority] || '#7a92a8';
  return (
    <tr className="dash-row" style={{ borderBottom: '1px solid #f0f5fa', opacity: vis ? 1 : 0, transform: vis ? 'none' : 'translateY(6px)', transition: 'opacity 0.3s, transform 0.3s' }}>
      <td style={{ padding: '12px 14px 12px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '4px', height: '30px', borderRadius: '99px', backgroundColor: pc, flexShrink: 0 }} />
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#1a2b3c' }}>{wo.title || wo.description?.slice(0, 45) || '—'}</span>
        </div>
      </td>
      <td style={{ padding: '12px 14px 12px 0', fontSize: '12px', color: '#7a92a8' }}>{wo.asset_name || wo.asset || '—'}</td>
      <td style={{ padding: '12px 14px 12px 0' }}>
        <span style={{ padding: '3px 10px', borderRadius: '6px', backgroundColor: pc + '18', color: pc, fontSize: '11px', fontWeight: 700 }}>{wo.priority || '—'}</span>
      </td>
      <td style={{ padding: '12px 0' }}><Badge status={wo.status} /></td>
    </tr>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────
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
      const [{ data: aD }, { data: dD }, { data: mD }, { data: wD }] = await Promise.all([
        supabase.from('assets').select('*').eq('company_id', companyId),
        supabase.from('downtime').select('*').eq('company_id', companyId).order('created_at', { ascending: false }).limit(8),
        supabase.from('maintenance').select('*').eq('company_id', companyId).order('next_service_date').limit(8),
        supabase.from('work_orders').select('*').eq('company_id', companyId).neq('status','Complete').order('created_at', { ascending: false }).limit(6),
      ]);
      const a = aD || [];
      setAssets(a); setDT(dD || []); setMaint(mD || []); setWOs(wD || []);
      const ov = (mD||[]).filter(m => m.status==='Overdue').length;
      const dn = a.filter(x => x.status==='Down').length;
      setStats({ total: a.length, running: a.filter(x=>x.status==='Running').length, down: dn, maintenance: a.filter(x=>x.status==='Maintenance').length, overdue: ov, dueSoon: (mD||[]).filter(m=>m.status==='Due Soon').length, openWOs: (wD||[]).length, util: a.length>0 ? Math.round((a.filter(x=>x.status==='Running').length/a.length)*100) : 0 });
      if (isRefresh) toast('Dashboard refreshed', 'success');
      else if (dn > 0) toast(`${dn} asset${dn>1?'s':''} currently down`, 'warning');
      else if (ov > 0) toast(`${ov} overdue service${ov>1?'s':''} need attention`, 'warning');
    } catch { toast('Failed to load dashboard data', 'error'); }
    setLoad(false); setRef(false);
  };

  const ago = ts => { if (!ts) return ''; const m = Math.floor((Date.now()-new Date(ts))/60000); if(m<60)return`${m}m ago`; if(m<1440)return`${Math.floor(m/60)}h ago`; return`${Math.floor(m/1440)}d ago`; };

  const progressAssets = assets.filter(a => a.current_hours && a.next_service_hours).slice(0, 6);
  const activity = [
    ...(dt.slice(0,3).map(d => ({ icon:'🔴', title:`${d.asset} — downtime logged`, sub: d.category||'Unplanned', time: ago(d.created_at), accent:'#dc2626' }))),
    ...(maint.filter(m=>m.status==='Overdue').slice(0,2).map(m => ({ icon:'⚠️', title:`${m.asset_name||m.asset} overdue`, sub: m.service_type||'Service', time: m.next_service_date||'', accent:'#d97706' }))),
    ...(wos.filter(w=>w.priority==='Critical').slice(0,2).map(w => ({ icon:'🔧', title: w.title||'Critical work order', sub: w.asset_name||'', time: ago(w.created_at), accent:'#dc2626' }))),
  ].slice(0,6);

  return (
    <>
      <ToastContainer toasts={toasts} />
      <div style={{ animation: 'fadeUp 0.4s ease both' }}>

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:'24px', opacity: hVis?1:0, transform: hVis?'none':'translateY(-8px)', transition:'opacity 0.4s ease, transform 0.4s ease' }}>
          <div>
            <h2 style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'34px', fontWeight:800, color:'#1a2b3c', letterSpacing:'1px', textTransform:'uppercase', margin:0, lineHeight:1 }}>Dashboard</h2>
            <p style={{ fontSize:'13px', color:'#7a92a8', margin:'5px 0 0', fontWeight:500 }}>{new Date().toLocaleDateString('en-AU',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</p>
          </div>
          <button className="refresh-btn" onClick={() => load(true)} disabled={refreshing}>
            <span style={{ fontSize:'16px', display:'inline-block', animation: refreshing?'spin 0.8s linear infinite':'none' }}>↻</span>
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>

        {/* Fleet health bar */}
        {!loading && stats && <FleetHealthBar running={stats.running} down={stats.down} maintenance={stats.maintenance} total={stats.total} />}

        {/* KPI Cards */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'16px', marginBottom:'18px' }}>
          {loading ? [0,1,2,3].map(i => (
            <div key={i} className="kpi-card" style={{ padding:'22px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'16px' }}><Sk w="55%" h="10px" /><Sk w="36px" h="36px" r="10px" /></div>
              <Sk w="38%" h="50px" r="8px" style={{ marginBottom:'14px' }} /><Sk w="68%" h="10px" />
            </div>
          )) : (<>
            <KPICard label="Total Fleet"       value={stats.total}           icon="⚙️" accent="#00ABE4" sub="registered assets"  delay={0}   />
            <KPICard label="Currently Down"    value={stats.down}            icon="🔴" accent="#dc2626" sub="need attention"     delay={80}  urgent={stats.down > 0}    trend={stats.down > 0 ? 12 : 0} />
            <KPICard label="Overdue Services"  value={stats.overdue}         icon="⚠️" accent="#d97706" sub="past due"           delay={160} urgent={stats.overdue > 0} />
            <KPICard label="Fleet Utilisation" value={`${stats.util}%`}     icon="📈" accent="#16a34a" sub="assets running"     delay={240} trend={stats.util > 80 ? -4 : 6} />
          </>)}
        </div>

        {/* Secondary strip */}
        {!loading && stats && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'12px', marginBottom:'24px' }}>
            {[
              { label:'Running Now',        value: stats.running,  color:'#16a34a', bg:'#dcfce7', icon:'✅' },
              { label:'Services Due Soon',  value: stats.dueSoon,  color:'#d97706', bg:'#fef3c7', icon:'📅' },
              { label:'Open Work Orders',   value: stats.openWOs,  color:'#00ABE4', bg:'#e0f4ff', icon:'🔧' },
            ].map((s,i) => (
              <div key={s.label} style={{
                background:'#fff', border:'1px solid #e2ecf5', borderRadius:'12px',
                padding:'14px 20px', display:'flex', alignItems:'center', justifyContent:'space-between',
                boxShadow:'0 1px 4px rgba(0,100,180,0.05)',
                opacity:0, animation:`fadeUp 0.4s ease ${280+i*65}ms forwards`,
              }}>
                <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                  <span style={{ fontSize:'20px' }}>{s.icon}</span>
                  <span style={{ fontSize:'12px', fontWeight:600, color:'#3d5166' }}>{s.label}</span>
                </div>
                <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'30px', fontWeight:800, color:s.color, backgroundColor:s.bg, padding:'2px 14px', borderRadius:'8px' }}>{s.value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Activity + Service Intervals */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px', marginBottom:'20px' }}>
          <div className="panel-card">
            <Title sub="Latest events across your fleet">Activity Feed</Title>
            {loading ? [0,1,2,3,4].map(i => (
              <div key={i} style={{ display:'flex', gap:'12px', padding:'11px 0', borderBottom:'1px solid #f0f5fa' }}>
                <Sk w="36px" h="36px" r="10px" style={{ flexShrink:0 }} />
                <div style={{ flex:1 }}><Sk w="68%" h="13px" style={{ marginBottom:'7px' }} /><Sk w="42%" h="11px" /></div>
                <Sk w="30px" h="11px" />
              </div>
            )) : activity.length === 0 ? (
              <EmptyState icon="✅" title="All clear" desc="No recent downtime or overdue services. Fleet is running well." />
            ) : activity.map((a,i) => <ActivityItem key={i} {...a} delay={i*55} />)}
          </div>

          <div className="panel-card">
            <Title sub="Hours progress to next service">Service Intervals</Title>
            {loading ? [0,1,2,3,4].map(i => (
              <div key={i} style={{ marginBottom:'18px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'7px' }}><Sk w="50%" h="12px" /><Sk w="22%" h="11px" /></div>
                <Sk w="100%" h="7px" r="99px" />
              </div>
            )) : progressAssets.length === 0 ? (
              <EmptyState icon="🔧" title="No interval data" desc="Assets with current hours and service intervals will show here." />
            ) : progressAssets.map(a => (
              <ProgressBar key={a.id} label={a.asset_number ? `${a.asset_number} — ${a.name}` : (a.name||'Asset')} current={a.current_hours} max={a.next_service_hours} />
            ))}
          </div>
        </div>

        {/* Work Orders */}
        <div className="panel-card" style={{ marginBottom:'20px' }}>
          <Title sub="Open and in-progress work orders">Open Work Orders</Title>
          {loading ? [0,1,2].map(r => (
            <div key={r} style={{ display:'grid', gridTemplateColumns:'3fr 2fr 1fr 1fr', gap:'14px', padding:'13px 0', borderBottom:'1px solid #f0f5fa' }}>
              {[0,1,2,3].map(i => <Sk key={i} h="13px" w={['80%','60%','50%','55%'][i]} />)}
            </div>
          )) : wos.length === 0 ? (
            <EmptyState icon="📋" title="No open work orders" desc="All work is complete. Great effort from the team!" />
          ) : (
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ borderBottom:'2px solid #f0f5fa' }}>
                  {['Work Order','Asset','Priority','Status'].map(h => (
                    <th key={h} style={{ textAlign:'left', padding:'0 14px 12px 0', fontSize:'10px', fontWeight:700, color:'#7a92a8', letterSpacing:'1.2px', textTransform:'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>{wos.map((wo,i) => <WORow key={wo.id} wo={wo} i={i} />)}</tbody>
            </table>
          )}
        </div>

        {/* Downtime log */}
        <div className="panel-card">
          <Title sub="Last 8 downtime events">Recent Downtime</Title>
          {loading ? [0,1,2,3].map(r => (
            <div key={r} style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr 3fr', gap:'12px', padding:'13px 0', borderBottom:'1px solid #f0f5fa' }}>
              {[0,1,2,3,4].map(i => <Sk key={i} h="13px" w={['75%','55%','60%','40%','85%'][i]} />)}
            </div>
          )) : dt.length === 0 ? (
            <EmptyState icon="📋" title="No downtime recorded" desc="Downtime events logged by your team will appear here." />
          ) : (
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ borderBottom:'2px solid #f0f5fa' }}>
                  {['Asset','Date','Category','Hours','Description'].map(h => (
                    <th key={h} style={{ textAlign:'left', padding:'0 12px 12px 0', fontSize:'10px', fontWeight:700, color:'#7a92a8', letterSpacing:'1.2px', textTransform:'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dt.map((d,i) => (
                  <tr key={d.id} className="dash-row" style={{ borderBottom:'1px solid #f0f5fa', opacity:0, animation:`fadeUp 0.3s ease ${i*45+100}ms forwards` }}>
                    <td style={{ padding:'12px 12px 12px 0', fontSize:'13px', fontWeight:700, color:'#1a2b3c' }}>{d.asset}</td>
                    <td style={{ padding:'12px 12px 12px 0', fontSize:'12px', color:'#7a92a8', whiteSpace:'nowrap' }}>{d.date}</td>
                    <td style={{ padding:'12px 12px 12px 0' }}><span style={{ padding:'3px 9px', borderRadius:'6px', backgroundColor:'#f0f5fa', color:'#3d5166', fontSize:'11px', fontWeight:600 }}>{d.category}</span></td>
                    <td style={{ padding:'12px 12px 12px 0' }}><span style={{ padding:'3px 9px', borderRadius:'6px', backgroundColor:'#fef3c7', color:'#d97706', fontSize:'11px', fontWeight:700 }}>{d.hours}h</span></td>
                    <td style={{ padding:'12px 0', fontSize:'12px', color:'#3d5166', maxWidth:'260px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{d.description}</td>
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
