import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';

const CSS = `
  @keyframes login-beam {
    0%   { transform: translateY(-100%) rotate(35deg); opacity: 0; }
    15%  { opacity: 0.6; }
    85%  { opacity: 0.6; }
    100% { transform: translateY(200%) rotate(35deg); opacity: 0; }
  }
  @keyframes grid-drift {
    0%   { background-position: 0 0; }
    100% { background-position: 0 48px; }
  }
  @keyframes border-glow {
    0%,100% { box-shadow: 0 0 20px rgba(0,212,255,0.1), inset 0 0 20px rgba(0,0,0,0.3); }
    50%     { box-shadow: 0 0 40px rgba(0,212,255,0.2), inset 0 0 20px rgba(0,0,0,0.3); }
  }
  @keyframes float-up {
    from { opacity:0; transform: translateY(24px); }
    to   { opacity:1; transform: translateY(0); }
  }
  @keyframes logo-pulse {
    0%,100% { filter: drop-shadow(0 0 8px rgba(0,212,255,0.4)); }
    50%     { filter: drop-shadow(0 0 20px rgba(0,212,255,0.8)); }
  }
  @keyframes scan {
    0%   { top:-1px; opacity:0.8; }
    100% { top:100%; opacity:0; }
  }
  .login-bg {
    min-height: 100vh;
    background: #050a12;
    display: flex; align-items: center; justify-content: center;
    position: relative; overflow: hidden;
  }
  .login-grid {
    position: absolute; inset:0;
    background-image:
      linear-gradient(rgba(0,180,255,0.025) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0,180,255,0.025) 1px, transparent 1px);
    background-size: 48px 48px;
    animation: grid-drift 4s linear infinite;
  }
  .login-beam {
    position:absolute; width:2px;
    background:linear-gradient(180deg,transparent,rgba(0,212,255,0.5),transparent);
    animation:login-beam 6s ease-in-out infinite;
  }
  .login-card {
    background: rgba(10,22,40,0.9);
    border: 1px solid rgba(0,180,255,0.2);
    border-radius: 20px; padding: 48px;
    width: 420px; max-width: calc(100vw - 40px);
    position: relative; z-index: 1;
    backdrop-filter: blur(20px);
    animation: border-glow 4s ease-in-out infinite, float-up 0.6s ease both;
    overflow: hidden;
  }
  .login-card::before {
    content:''; position:absolute; top:0;left:0;right:0; height:1px;
    background:linear-gradient(90deg,transparent,rgba(0,212,255,0.6),transparent);
  }
  .login-scan {
    position:absolute; left:0;right:0; height:1px;
    background:linear-gradient(90deg,transparent,rgba(0,212,255,0.4),transparent);
    animation:scan 4s ease-in-out infinite;
    pointer-events:none;
  }
  .login-input-wrap { position:relative; margin-bottom:16px; }
  .login-input {
    width:100%; padding:13px 16px;
    background:rgba(5,10,18,0.8) !important;
    border:1px solid rgba(0,180,255,0.15) !important;
    border-radius:8px !important; color:#e8f4ff !important;
    font-family:'Rajdhani',sans-serif !important; font-size:14px !important;
    letter-spacing:0.3px; outline:none !important;
    transition:all 0.2s !important;
  }
  .login-input:focus {
    border-color:rgba(0,212,255,0.5) !important;
    box-shadow:0 0 0 3px rgba(0,212,255,0.08), 0 0 16px rgba(0,212,255,0.1) !important;
  }
  .login-input::placeholder { color:rgba(122,184,232,0.35) !important; }
  .login-btn {
    width:100%; padding:14px;
    background:linear-gradient(135deg, rgba(0,153,204,0.9), rgba(0,80,140,0.9));
    border:1px solid rgba(0,212,255,0.4);
    border-radius:8px; color:#fff;
    font-family:'Rajdhani',sans-serif; font-size:14px; font-weight:700;
    letter-spacing:2px; text-transform:uppercase;
    cursor:pointer; transition:all 0.2s; margin-top:8px;
    box-shadow:0 4px 20px rgba(0,180,255,0.25);
    position:relative; overflow:hidden;
  }
  .login-btn:hover {
    background:linear-gradient(135deg,rgba(0,180,255,0.9),rgba(0,100,180,0.9));
    box-shadow:0 6px 28px rgba(0,180,255,0.4); transform:translateY(-1px);
  }
  .login-btn:disabled { opacity:0.4; cursor:not-allowed; transform:none; }
  .login-tab {
    flex:1; padding:10px; background:transparent;
    border:none; border-bottom:2px solid transparent;
    color:rgba(122,184,232,0.5); font-family:'Rajdhani',sans-serif;
    font-size:12px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase;
    cursor:pointer; transition:all 0.2s;
  }
  .login-tab.active { color:#00d4ff; border-bottom-color:#00d4ff; }
  .login-tab:hover:not(.active) { color:rgba(122,184,232,0.8); }
`;

