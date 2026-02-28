import React, { useState } from 'react';
import { supabase } from './supabase';

function Signup({ onBackToLogin }) {
  const [companyName, setCompanyName] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSignup = async () => {
    if (!companyName || !name || !email || !password) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
      if (authError) throw authError;
      const { data: company, error: companyError } = await supabase
        .from('companies').insert({ name: companyName }).select().single();
      if (companyError) throw companyError;
      const { error: roleError } = await supabase
        .from('user_roles').insert({ email, name, role: 'admin', company_id: company.id });
      if (roleError) throw roleError;
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="login-page">
        <div className="login-card">
          <h1 className="login-title">MAINTAIN<span>IQ</span></h1>
          <p className="login-subtitle">You're all set! 🎉</p>
          <p style={{color:'#a0b0b0', marginBottom:'20px', textAlign:'center', fontSize:'14px'}}>
            Check your email to confirm your account, then log in.
          </p>
          <button className="btn-login" onClick={onBackToLogin}>Back to Login</button>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h1 className="login-title">MAINTAIN<span>IQ</span></h1>
        <p className="login-subtitle">Create your company account</p>
        <div className="login-form">
          <div className="login-field">
            <label>Company Name</label>
            <input
              type="text"
              placeholder="e.g. Acme Engineering"
              value={companyName}
              onChange={e => setCompanyName(e.target.value)}
            />
          </div>
          <div className="login-field">
            <label>Your Name</label>
            <input
              type="text"
              placeholder="e.g. John Smith"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>
          <div className="login-field">
            <label>Email</label>
            <input
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>
          <div className="login-field">
            <label>Password</label>
            <input
              type="password"
              placeholder="Min 6 characters"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>
          {error && <p className="login-error">{error}</p>}
          <button className="btn-login" onClick={handleSignup} disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
          <p style={{textAlign:'center', marginTop:'20px', color:'#a0b0b0', fontSize:'14px'}}>
            Already have an account?{' '}
            <span style={{color:'#00c2e0', cursor:'pointer'}} onClick={onBackToLogin}>
              Log in
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Signup;