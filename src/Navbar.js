import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './supabase';

// ─── Nav structure ───────────────────────────────────────────────────────────
// Each top-level item is either a direct link (no children) or a dropdown group.
// subPage is what gets passed to setCurrentPage — matches the tab IDs in each component.

const NAV_STRUCTURE = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    roles: ['admin','supervisor','technician','operator'],
    feature: 'dashboard',
  },
  {
    id: 'assets',
    label: 'Assets',
    roles: ['admin','supervisor'],
    feature: 'assets',
    children: [
      { id: 'assets', subPage: 'units',        label: 'Units',        roles: ['admin','supervisor'] },
      { id: 'assets', subPage: 'onboarding',   label: 'Onboarding',   roles: ['admin','supervisor'] },
      { id: 'assets', subPage: 'depreciation', label: 'Depreciation', roles: ['admin','supervisor'] },
      { id: 'assets', subPage: 'tracker',      label: 'Tracker',      roles: ['admin','supervisor'] },
    ],
  },
  {
    id: 'maintenance',
    label: 'Maintenance',
    roles: ['admin','supervisor','technician'],
    feature: 'maintenance',
    children: [
      { id: 'maintenance', subPage: 'scheduled',    label: 'Scheduled Service', roles: ['admin','supervisor','technician'] },
      { id: 'maintenance', subPage: 'work_orders',  label: 'Work Orders',       roles: ['admin','supervisor','technician'] },
      { id: 'maintenance', subPage: 'pm_tasks',     label: 'PM Tasks',          roles: ['admin','supervisor','technician'] },
      { id: 'maintenance', subPage: 'oil_sampling', label: 'Oil Sampling',      roles: ['admin','supervisor'] },
    ],
  },
  {
    id: 'forms',
    label: 'Forms',
    roles: ['admin','supervisor','technician','operator'],
    feature: 'prestart',
    children: [
      { id: 'forms', subPage: 'prestarts',      label: 'Prestarts',      roles: ['admin','supervisor','technician','operator'] },
      { id: 'forms', subPage: 'service_sheets', label: 'Service Sheets', roles: ['admin','supervisor','technician'] },
    ],
  },
  {
    id: 'scanner',
    label: 'Scanner',
    roles: ['technician','operator'],
    feature: 'scanner',
  },
  {
    id: 'reports',
    label: 'Reports',
    roles: ['admin','supervisor'],
    feature: 'reports',
    children: [
      { id: 'reports', subPage: 'overview',    label: 'Overview',    roles: ['admin','supervisor'] },
      { id: 'reports', subPage: 'downtime',    label: 'Downtime',    roles: ['admin','supervisor'] },
      { id: 'reports', subPage: 'costs',       label: 'Costs',       roles: ['admin','supervisor'] },
      { id: 'reports', subPage: 'compliance',  label: 'Compliance',  roles: ['admin','supervisor'] },
    ],
  },
  {
    id: 'admin',
    label: 'Admin',
    roles: ['admin'],
    feature: null,
    children: [
      { id: 'forms',   subPage: null, label: 'Form Builder', roles: ['admin'] },
      { id: 'users',   subPage: null, label: 'Users',        roles: ['admin'] },
      { id: 'export',  subPage: null, label: 'Data Export',  roles: ['admin'] },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    roles: ['admin','supervisor'],
    feature: null,
    children: [
      { id: 'settings', subPage: 'email',    label: 'Email Connection', roles: ['admin','supervisor'] },
      { id: 'settings', subPage: 'company',  label: 'Company',          roles: ['admin'] },
    ],
  },
];

// ─── Dropdown item component ──────────────────────────────────────────────────
function DropdownItem({ item, onNav, currentPage }) {
  const [hovered, setHovered] = useState(false);
  const isActive = currentPage === item.id;
  return (
    <div
      onClick={() => onNav(item.id, item.subPage)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '9px 18px',
        fontSize: '13px',
        cursor: 'pointer',
        color: isActive ? '#00ABE4' : '#1a2b3c',
        backgroundColor: hovered || isActive ? '#E9F1FA' : '#ffffff',
        borderBottom: '1px solid #f0f5fa',
        fontWeight: isActive ? 600 : 400,
        whiteSpace: 'nowrap',
        transition: 'background-color 0.12s',
      }}
    >
      {item.label}
    </div>
  );
}