function Login({ onAuth }) {
  const [tab,  setTab]  = useState('login');
  const [email, setEmail] = useState('');
  const [pw,    setPw]    = useState('');
  const [name,  setName]  = useState('');
  const [err,   setErr]   = useState('');
  const [msg,   setMsg]   = useState('');
  const [busy,  setBusy]  = useState(false);
  const [vis,   setVis]   = useState(false);

  useEffect(() => {
    if (!document.getElementById('login-css')) {
      const s = document.createElement('style'); s.id='login-css'; s.textContent=CSS; document.head.appendChild(s);
    }
    setTimeout(() => setVis(true), 100);
  }, []);

  const handle = async () => {
    setErr(''); setMsg(''); setBusy(true);
    try {
      if (tab === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password: pw });
        if (error) throw error;
        if (data.session) onAuth(data.session);
      } else if (tab === 'register') {
        const { error } = await supabase.auth.signUp({ email, password: pw, options: { data: { name } } });
        if (error) throw error;
        setMsg('Registration submitted. Await admin approval to access the system.');
        setTab('login');
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
        if (error) throw error;
        setMsg('Reset transmission sent. Check your email.');
      }
    } catch (e) { setErr(e.message); }
    setBusy(false);
  };

  const beams = [
    { left:'15%', height:'60%', delay:'0s' },
    { left:'55%', height:'80%', delay:'2s' },
    { left:'80%', height:'50%', delay:'4s' },
  ];

  return (
    <div className="login-bg">
      <div className="login-grid" />
      {beams.map((b,i) => (
        <div key={i} className="login-beam" style={{ left:b.left, height:b.height, top:'-20%', animationDelay:b.delay }} />
      ))}

      {/* Radial glow behind card */}
      <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:600, height:400, background:'radial-gradient(ellipse, rgba(0,120,200,0.08) 0%, transparent 70%)', pointerEvents:'none' }} />

      <div className="login-card" style={{ opacity:vis?1:0, transition:'opacity 0.4s ease' }}>
        <div className="login-scan" />

        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:36 }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:2, marginBottom:12, animation:'logo-pulse 3s ease-in-out infinite' }}>
            <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:42, fontWeight:900, color:'#e8f4ff', letterSpacing:'3px', lineHeight:1 }}>MECH</span>
            <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:42, fontWeight:900, color:'#00d4ff', letterSpacing:'3px', lineHeight:1 }}>IQ</span>
          </div>
          <div style={{ fontSize:10, color:'rgba(0,212,255,0.6)', letterSpacing:'3px', textTransform:'uppercase', fontFamily:'Rajdhani,sans-serif', fontWeight:700 }}>
            Neural Maintenance Intelligence
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', borderBottom:'1px solid rgba(0,180,255,0.1)', marginBottom:28, gap:0 }}>
          {[['login','Access'],['register','Register'],['reset','Reset']].map(([id,label]) => (
            <button key={id} className={`login-tab${tab===id?' active':''}`} onClick={() => { setTab(id); setErr(''); setMsg(''); }}>
              {label}
            </button>
          ))}
        </div>

        {/* Fields */}
        {tab === 'register' && (
          <div className="login-input-wrap">
            <label style={{ fontSize:10, color:'rgba(0,212,255,0.5)', letterSpacing:'1.5px', textTransform:'uppercase', fontFamily:'Rajdhani,sans-serif', fontWeight:700, display:'block', marginBottom:6 }}>Full Name</label>
            <input className="login-input" type="text" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} />
          </div>
        )}
        <div className="login-input-wrap">
          <label style={{ fontSize:10, color:'rgba(0,212,255,0.5)', letterSpacing:'1.5px', textTransform:'uppercase', fontFamily:'Rajdhani,sans-serif', fontWeight:700, display:'block', marginBottom:6 }}>Email Address</label>
          <input className="login-input" type="email" placeholder="operator@company.com" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key==='Enter' && handle()} />
        </div>
        {tab !== 'reset' && (
          <div className="login-input-wrap">
            <label style={{ fontSize:10, color:'rgba(0,212,255,0.5)', letterSpacing:'1.5px', textTransform:'uppercase', fontFamily:'Rajdhani,sans-serif', fontWeight:700, display:'block', marginBottom:6 }}>Password</label>
            <input className="login-input" type="password" placeholder="••••••••" value={pw} onChange={e => setPw(e.target.value)} onKeyDown={e => e.key==='Enter' && handle()} />
          </div>
        )}

        {err && (
          <div style={{ padding:'10px 14px', borderRadius:8, background:'rgba(255,51,102,0.08)', border:'1px solid rgba(255,51,102,0.3)', color:'#ff3366', fontSize:13, fontFamily:'Rajdhani,sans-serif', marginBottom:12 }}>
            {err}
          </div>
        )}
        {msg && (
          <div style={{ padding:'10px 14px', borderRadius:8, background:'rgba(0,255,136,0.08)', border:'1px solid rgba(0,255,136,0.3)', color:'#00ff88', fontSize:13, fontFamily:'Rajdhani,sans-serif', marginBottom:12 }}>
            {msg}
          </div>
        )}

        <button className="login-btn" onClick={handle} disabled={busy}>
          {busy ? '⟳ Authenticating…' : tab==='login' ? '→ Initialize Session' : tab==='register' ? '→ Request Access' : '→ Send Reset'}
        </button>

        <div style={{ textAlign:'center', marginTop:24, fontSize:11, color:'rgba(0,180,255,0.25)', letterSpacing:'1px', fontFamily:'Rajdhani,sans-serif' }}>
          MechIQ · Powered by AI · v3.0
        </div>
      </div>
    </div>
  );
}

export default Login;
