import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, Package, ShoppingCart, Users, Settings, 
  LogOut, MapPin, ShieldAlert, Database, Globe, Zap, Activity 
} from 'lucide-react';

export default function Sidebar() {
  const user = JSON.parse(localStorage.getItem('ehub_user') || '{}');
  const role = user.role || 'admin';
  const isSuper = role === 'super';
  const isAccountant = role === 'accountant';
  const isMarketing = role === 'marketing';

  // Define visibility for items based on role
  const navItems = [
    { icon: <LayoutDashboard size={20} />, label: isAccountant ? 'Finance Dash' : 'Dashboard', path: '/', visible: true },
    { icon: <Package size={20} />, label: 'Products', path: '/products', visible: !isAccountant },
    { icon: <ShoppingCart size={20} />, label: isAccountant ? 'Audits / Orders' : 'Orders', path: '/orders', visible: !isMarketing },
    { icon: <MapPin size={20} />, label: 'Store Layout', path: '/inventory', visible: !isAccountant && !isMarketing },
    { icon: <Users size={20} />, label: isAccountant ? 'Billing List' : 'Customers', path: '/customers', visible: !isMarketing },
    { icon: <LayoutDashboard size={20} />, label: 'Hero Slider', path: '/slider', visible: !isAccountant },
    { icon: <Settings size={20} />, label: 'Settings', path: '/settings', visible: !isMarketing },
  ].filter(item => item.visible);

  const superItems = [
    { icon: <ShieldAlert size={20} />, label: 'Global Overview', path: '/super/dashboard' },
    { icon: <MapPin size={20} />, label: 'Branches', path: '/super/branches' },
    { icon: <Users size={20} />, label: 'Admin Control', path: '/super/admins' },
    { icon: <Database size={20} />, label: 'System Logs', path: '/super/logs' },
    { icon: <Activity size={20} />, label: 'Traffic Control', path: '/super/traffic' },
    { icon: <Globe size={20} />, label: 'Super Settings', path: '/super/settings' },
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

      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px', overflowY: 'auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', padding: '0 16px 8px 16px' }}>
            {isAccountant ? 'Financial Control' : 
             isMarketing ? 'Promotion & Analytics' : 
             role === 'branch_admin' ? 'Branch Operations' : 
             'Store Management'}
          </div>
          {navItems.map((item, idx) => (
            <div 
              key={item.path} 
              className="animate-slide-in" 
              style={{ 
                animationDelay: `${idx * 0.05}s`,
                animationFillMode: 'both'
              }}
            >
              <NavLink
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
            </div>
          ))}
        </div>

        {isSuper && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--primary-gold)', textTransform: 'uppercase', letterSpacing: '1px', padding: '0 16px 8px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldAlert size={14} /> Root Control
            </div>
            {superItems.map((item, idx) => (
              <div 
                key={item.path} 
                className="animate-slide-in" 
                style={{ 
                  animationDelay: `${(navItems.length + idx) * 0.05}s`,
                  animationFillMode: 'both'
                }}
              >
                <NavLink
                  to={item.path}
                  style={({ isActive }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-sm)',
                    textDecoration: 'none',
                    color: isActive ? 'white' : 'var(--text-muted)',
                    background: isActive ? 'var(--primary-gold)' : 'transparent',
                    fontWeight: 600,
                    transition: 'all 0.2s'
                  })}
                >
                  {item.icon}
                  {item.label}
                </NavLink>
              </div>
            ))}
          </div>
        )}
      </nav>

      <div className="sidebar-footer animate-slide-in" style={{ animationDelay: '0.6s', animationFillMode: 'both' }}>
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
            padding: '12px 16px',
            cursor: 'pointer'
          }}
        >
          <LogOut size={20} />
          Logout
        </button>
      </div>

    </aside>
  );
}