// ─── Nav item (top level) ─────────────────────────────────────────────────────
function NavItem({ item, currentPage, onNav }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const hasChildren = item.children && item.children.length > 0;
  const isActive = currentPage === item.id || (hasChildren && item.children.some(c => c.id === currentPage));

  // Close on outside click (desktop)
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!hasChildren) {
    return (
      <li
        className={isActive ? 'active' : ''}
        onClick={() => onNav(item.id, null)}
        style={item.id === 'master' ? { color: '#00ABE4', fontWeight: 700 } : {}}
      >
        {item.label}
      </li>
    );
  }

  return (
    <li
      ref={ref}
      className={isActive ? 'active' : ''}
      style={{ position: 'relative', userSelect: 'none' }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      {/* Dropdown trigger — clicking parent also navigates to first child */}
      <span
        style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
        onClick={() => onNav(item.children[0].id, item.children[0].subPage)}
      >
        {item.label}
        <span style={{ fontSize: '9px', opacity: 0.7, marginTop: '1px' }}>▾</span>
      </span>

      {/* Dropdown panel */}
      {open && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#ffffff',
          border: '1px solid #d6e6f2',
          borderRadius: '8px',
          minWidth: '180px',
          zIndex: 2000,
          boxShadow: '0 8px 24px rgba(0,100,180,0.10)',
          overflow: 'hidden',
          marginTop: '6px',
        }}>
          {/* Arrow pointer */}
          <div style={{
            position: 'absolute', top: '-6px', left: '50%', transform: 'translateX(-50%)',
            width: 0, height: 0,
            borderLeft: '6px solid transparent',
            borderRight: '6px solid transparent',
            borderBottom: '6px solid #d6e6f2',
          }} />
          <div style={{
            position: 'absolute', top: '-5px', left: '50%', transform: 'translateX(-50%)',
            width: 0, height: 0,
            borderLeft: '6px solid transparent',
            borderRight: '6px solid transparent',
            borderBottom: '6px solid #ffffff',
          }} />
          {item.children.map(child => (
            <DropdownItem key={`${child.id}-${child.subPage}`} item={child} onNav={onNav} currentPage={currentPage} />
          ))}
        </div>
      )}
    </li>
  );
}

// ─── Mobile accordion item ────────────────────────────────────────────────────
function MobileNavItem({ item, currentPage, onNav }) {
  const [expanded, setExpanded] = useState(false);
  const hasChildren = item.children && item.children.length > 0;
  const isActive = currentPage === item.id || (hasChildren && item.children.some(c => c.id === currentPage));

  if (!hasChildren) {
    return (
      <li
        className={isActive ? 'active' : ''}
        onClick={() => onNav(item.id, null)}
        style={item.id === 'master' ? { color: '#00ABE4', fontWeight: 700 } : {}}
      >
        {item.label}
      </li>
    );
  }

  return (
    <>
      <li
        className={isActive ? 'active' : ''}
        onClick={() => setExpanded(e => !e)}
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
      >
        <span>{item.label}</span>
        <span style={{ fontSize: '10px', opacity: 0.6 }}>{expanded ? '▴' : '▾'}</span>
      </li>
      {expanded && item.children.map(child => (
        <li
          key={`${child.id}-${child.subPage}`}
          onClick={() => onNav(child.id, child.subPage)}
          style={{
            paddingLeft: '28px',
            fontSize: '13px',
            color: currentPage === child.id ? '#00ABE4' : '#3d5166',
            backgroundColor: '#f5f9fd',
            borderLeft: '3px solid #00ABE4',
          }}
        >
          {child.label}
        </li>
      ))}
    </>
  );
}

