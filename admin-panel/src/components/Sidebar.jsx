import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingCart, Users, Settings, LogOut, MapPin } from 'lucide-react';

export default function Sidebar() {
  const navItems = [
    { icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/' },
    { icon: <Package size={20} />, label: 'Products', path: '/products' },
    { icon: <ShoppingCart size={20} />, label: 'Orders', path: '/orders' },
    { icon: <MapPin size={20} />, label: 'Store Layout', path: '/inventory' },
    { icon: <Users size={20} />, label: 'Customers', path: '/customers' },
    { icon: <LayoutDashboard size={20} />, label: 'Hero Slider', path: '/slider' },
    { icon: <Settings size={20} />, label: 'Settings', path: '/settings' },
  ];

  return (
    <aside className="admin-sidebar glass" style={{
      width: 'var(--sidebar-width)',
      height: '100vh',
      position: 'fixed',
      left: 0,
      top: 0,
      padding: '32px 20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '40px',
      zIndex: 100
    }}>
      <div className="admin-logo" style={{
        fontSize: '24px',
        fontWeight: 800,
        color: 'var(--primary-blue)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        Hub<span style={{ color: 'var(--text-main)' }}>Admin</span>
      </div>

      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              borderRadius: 'var(--radius-sm)',
              textDecoration: 'none',
              color: isActive ? 'white' : 'var(--text-muted)',
              background: isActive ? 'var(--primary-blue)' : 'transparent',
              fontWeight: 600,
              transition: 'all 0.2s'
            })}
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button 
          className="btn" 
          onClick={() => {
            localStorage.removeItem('ehub_token');
            localStorage.removeItem('ehub_user');
            window.location.reload();
          }}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: 'var(--danger)',
            background: 'transparent',
            padding: '12px 16px'
          }}
        >
          <LogOut size={20} />
          Logout
        </button>
      </div>

    </aside>
  );
}
