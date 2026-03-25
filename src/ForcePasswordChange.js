import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';

export default function ForcePasswordChange({ session, onComplete }) {
  const [pw,    setPw]    = useState('');
  const [pw2,   setPw2]   = useState('');
  const [err,   setErr]   = useState('');
  const [busy,  setBusy]  = useState(false);
  const [done,  setDone]  = useState(false);

  useEffect(() => {
    if (!document.getElementById('fpc-css')) {
      const s = document.createElement('style');
      s.id = 'fpc-css';
      s.textContent = `
        .fpc-bg { position:fixed; inset:0; background:rgba(26,36,51,0.6); backdrop-filter:blur(6px); z-index:9999; display:flex; align-items:center; justify-content:center; padding:16px; }
        .fpc-card { background:#fff; border-radius:12px; width:100%; max-width:420px; padding:36px 32px; box-shadow:0 24px 80px rgba(0,0,0,0.25); border-top:3px solid #2d8cf0; }
        .fpc-logo { font-family:'Barlow Condensed',sans-serif; font-size:22px; font-weight:900; letter-spacing:4px; color:#1a2433; text-align:center; margin-bottom:6px; }
        .fpc-logo em { color:#2d8cf0; font-style:normal; }
        .fpc-badge { text-align:center; margin-bottom:20px; }
        .fpc-badge span { display:inline-block; padding:4px 12px; background:#fef9c3; border:1px solid #fde047; border-radius:20px; font-size:11px; font-weight:700; color:#713f12; letter-spacing:0.5px; }
        .fpc-title { font-size:20px; font-weight:800; color:#1a2433; text-align:center; margin-bottom:6px; }
        .fpc-sub { font-size:13px; color:#6b7a8d; text-align:center; margin-bottom:24px; line-height:1.6; }
        .fpc-field { margin-bottom:14px; }
        .fpc-lbl { display:block; font-size:10px; font-weight:700; color:#8a96a3; letter-spacing:1.2px; text-transform:uppercase; margin-bottom:5px; }
        .fpc-inp { width:100%; padding:10px 12px; border:1px solid #dde2ea; border-radius:6px; font-size:14px; font-family:'Barlow',sans-serif; color:#1a2433; background:#f7f9fc; outline:none; box-sizing:border-box; transition:border-color 0.13s; }
        .fpc-inp:focus { border-color:#2d8cf0; background:#fff; box-shadow:0 0 0 3px rgba(45,140,240,0.1); }
        .fpc-rules { font-size:11px; color:#8a96a3; margin-bottom:16px; line-height:1.7; }
        .fpc-rules li { margin-left:16px; }
        .fpc-btn { width:100%; padding:12px; border-radius:8px; background:#2d8cf0; border:none; color:#fff; font-size:14px; font-weight:700; font-family:'Barlow',sans-serif; cursor:pointer; transition:background 0.13s; }
        .fpc-btn:hover { background:#1a7de8; }
        .fpc-btn:disabled { opacity:0.5; cursor:not-allowed; }
        .fpc-err { padding:8px 12px; background:#fff5f5; border:1px solid #fecaca; border-radius:6px; color:#991b1b; font-size:12px; margin-bottom:12px; }
        .fpc-ok { text-align:center; padding:12px; background:#f0fdf4; border:1px solid #bbf7d0; border-radius:8px; color:#166534; font-size:14px; font-weight:600; margin-bottom:16px; }
        .fpc-strength { height:4px; border-radius:2px; margin-top:4px; transition:all 0.2s; }
      `;
      document.head.appendChild(s);
    }
  }, []);

  const strength = (p) => {
    let score = 0;
    if (p.length >= 8)  score++;
    if (p.length >= 12) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    return score;
  };

  const strengthColor = (s) => ['#ef4444','#f97316','#eab308','#22c55e','#16a34a'][Math.min(s,4)];
  const strengthLabel = (s) => ['Very weak','Weak','Fair','Strong','Very strong'][Math.min(s,4)];

  const handleSubmit = async () => {
    setErr('');
    if (pw.length < 8) { setErr('Password must be at least 8 characters.'); return; }
    if (pw !== pw2)    { setErr('Passwords do not match.'); return; }
    if (strength(pw) < 2) { setErr('Please choose a stronger password.'); return; }

    setBusy(true);
    try {
      // Update password in Supabase Auth
      const { error } = await supabase.auth.updateUser({ password: pw });
      if (error) throw error;

      // Clear force_password_change flag in user_roles
      await supabase.from('user_roles')
        .update({ force_password_change: false })
        .eq('email', session.user.email);

      setDone(true);
      setTimeout(() => onComplete(), 1800);
    } catch(e) {
      setErr(e.message);
    }
    setBusy(false);
  };

  const s = strength(pw);

  return (
    <div className="fpc-bg">
      <div className="fpc-card">
        <div className="fpc-logo">MECH<em>IQ</em></div>
        <div className="fpc-badge"><span>First Login — Action Required</span></div>

        {done ? (
          <>
            <div className="fpc-ok">Password updated successfully — logging you in…</div>
          </>
        ) : (
          <>
            <div className="fpc-title">Set Your Password</div>
            <div className="fpc-sub">
              Your account was created with a temporary password.<br />
              Please set a new secure password to continue.
            </div>

            {err && <div className="fpc-err">{err}</div>}

            <div className="fpc-field">
              <label className="fpc-lbl">New Password</label>
              <input className="fpc-inp" type="password" placeholder="Enter new password"
                value={pw} onChange={e => setPw(e.target.value)} autoFocus />
              {pw && (
                <>
                  <div className="fpc-strength" style={{ width:`${(s/5)*100}%`, background:strengthColor(s) }} />
                  <div style={{ fontSize:10, color:strengthColor(s), marginTop:3, fontWeight:600 }}>{strengthLabel(s)}</div>
                </>
              )}
            </div>
            <div className="fpc-field">
              <label className="fpc-lbl">Confirm Password</label>
              <input className="fpc-inp" type="password" placeholder="Repeat new password"
                value={pw2} onChange={e => setPw2(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
            </div>

            <ul className="fpc-rules">
              <li>Minimum 8 characters</li>
              <li>Mix of uppercase, numbers and symbols recommended</li>
              <li>Do not reuse your temporary password</li>
            </ul>

            <button className="fpc-btn" onClick={handleSubmit} disabled={busy}>
              {busy ? 'Updating…' : 'Set Password & Continue →'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
