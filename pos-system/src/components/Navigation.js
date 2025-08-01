import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navigation.css';

function Navigation() {
  const location = useLocation();
  
  const navItems = [
    { path: '/', label: 'ออเดอร์', icon: '🛒' },
    { path: '/menu', label: 'จัดการเมนู', icon: '🍽️' },
    { path: '/promotions', label: 'โปรโมชั่น', icon: '🎫' },
    { path: '/dashboard', label: 'Dashboard', icon: '📊' }
  ];

  return (
    <nav className="navigation">
      <div className="nav-brand">
        <h2>POS System</h2>
      </div>
      <div className="nav-items">
        {navItems.map(item => (
          <Link
            key={item.path}
            to={item.path}
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}

export default Navigation;
