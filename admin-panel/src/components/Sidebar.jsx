import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, Package, ShoppingCart, Users, Settings, Tag,
  LogOut, MapPin, ShieldAlert, Database, Globe, Zap, Activity, ShieldCheck,
  Star, Bell, ShoppingBag, RotateCcw, ClipboardList, MessageSquare, Truck, Megaphone
} from 'lucide-react';
import { useAdminSettings } from '../context/AdminSettingsContext';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { siteName, logoUrl } = useAdminSettings();
  const role = user?.role || 'admin';
  const isSuper = role === 'super';
  const isAccountant = role === 'accountant';
  const isPicker = role === 'picker';
  const isMarketing = role === 'marketing';
  const isManager = role === 'store_manager' || role === 'super' || role === 'admin';

  // Define visibility for items based on role
  const navItems = [
    { icon: <LayoutDashboard size={20} />, label: isAccountant ? 'Finance Dash' : 'Dashboard', path: '/', visible: !isPicker },
    { icon: <Package size={20} />, label: 'Inventory Hub', path: '/catalog', visible: !isAccountant && !isPicker },
    { icon: <ShoppingCart size={20} />, label: 'Sales & Fulfillment', path: '/sales', visible: !isMarketing && !isPicker },
    { icon: <Zap size={20} />, label: 'POS Checkout', path: '/pos', visible: !isMarketing && !isAccountant && !isPicker },
    { icon: <Users size={20} />, label: isAccountant ? 'Billing List' : 'Customers', path: '/customers', visible: !isMarketing && !isPicker },
    { icon: <Megaphone size={20} />, label: 'Marketing & Growth', path: '/marketing', visible: !isPicker && (!isAccountant || !isMarketing) },
    { icon: <MessageSquare size={20} />, label: 'Staff Hub', path: '/staff-chat', visible: !isAccountant },
    { icon: <Bell size={20} />, label: 'System Alerts', path: '/notifications', visible: true },
    { icon: <Settings size={20} />, label: 'Settings', path: '/settings', visible: !isMarketing },
  ].filter(item => item.visible);

  const superItems = [
    { icon: <ShieldAlert size={20} />, label: 'Global Overview', path: '/super/dashboard' },

    { icon: <Users size={20} />, label: 'Admin Control', path: '/super/admins' },
    { icon: <Database size={20} />, label: 'System Logs', path: '/super/logs' },
    { icon: <Activity size={20} />, label: 'Traffic Control', path: '/super/traffic' },
    { icon: <Globe size={20} />, label: 'Super Settings', path: '/super/settings' },
  ];

  return (
    <aside className="admin-sidebar glass">
      <div className="sidebar-logo">
        <img 
          src={logoUrl || "/logo.png"} 
          alt={`${siteName} Admin`} 
          style={{ height: '45px', width: 'auto', objectFit: 'contain' }} 
        />
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
