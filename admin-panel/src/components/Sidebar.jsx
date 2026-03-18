import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, Package, ShoppingCart, Users, Settings, Tag,
  LogOut, MapPin, ShieldAlert, Database, Globe, Zap, Activity, ShieldCheck,
  Star, Bell, ShoppingBag, RotateCcw
} from 'lucide-react';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const role = user?.role || 'admin';
  const isSuper = role === 'super';
  const isAccountant = role === 'accountant';
  const isMarketing = role === 'marketing';

  // Define visibility for items based on role
  const navItems = [
    { icon: <LayoutDashboard size={20} />, label: isAccountant ? 'Finance Dash' : 'Dashboard', path: '/', visible: true },
    { icon: <Package size={20} />, label: 'Products', path: '/products', visible: !isAccountant },
    { icon: <ShoppingCart size={20} />, label: isAccountant ? 'Audits / Orders' : 'Orders', path: '/orders', visible: !isMarketing },
    { icon: <RotateCcw size={20} />, label: 'Returns', path: '/returns', visible: !isMarketing && !isAccountant },
    { icon: <MapPin size={20} />, label: 'Store Layout', path: '/inventory', visible: !isAccountant && !isMarketing },
    { icon: <Users size={20} />, label: isAccountant ? 'Billing List' : 'Customers', path: '/customers', visible: !isMarketing },
    { icon: <LayoutDashboard size={20} />, label: 'Hero Slider', path: '/slider', visible: !isAccountant && role !== 'store_manager' && role !== 'branch_admin' },
    { icon: <Tag size={20} />, label: 'Coupons', path: '/coupons', visible: !isAccountant },
    { icon: <Star size={20} />, label: 'Reviews', path: '/reviews', visible: !isMarketing },
    { icon: <ShoppingBag size={20} />, label: 'Abandoned Carts', path: '/abandoned-carts', visible: !isMarketing },
    { icon: <Zap size={20} />, label: 'Broadcast Tool', path: '/broadcast', visible: !isAccountant },
    { icon: <Bell size={20} />, label: 'System Alerts', path: '/notifications', visible: true },
    { icon: <Settings size={20} />, label: 'Settings', path: '/settings', visible: !isMarketing },
  ].filter(item => item.visible);

  const superItems = [
    { icon: <ShieldAlert size={20} />, label: 'Global Overview', path: '/super/dashboard' },

    { icon: <MapPin size={20} />, label: 'Warehouses', path: '/super/branches' },
    { icon: <Users size={20} />, label: 'Admin Control', path: '/super/admins' },
    { icon: <Database size={20} />, label: 'System Logs', path: '/super/logs' },
    { icon: <Activity size={20} />, label: 'Traffic Control', path: '/super/traffic' },
    { icon: <Globe size={20} />, label: 'Super Settings', path: '/super/settings' },
  ];

  return (
    <aside className="admin-sidebar glass">
      <div className="sidebar-logo">
        <img src="/logo.png" alt="ElectroCom Admin" style={{ height: '45px', width: 'auto', objectFit: 'contain' }} />
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-group">
          <div className="sidebar-section-label">
            {isAccountant ? 'Financial Control' : 
             isMarketing ? 'Promotion & Analytics' : 
             (role === 'branch_admin' || role === 'store_manager') ? 'Store Operations' : 
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
                className={({ isActive }) => `sidebar-nav-link${isActive ? ' active' : ''}`}
                title={item.label}
              >
                <span className="sidebar-icon">{item.icon}</span>
                <span className="sidebar-label">{item.label}</span>
              </NavLink>
            </div>
          ))}
        </div>

        {isSuper && (
          <div className="sidebar-group">
            <div className="sidebar-section-label gold">
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
                  className={({ isActive }) => `sidebar-nav-link super${isActive ? ' active-super' : ''}`}
                  title={item.label}
                >
                  <span className="sidebar-icon">{item.icon}</span>
                  <span className="sidebar-label">{item.label}</span>
                </NavLink>
              </div>
            ))}
          </div>
        )}
      </nav>

      <div className="sidebar-footer animate-slide-in" style={{ animationDelay: '0.6s', animationFillMode: 'both' }}>
        <button 
          className="btn sidebar-logout"
          onClick={logout}
          title="Logout"
        >
          <span className="sidebar-icon"><LogOut size={20} /></span>
          <span className="sidebar-label">Logout</span>
        </button>
      </div>

    </aside>
  );
}
