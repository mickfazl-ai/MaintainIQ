import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './supabase';

const CSS = `
  @keyframes login-fade  { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
  @keyframes login-blob  { 0%,100%{border-radius:60% 40% 30% 70%/60% 30% 70% 40%} 50%{border-radius:30% 60% 70% 40%/50% 60% 30% 60%} }
  @keyframes float-slow  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
  @keyframes pulse-ring  { 0%,100%{box-shadow:0 0 0 0 rgba(14,165,233,0.35)} 50%{box-shadow:0 0 0 10px rgba(14,165,233,0)} }
  @keyframes shimmer-in  { from{opacity:0;transform:translateX(-12px)} to{opacity:1;transform:translateX(0)} }
  @keyframes card-hover  { from{transform:translateY(0)} to{transform:translateY(-4px)} }

  /* ── Layout ── */
  .lp-root {
    min-height: 100vh;
    background: var(--bg);
    overflow-x: hidden;
    font-family: var(--font-body);
  }

  /* ── Nav ── */
  .lp-nav {
    position: fixed; top:0; left:0; right:0; z-index:100;
    display:flex; align-items:center; justify-content:space-between;
    padding: 0 5vw; height:64px;
    background: rgba(var(--bg-rgb,10,15,28),0.88);
    backdrop-filter: blur(18px);
    border-bottom: 1px solid var(--border);
  }
  .lp-nav-logo {
    display:flex; align-items:center; gap:2px;
    font-family: var(--font-display); font-size:24px; font-weight:900; letter-spacing:2px;
  }
  .lp-nav-actions { display:flex; gap:10px; align-items:center; }
  .lp-btn-ghost {
    padding:7px 16px; border-radius:8px;
    border:1px solid var(--border); background:transparent;
    color:var(--text-muted); font-size:12px; font-weight:600;
    cursor:pointer; transition:all 0.15s; font-family:var(--font-body);
  }
  .lp-btn-ghost:hover { border-color:var(--accent); color:var(--accent); }
  .lp-btn-accent {
    padding:8px 20px; border-radius:8px;
    background:var(--accent); border:none;
    color:#fff; font-size:13px; font-weight:700;
    cursor:pointer; transition:all 0.15s; font-family:var(--font-body);
    animation: pulse-ring 2.5s infinite;
  }
  .lp-btn-accent:hover { background:var(--accent-dark); transform:translateY(-1px); }

  /* ── Hero ── */
  .lp-hero {
    min-height: 100vh;
    display:flex; align-items:center;
    padding: 100px 5vw 60px;
    position:relative; overflow:hidden;
  }
  .lp-blob {
    position:absolute; border-radius:50%;
    filter:blur(90px); pointer-events:none;
    animation: login-blob 12s ease-in-out infinite;
  }
  .lp-hero-inner {
    display:grid; grid-template-columns:1fr 420px; gap:60px;
    align-items:center; max-width:1200px; margin:0 auto; width:100%;
    position:relative; z-index:1;
  }
  .lp-eyebrow {
    display:inline-flex; align-items:center; gap:8px;
    padding:5px 14px; border-radius:20px;
    background:rgba(14,165,233,0.1); border:1px solid rgba(14,165,233,0.2);
    color:var(--accent); font-size:11px; font-weight:700;
    letter-spacing:1.2px; text-transform:uppercase; margin-bottom:22px;
    animation: login-fade 0.6s ease both;
  }
  .lp-title {
    font-family: var(--font-display);
    font-size: clamp(36px,5vw,68px); font-weight:900; line-height:1.08;
    letter-spacing:-1px; margin-bottom:20px;
    animation: login-fade 0.6s 0.1s ease both;
  }
  .lp-title .hl { color:var(--accent); }
  .lp-subtitle {
    font-size:clamp(15px,2vw,18px); color:var(--text-muted);
    line-height:1.75; margin-bottom:36px; max-width:500px;
    animation: login-fade 0.6s 0.2s ease both;
  }
  .lp-hero-ctas {
    display:flex; gap:12px; flex-wrap:wrap;
    animation: login-fade 0.6s 0.3s ease both;
  }
  .lp-btn-hero {
    padding:13px 32px; border-radius:10px;
    background:var(--accent); border:none; color:#fff;
    font-size:14px; font-weight:700; cursor:pointer;
    transition:all 0.2s; font-family:var(--font-body);
  }
  .lp-btn-hero:hover { transform:translateY(-2px); box-shadow:0 12px 36px rgba(14,165,233,0.35); }
  .lp-btn-hero-outline {
    padding:13px 28px; border-radius:10px;
    background:rgba(255,255,255,0.04); border:1px solid var(--border);
    color:var(--text-secondary); font-size:14px; font-weight:600;
    cursor:pointer; transition:all 0.2s; font-family:var(--font-body);
    text-decoration:none; display:inline-flex; align-items:center;
  }
  .lp-btn-hero-outline:hover { background:rgba(255,255,255,0.08); border-color:rgba(255,255,255,0.2); }

  /* ── Login card ── */
  .lp-login-card {
    background:var(--surface); border:1px solid var(--border);
    border-radius:20px; padding:38px 34px;
    box-shadow: 0 24px 80px rgba(0,0,0,0.3);
    animation: login-fade 0.7s 0.15s cubic-bezier(0.16,1,0.3,1) both;
    position:relative; z-index:1;
  }
  .lp-login-card-logo { text-align:center; margin-bottom:26px; }
  .lp-login-card-logo .wm { font-family:var(--font-display); font-size:32px; font-weight:900; letter-spacing:2px; }
  .lp-login-card-logo .tg { font-size:10px; color:var(--text-muted); letter-spacing:1.5px; text-transform:uppercase; margin-top:4px; }

  .lp-tabs { display:flex; border-bottom:1px solid var(--border); margin-bottom:22px; }
  .lp-tab {
    flex:1; padding:9px 6px; background:transparent; border:none;
    border-bottom:2px solid transparent; color:var(--text-muted);
    font-size:12px; font-weight:600; cursor:pointer; transition:all 0.15s;
    font-family:var(--font-body);
  }
  .lp-tab.active { color:var(--accent); border-bottom-color:var(--accent); }

  .lp-field { margin-bottom:14px; }
  .lp-label { display:block; font-size:11px; font-weight:700; color:var(--text-muted); margin-bottom:5px; letter-spacing:0.3px; }
  .lp-input {
    width:100%; padding:11px 13px;
    background:var(--surface-2) !important; color:var(--text-primary) !important;
    border:1px solid var(--border) !important; border-radius:8px !important;
    font-size:14px !important; font-family:var(--font-body) !important;
    outline:none !important; transition:border-color 0.15s, box-shadow 0.15s !important;
    box-sizing:border-box;
  }
  .lp-input:focus { border-color:var(--accent) !important; box-shadow:0 0 0 3px var(--accent-glow) !important; }
  .lp-input::placeholder { color:var(--text-faint) !important; }

  .lp-submit {
    width:100%; padding:12px; border-radius:9px;
    background:var(--accent); border:none; color:#fff;
    font-size:14px; font-weight:700; font-family:var(--font-body);
    cursor:pointer; transition:all 0.15s; margin-top:6px;
    box-shadow:0 2px 10px var(--accent-glow);
  }
  .lp-submit:hover { background:var(--accent-dark); transform:translateY(-1px); }
  .lp-submit:disabled { opacity:0.5; cursor:not-allowed; transform:none; }

  .lp-err { padding:9px 13px; border-radius:8px; background:var(--red-bg); border:1px solid var(--red-border); color:var(--red); font-size:12px; margin-bottom:12px; line-height:1.5; }
  .lp-ok  { padding:9px 13px; border-radius:8px; background:rgba(34,197,94,0.1); border:1px solid rgba(34,197,94,0.3); color:var(--green); font-size:12px; margin-bottom:12px; line-height:1.5; }

  /* ── Stats bar ── */
  .lp-stats {
    display:flex; justify-content:center; gap:0;
    border-top:1px solid var(--border); border-bottom:1px solid var(--border);
    background:rgba(14,165,233,0.03);
  }
  .lp-stat {
    flex:1; max-width:220px; text-align:center;
    padding:28px 16px; border-right:1px solid var(--border);
  }
  .lp-stat:last-child { border-right:none; }
  .lp-stat-val { font-family:var(--font-display); font-size:30px; font-weight:900; color:var(--accent); }
  .lp-stat-lbl { font-size:11px; color:var(--text-muted); font-weight:500; margin-top:4px; letter-spacing:0.5px; }

  /* ── Features ── */
  .lp-features { padding:80px 5vw; max-width:1200px; margin:0 auto; }
  .lp-features-grid {
    display:grid; grid-template-columns:repeat(auto-fill,minmax(260px,1fr));
    gap:16px; margin-top:48px;
  }
  .lp-feat-card {
    background:var(--surface); border:1px solid var(--border);
    border-radius:14px; padding:24px 22px; transition:all 0.2s;
    cursor:default;
  }
  .lp-feat-card:hover { border-color:rgba(14,165,233,0.3); transform:translateY(-4px); box-shadow:0 16px 48px rgba(0,0,0,0.2); }
  .lp-feat-icon { font-size:28px; margin-bottom:12px; display:block; animation:float-slow 4s ease-in-out infinite; }
  .lp-feat-name { font-family:var(--font-display); font-size:15px; font-weight:700; margin-bottom:8px; color:var(--text-primary); }
  .lp-feat-desc { font-size:13px; color:var(--text-muted); line-height:1.65; }

  /* ── CTA ── */
  .lp-cta {
    text-align:center; padding:80px 5vw;
    border-top:1px solid var(--border);
    background:linear-gradient(135deg, rgba(14,165,233,0.06) 0%, transparent 60%);
  }

  /* ── Footer ── */
  .lp-footer {
    padding:32px 5vw; border-top:1px solid var(--border);
    display:flex; justify-content:space-between; align-items:center;
    flex-wrap:wrap; gap:12px;
  }
  .lp-footer-logo { font-family:var(--font-display); font-size:18px; font-weight:900; letter-spacing:1.5px; }

  /* ── Section headers ── */
  .lp-sec-label { font-size:10px; font-weight:700; color:var(--accent); letter-spacing:2px; text-transform:uppercase; margin-bottom:10px; }
  .lp-sec-title { font-family:var(--font-display); font-size:clamp(24px,3.5vw,40px); font-weight:800; line-height:1.15; margin-bottom:12px; }
  .lp-sec-sub { font-size:15px; color:var(--text-muted); max-width:520px; line-height:1.7; }

  /* ── Responsive ── */
  @media(max-width:900px) {
    .lp-hero-inner { grid-template-columns:1fr; }
    .lp-login-card { max-width:480px; margin:0 auto; }
    .lp-stats { flex-wrap:wrap; }
    .lp-stat { min-width:140px; }
    .lp-nav { padding:0 4vw; }
  }
  @media(max-width:480px) {
    .lp-login-card { padding:28px 20px; }
    .lp-hero { padding:90px 4vw 40px; }
  }
`;

