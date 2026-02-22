import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Users, 
  MapPin, 
  Database, 
  BarChart3, 
  Settings, 
  LogOut,
  ChevronRight,
  Sparkles,
  Zap
} from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';

export default function Sidebar() {
  const navigate = useNavigate();
  
  const menuItems = [
    { name: 'Global Overview', icon: <BarChart3 size={20} />, path: '/' },
    { name: 'Branch Management', icon: <MapPin size={20} />, path: '/branches' },
    { name: 'Admin Control', icon: <Users size={20} />, path: '/admins' },
    { name: 'System Logs', icon: <Database size={20} />, path: '/logs' },
    { name: 'Global Settings', icon: <Settings size={20} />, path: '/settings' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('super_token');
    navigate('/login');
  };

  return (
    <div className="glass" style={{ 
      width: 'var(--sidebar-width)', 
      height: '100vh', 
      position: 'fixed', 
      left: 0, 
      top: 0, 
      display: 'flex', 
      flexDirection: 'column',
      borderRight: '1px solid var(--border-light)',
      zIndex: 100
    }}>
      <div style={{ padding: '32px 24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ 
          width: '40px', 
          height: '40px', 
          background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', 
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(251, 191, 36, 0.3)'
        }}>
          <ShieldAlert size={24} color="#000" />
        </div>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 900, letterSpacing: '-0.5px', margin: 0, color: '#fff' }}>SUPER USER</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Sparkles size={10} color="#fbbf24" />
            <span style={{ fontSize: '10px', color: 'var(--primary-gold)', fontWeight: 800, textTransform: 'uppercase' }}>Root Access</span>
          </div>
        </div>
      </div>

      <nav style={{ flex: 1, padding: '0 16px' }}>
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '14px 16px',
              borderRadius: '12px',
              color: isActive ? '#fff' : 'var(--text-muted)',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: 600,
              marginBottom: '4px',
              background: isActive ? 'rgba(251, 191, 36, 0.1)' : 'transparent',
              border: isActive ? '1px solid rgba(251, 191, 36, 0.2)' : '1px solid transparent',
              transition: 'all 0.2s'
            })}
          >
            <span style={{ color: 'inherit' }}>{item.icon}</span>
            <span style={{ flex: 1 }}>{item.name}</span>
            <ChevronRight size={14} style={{ opacity: 0.3 }} />
          </NavLink>
        ))}
      </nav>

      <div style={{ padding: '24px' }}>
        <div className="card" style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', marginBottom: '16px', borderStyle: 'dashed' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Zap size={14} color="#fbbf24" />
                <span style={{ fontSize: '12px', fontWeight: 700 }}>System Health</span>
            </div>
            <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ width: '98%', height: '100%', background: 'var(--success)' }}></div>
            </div>
            <div style={{ fontSize: '10px', marginTop: '6px', color: 'var(--text-muted)' }}>All nodes operational</div>
        </div>
        
        <button 
          onClick={handleLogout}
          style={{ 
            width: '100%', 
            padding: '12px', 
            borderRadius: '12px', 
            background: 'rgba(239, 68, 68, 0.1)', 
            color: '#ef4444', 
            border: 'none', 
            fontWeight: 700, 
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          <LogOut size={18} />
          Terminal Exit
        </button>
      </div>
    </div>
  );
}