// ─── Main Navbar ──────────────────────────────────────────────────────────────
function Navbar({ currentPage, setCurrentPage, onLogout, session, userRole, viewingCompany, onSelectCompany, onExitCompany }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [companyDropdownOpen, setCompanyDropdownOpen] = useState(false);
  const companyDropdownRef = useRef(null);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  const features = viewingCompany?.features || userRole?.company_features || {};
  const isMaster = userRole?.role === 'master';
  const role = viewingCompany ? 'admin' : (userRole?.role || 'operator');

  useEffect(() => { if (isMaster) fetchCompanies(); }, [isMaster]);

  useEffect(() => {
    const handler = (e) => {
      if (companyDropdownRef.current && !companyDropdownRef.current.contains(e.target))
        setCompanyDropdownOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchCompanies = async () => {
    const { data } = await supabase.from('companies').select('id, name, status').eq('status', 'active').order('name');
    setCompanies(data || []);
  };

  // Navigate — page + optional subPage hint passed up to App.js
  const handleNav = (id, subPage) => {
    setCurrentPage(id, subPage);
    setMenuOpen(false);
  };

  // Filter top-level items by role + feature flags
  const visibleItems = (() => {
    if (isMaster && !viewingCompany) {
      return [
        ...NAV_STRUCTURE.filter(item => item.id !== 'admin' && item.id !== 'settings'),
        { id: 'master', label: 'Master Admin', roles: ['master'] },
      ];
    }
    return NAV_STRUCTURE.filter(item => {
      if (!item.roles.includes(role)) return false;
      if (item.feature && features[item.feature] === false) return false;
      return true;
    }).map(item => ({
      ...item,
      children: item.children
        ? item.children.filter(c => c.roles.includes(role))
        : undefined,
    }));
  })();

  return (
    <>
      {/* Master admin viewing-as banner */}
      {isMaster && viewingCompany && (
        <div style={{
          backgroundColor: '#0077cc', color: '#fff', padding: '6px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          fontSize: '13px', fontWeight: 700,
        }}>
          <span>Viewing as: <strong>{viewingCompany.name}</strong> (Admin)</span>
          <button onClick={onExitCompany} style={{
            backgroundColor: '#fff', color: '#0077cc', border: 'none',
            padding: '4px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 700, fontSize: '12px',
          }}>Exit Company View</button>
        </div>
      )}

      <div className="navbar">

        {/* Logo */}
        <div
          className="navbar-brand"
          onClick={() => handleNav(isMaster && !viewingCompany ? 'master' : 'dashboard', null)}
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
        >
          <span style={{
            fontFamily: "'Barlow Condensed', sans-serif", fontSize: '34px', fontWeight: 800,
            letterSpacing: '2px', color: '#ffffff', WebkitTextStroke: '1.5px #000000', textTransform: 'uppercase',
          }}>MECH</span>
          <span style={{
            fontFamily: "'Barlow Condensed', sans-serif", fontSize: '34px', fontWeight: 800,
            letterSpacing: '2px', color: '#00ABE4', WebkitTextStroke: '1.5px #000000',
            textTransform: 'uppercase', marginLeft: '8px',
          }}>IQ</span>
        </div>

        {/* Hamburger */}
        <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? 'X' : '='}
        </button>

        <nav className={menuOpen ? 'nav-open' : ''}>
          <ul>
            {visibleItems.map(item =>
              menuOpen
                ? <MobileNavItem key={item.id} item={item} currentPage={currentPage} onNav={handleNav} />
                : <NavItem key={item.id} item={item} currentPage={currentPage} onNav={handleNav} />
            )}
          </ul>

          {/* User area */}
          <div className="navbar-user">

            {/* Master admin — View Company switcher */}
            {isMaster && (
              <div ref={companyDropdownRef} style={{ position: 'relative', marginRight: '12px' }}>
                <button
                  onClick={() => setCompanyDropdownOpen(!companyDropdownOpen)}
                  style={{
                    backgroundColor: '#00ABE4', color: '#fff', border: '1px solid #0088b8',
                    padding: '5px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px',
                    fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px',
                  }}
                >
                  {viewingCompany ? viewingCompany.name : 'View Company'} ▾
                </button>
                {companyDropdownOpen && (
                  <div style={{
                    position: 'absolute', right: 0, top: '110%', backgroundColor: '#ffffff',
                    border: '1px solid #d6e6f2', borderRadius: '8px', minWidth: '200px',
                    zIndex: 2000, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', overflow: 'hidden',
                  }}>
                    {viewingCompany && (
                      <div
                        onClick={() => { onExitCompany(); setCompanyDropdownOpen(false); }}
                        style={{ padding: '10px 14px', color: '#0077cc', fontSize: '12px', fontWeight: 700, cursor: 'pointer', borderBottom: '1px solid #E9F1FA', backgroundColor: '#E9F1FA' }}
                      >
                        Exit Company View
                      </div>
                    )}
                    {companies.length === 0
                      ? <div style={{ padding: '12px 14px', color: '#7a92a8', fontSize: '12px' }}>No active companies</div>
                      : companies.map(c => (
                        <div
                          key={c.id}
                          onClick={() => { onSelectCompany(c); setCompanyDropdownOpen(false); setMenuOpen(false); }}
                          style={{
                            padding: '10px 14px', cursor: 'pointer', fontSize: '13px',
                            color: viewingCompany?.id === c.id ? '#00ABE4' : '#1a2b3c',
                            backgroundColor: viewingCompany?.id === c.id ? '#E9F1FA' : 'transparent',
                            borderBottom: '1px solid #E9F1FA',
                          }}
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#E9F1FA'}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor = viewingCompany?.id === c.id ? '#E9F1FA' : 'transparent'}
                        >
                          {c.name}
                        </div>
                      ))
                    }
                  </div>
                )}
              </div>
            )}

            <span className="logged-in-as">{userRole?.name || session?.user?.email}</span>
            <span style={{
              backgroundColor: isMaster ? '#00ABE4' : '#E9F1FA',
              color: isMaster ? '#fff' : '#1a2b3c',
              border: '1px solid #00ABE4',
              padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600,
            }}>
              {isMaster ? 'master' : (userRole?.role || 'operator')}
            </span>
            <button className="btn-logout" onClick={onLogout}>Logout</button>
          </div>
        </nav>
      </div>
    </>
  );
}

export default Navbar;
