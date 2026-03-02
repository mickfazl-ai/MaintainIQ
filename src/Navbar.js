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

  const visibleItems = isMaster
    ? [] // master uses their own panel
    : menuItems.filter(item =>
        item.roles.includes(userRole?.role || 'operator') &&
        (features[item.feature] !== false)
      );

  return (
    <div className="navbar">
      <div className="navbar-brand" onClick={() => handleNav(isMaster ? 'master' : 'dashboard')} style={{ cursor: 'pointer' }}>
        <span className="brand-white">MAINTAIN</span><span className="brand-cyan">IQ</span>
      </div>
      <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
        {menuOpen ? '✕' : '☰'}
      </button>
      <nav className={menuOpen ? 'nav-open' : ''}>
        <ul>
          {isMaster ? (
            <li className={currentPage === 'master' ? 'active' : ''} onClick={() => handleNav('master')}>
              ⚙️ Master Admin
            </li>
          ) : (
            visibleItems.map(item => (
              <li key={item.id} className={currentPage === item.id ? 'active' : ''} onClick={() => handleNav(item.id)}>
                {item.label}
              </li>
            ))
          )}
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