const FEATURES = [
  { icon:'📊', name:'Live Dashboard',        desc:'Customisable widgets — breakdowns, overdue services, oil alerts, parts stock and more all in one view.' },
  { icon:'🚛', name:'Asset Management',      desc:'Full fleet register with service schedules, oil sampling, depreciation tracking and document storage per asset.' },
  { icon:'📋', name:'AI Form Builder',       desc:'Generate prestart checklists for any machine in seconds. Technicians complete them on their phone.' },
  { icon:'🔧', name:'Maintenance Calendar',  desc:'Service schedules driven by actual machine hours. Colour-coded by urgency with one-tap service sheets.' },
  { icon:'🔩', name:'Parts Inventory',       desc:'QR sticker printing, AI photo scanning, stocktake and automatic deduction when parts are used on jobs.' },
  { icon:'🧪', name:'Oil Sampling',          desc:'Log samples, get AI condition analysis, track trends across your fleet and catch problems early.' },
  { icon:'📈', name:'Reports & Export',      desc:'Downtime analysis, machine availability and full data export — PDFs, Excel and CSV of every record.' },
  { icon:'☁️', name:'OneDrive Sync',         desc:'Automatically back up your fleet data to Microsoft OneDrive with dated subfolders.' },
];

function Login({ onAuth }) {
  const [tab,  setTab]  = useState('login');
  const [email,setEmail]= useState('');
  const [pw,   setPw]   = useState('');
  const [err,  setErr]  = useState('');
  const [msg,  setMsg]  = useState('');
  const [busy, setBusy] = useState(false);
  const loginCardRef = useRef(null);

  useEffect(() => {
    if (!document.getElementById('lp-css')) {
      const s = document.createElement('style'); s.id='lp-css'; s.textContent=CSS; document.head.appendChild(s);
    }
  }, []);

  const handle = async () => {
    setErr(''); setMsg(''); setBusy(true);
    try {
      if (tab === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password: pw });
        if (error) throw error;
        if (data.session) onAuth(data.session);
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
        if (error) throw error;
        setMsg('Reset email sent — check your inbox.');
      }
    } catch(e) { setErr(e.message); }
    setBusy(false);
  };

  const scrollToLogin = () => loginCardRef.current?.scrollIntoView({ behavior:'smooth', block:'center' });

  return (
    <div className="lp-root">

      {/* ── Nav ── */}
      <nav className="lp-nav">
        <div className="lp-nav-logo">
          <span style={{ color:'var(--text-primary)' }}>MECH</span>
          <span style={{ color:'var(--accent)' }}>IQ</span>
        </div>
        <div className="lp-nav-actions">
          <a href="mailto:info@mechiq.com.au" className="lp-btn-ghost">Contact Us</a>
          <button className="lp-btn-accent" onClick={scrollToLogin}>Login</button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="lp-hero">
        <div className="lp-blob" style={{ width:700,height:700,background:'rgba(14,165,233,0.07)',top:'-20%',right:'-15%' }} />
        <div className="lp-blob" style={{ width:500,height:500,background:'rgba(34,197,94,0.05)',bottom:'-10%',left:'-10%',animationDelay:'-6s' }} />

        <div className="lp-hero-inner">
          {/* Left — copy */}
          <div>
            <div className="lp-eyebrow">⚙ Built for Australian Industry</div>
            <h1 className="lp-title">
              Fleet Maintenance<br /><span className="hl">Made Intelligent</span>
            </h1>
            <p className="lp-subtitle">
              Track every asset, manage services, log breakdowns and keep your fleet running — all in one platform built for the way Australian operations actually work.
            </p>
            <div className="lp-hero-ctas">
              <button className="lp-btn-hero" onClick={scrollToLogin}>Login to MechIQ →</button>
              <a href="mailto:info@mechiq.com.au?subject=MechIQ Demo Request" className="lp-btn-hero-outline">
                Request a Demo
              </a>
            </div>
          </div>

          {/* Right — login card */}
          <div ref={loginCardRef} className="lp-login-card">
            <div className="lp-login-card-logo">
              <div className="wm">
                <span style={{ color:'var(--text-primary)' }}>MECH</span>
                <span style={{ color:'var(--accent)' }}>IQ</span>
              </div>
              <div className="tg">Fleet Maintenance Management</div>
            </div>

            <div className="lp-tabs">
              {[['login','Sign In'],['reset','Forgot Password']].map(([id,label]) => (
                <button key={id} className={`lp-tab${tab===id?' active':''}`}
                  onClick={() => { setTab(id); setErr(''); setMsg(''); }}>
                  {label}
                </button>
              ))}
            </div>

            <div className="lp-field">
              <label className="lp-label">Email Address</label>
              <input className="lp-input" type="email" placeholder="you@company.com"
                value={email} onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key==='Enter' && handle()} autoFocus />
            </div>
            {tab === 'login' && (
              <div className="lp-field">
                <label className="lp-label">Password</label>
                <input className="lp-input" type="password" placeholder="••••••••"
                  value={pw} onChange={e => setPw(e.target.value)}
                  onKeyDown={e => e.key==='Enter' && handle()} />
              </div>
            )}

            {err && <div className="lp-err">{err}</div>}
            {msg && <div className="lp-ok">{msg}</div>}

            <button className="lp-submit" onClick={handle} disabled={busy}>
              {busy ? 'Please wait…' : tab==='login' ? 'Sign In →' : 'Send Reset Email'}
            </button>

            <div style={{ textAlign:'center', marginTop:16, fontSize:11, color:'var(--text-faint)' }}>
              Need access? <a href="mailto:info@mechiq.com.au" style={{ color:'var(--accent)', textDecoration:'none' }}>Contact us</a> to get set up.
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <div className="lp-stats">
        {[['10+','Feature Modules'],['Real-time','Fleet Visibility'],['AI','Powered Insights'],['100%','Cloud Based']].map(([v,l]) => (
          <div key={l} className="lp-stat">
            <div className="lp-stat-val">{v}</div>
            <div className="lp-stat-lbl">{l}</div>
          </div>
        ))}
      </div>

      {/* ── Features ── */}
      <div className="lp-features">
        <div className="lp-sec-label">What MechIQ Does</div>
        <h2 className="lp-sec-title">Everything your team needs<br />in one place</h2>
        <p className="lp-sec-sub">From prestart checklists to AI-powered depreciation analysis — MechIQ covers the full lifecycle of fleet maintenance.</p>
        <div className="lp-features-grid">
          {FEATURES.map(f => (
            <div key={f.name} className="lp-feat-card">
              <span className="lp-feat-icon">{f.icon}</span>
              <div className="lp-feat-name">{f.name}</div>
              <div className="lp-feat-desc">{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── CTA ── */}
      <div className="lp-cta">
        <div className="lp-sec-label" style={{ justifyContent:'center', display:'flex' }}>Get Started</div>
        <h2 className="lp-sec-title">Ready to take control of your fleet?</h2>
        <p style={{ fontSize:16, color:'var(--text-muted)', margin:'12px auto 36px', maxWidth:480, lineHeight:1.7 }}>
          Contact us to set up your company account. We'll onboard you and have your fleet in MechIQ within 24 hours.
        </p>
        <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
          <button className="lp-btn-hero" onClick={scrollToLogin}>Login to MechIQ →</button>
          <a href="mailto:info@mechiq.com.au?subject=MechIQ Enquiry" className="lp-btn-hero-outline">
            Contact Us
          </a>
        </div>
        <p style={{ marginTop:18, fontSize:12, color:'var(--text-faint)' }}>
          Questions? <a href="mailto:info@mechiq.com.au" style={{ color:'var(--accent)', textDecoration:'none' }}>info@mechiq.com.au</a>
        </p>
      </div>

      {/* ── Footer ── */}
      <footer className="lp-footer">
        <div className="lp-footer-logo">
          <span style={{ color:'var(--text-primary)' }}>MECH</span>
          <span style={{ color:'var(--accent)' }}>IQ</span>
        </div>
        <p style={{ fontSize:12, color:'var(--text-muted)' }}>© 2026 MechIQ · Fleet Maintenance Management · Made in Australia</p>
        <a href="mailto:info@mechiq.com.au" style={{ fontSize:12, color:'var(--accent)', textDecoration:'none' }}>info@mechiq.com.au</a>
      </footer>

    </div>
  );
}

export default Login;
