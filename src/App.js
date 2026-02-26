import React, { useState } from 'react';
import './App.css';
import Navbar from './Navbar';
import Dashboard from './Dashboard';
import Assets from './Assets';
import Downtime from './Downtime';
import Maintenance from './Maintenance';
import Reports from './Reports';

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');

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

  return (
    <div className="App">
      <Navbar currentPage={currentPage} setCurrentPage={setCurrentPage} />
      <div className="main-content">
        {renderPage()}
      </div>
    </div>
  );
}

export default App;