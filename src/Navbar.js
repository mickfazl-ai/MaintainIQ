import React, { useState } from 'react';

function Navbar({ currentPage, setCurrentPage, onLogout, session }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'assets', label: 'Assets' },
    { id: 'downtime', label: 'Downtime' },
    { id: 'maintenance', label: 'Maintenance' },
    { id: 'reports', label: 'Reports' },
  ];

  const handleNav = (id) => {
    setCurrentPage(id);
    setMenuOpen(false);
  };

  return (
    <div className="navbar">
      <div className="navbar-brand">
        <h2>MaintainIQ</h2>
      </div>
      <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
        {menuOpen ? '✕' : '☰'}
      </button>
      <nav className={menuOpen ? 'nav-open' : ''}>
        <ul>
          {menuItems.map(item => (
            <li
              key={item.id}
              className={currentPage === item.id ? 'active' : ''}
              onClick={() => handleNav(item.id)}
            >
              {item.label}
            </li>
          ))}
        </ul>
        <div className="navbar-footer">
          <p className="logged-in-as">{session?.user?.email}</p>
          <button className="btn-logout" onClick={onLogout}>Logout</button>
        </div>
      </nav>
    </div>
  );
}

export default Navbar;