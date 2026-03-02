import React, { useState } from 'react';

function Navbar({ currentPage, setCurrentPage, onLogout, session, userRole }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const features = userRole?.company_features || {};
  const isMaster = userRole?.role === 'master';

  const menuItems = [
    { id: 'dashboard',   label: 'Dashboard',   roles: ['admin','supervisor','technician','operator'], feature: 'dashboard' },
    { id: 'assets',      label: 'Assets',       roles: ['admin','supervisor'],                         feature: 'assets' },
    { id: 'downtime',    label: 'Downtime',     roles: ['admin','supervisor','technician'],             feature: 'downtime' },
    { id: 'maintenance', label: 'Maintenance',  roles: ['admin','supervisor','technician'],             feature: 'maintenance' },
    { id: 'prestart',    label: 'Prestarts',    roles: ['admin','supervisor','technician','operator'],  feature: 'prestart' },
    { id: 'scanner',     label: '📷 Scanner',   roles: ['technician','operator'],                       feature: 'scanner' },
    { id: 'reports',     label: 'Reports',      roles: ['admin','supervisor'],                          feature: 'reports' },
    { id: 'users',       label: 'Users',        roles: ['admin'],                                       feature: 'users' },
  ];

  const handleNav = (id) => { setCurrentPage(id); setMenuOpen(false); };

  // Master sees all nav items + a Master Admin tab
  const visibleItems = isMaster
    ? [
        ...menuItems,
        { id: 'master', label: '⚙️ Master Admin', roles: ['master'] }
      ]
    : menuItems.filter(item =>
        item.roles.includes(userRole?.role || 'operator') &&
        (features[item.feature] !== false)
      );

  return (
    <div className="navbar">
      <div className="navbar-brand" onClick={() => handleNav('dashboard')} style={{ cursor: 'pointer' }}>
        <span className="brand-white">MAINTAIN</span><span className="brand-cyan">IQ</span>
      </div>
      <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
        {menuOpen ? '✕' : '☰'}
      </button>
      <nav className={menuOpen ? 'nav-open' : ''}>
        <ul>
          {visibleItems.map(item => (
            <li
              key={item.id}
              className={currentPage === item.id ? 'active' : ''}
              onClick={() => handleNav(item.id)}
              style={item.id === 'master' ? { color: '#ff6b00' } : {}}
            >
              {item.label}
            </li>
          ))}
        </ul>
        <div className="navbar-user">
          <span className="logged-in-as">{userRole?.name || session?.user?.email}</span>
          <span className="role-badge" style={{ backgroundColor: isMaster ? '#ff6b00' : undefined }}>
            {isMaster ? 'master' : (userRole?.role || 'operator')}
          </span>
          <button className="btn-logout" onClick={onLogout}>Logout</button>
        </div>
      </nav>
    </div>
  );
}

export default Navbar;
