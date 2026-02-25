import React, { useState } from 'react';
import './App.css';
import Navbar from './Navbar';
import Dashboard from './Dashboard';
import Assets from './Assets';

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');

  const renderPage = () => {
    switch(currentPage) {
      case 'dashboard': return <Dashboard />;
      case 'assets': return <Assets />;
      case 'downtime': return <h2>Downtime Page - Coming Soon</h2>;
      case 'maintenance': return <h2>Maintenance Page - Coming Soon</h2>;
      case 'reports': return <h2>Reports Page - Coming Soon</h2>;
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