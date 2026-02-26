import React, { useState, useEffect } from 'react';
import './App.css';
import Navbar from './Navbar';
import Dashboard from './Dashboard';
import Assets from './Assets';
import Downtime from './Downtime';
import Maintenance from './Maintenance';
import Reports from './Reports';
import Login from './Login';
import { supabase } from './supabase';

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const renderPage = () => {
    switch(currentPage) {
      case 'dashboard': return <Dashboard />;
      case 'assets': return <Assets />;
      case 'downtime': return <Downtime />;
      case 'maintenance': return <Maintenance />;
      case 'reports': return <Reports />;
      default: return <Dashboard />;
    }
  };

  if (loading) return <div style={{color:'white', padding:'50px', textAlign:'center'}}>Loading...</div>;

  if (!session) return <Login />;

  return (
    <div className="App">
      <Navbar currentPage={currentPage} setCurrentPage={setCurrentPage} onLogout={handleLogout} session={session} />
      <div className="main-content">
        {renderPage()}
      </div>
    </div>
  );
}

export default App;