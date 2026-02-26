import React from 'react';

function Navbar({ currentPage, setCurrentPage, onLogout, session }) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'assets', label: 'Assets' },
    { id: 'downtime', label: 'Downtime' },
    { id: 'maintenance', label: 'Maintenance' },
    { id: 'reports', label: 'Reports' },
  ];

  return (
    <div className="navbar">
      <div className="navbar-brand">
        <h2>MaintainIQ</h2>
      </div>
      <nav>
        <ul>
          {menuItems.map(item => (
            <li
              key={item.id}
              className={currentPage === item.id ? 'active' : ''}
              onClick={() => setCurrentPage(item.id)}
            >
              {item.label}
            </li>
          ))}
        </ul>
      </nav>
      <div className="navbar-footer">
        <p className="logged-in-as">{session?.user?.email}</p>
        <button className="btn-logout" onClick={onLogout}>Logout</button>
      </div>
    </div>
  );
}

export default Navbar;