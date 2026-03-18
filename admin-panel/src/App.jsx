import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import ProductManager from './pages/ProductManager';
import OrderManager from './pages/OrderManager';
import CustomerManager from './pages/CustomerManager';
import SliderManager from './pages/SliderManager';
import StoreLayout from './pages/StoreLayout';
import Settings from './pages/Settings';
import Login from './pages/Login';
import CouponManager from './pages/CouponManager';
import SystemNotifications from './pages/SystemNotifications';
import ReviewManager from './pages/ReviewManager';
import AbandonedCartManager from './pages/AbandonedCartManager';
import BroadcastManager from './pages/BroadcastManager';
import ReturnManager from './pages/ReturnManager';
import SuperDashboard from './pages/super-user/SuperDashboard';
import BranchManagement from './pages/super-user/BranchManagement';
import AdminControl from './pages/super-user/AdminControl';
import SystemLogs from './pages/super-user/SystemLogs';

import GlobalSettings from './pages/super-user/GlobalSettings';
import TrafficControl from './pages/super-user/TrafficControl';
import { NotificationProvider, useNotifications } from './context/NotificationContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { X } from 'lucide-react';

// ─── Toast Overlay ────────────────────────────────────────────────────────────
const AdminToasts = () => {
  const { notifications, deleteNotification, toasts, removeToast } = useNotifications();
  
  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      zIndex: 9999,
      pointerEvents: 'none'
    }}>
      {notifications.filter(n => !n.read).slice(0, 5).map(notif => (
        <div key={notif.id} className="glass animate-slide-in" style={{
          padding: '16px 20px',
          borderRadius: '12px',
          background: notif.type === 'error' ? 'var(--danger-bg)' : 
                      notif.type === 'success' ? 'var(--success-bg)' : 
                      'var(--info-bg)',
          border: `1px solid ${notif.type === 'error' ? 'var(--danger)' : 
                               notif.type === 'success' ? 'var(--success)' : 
                               'var(--primary-blue)'}`,
          color: notif.type === 'error' ? 'var(--danger)' : 
                 notif.type === 'success' ? 'var(--success)' : 
                 'var(--primary-blue)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2)',
          minWidth: '300px',
          maxWidth: '450px',
          pointerEvents: 'auto'
        }}>
          <div style={{ flex: 1, fontWeight: 700, fontSize: '14px' }}>{notif.text}</div>
          <button 
            onClick={() => deleteNotification(notif.id)}
            style={{ 
              background: 'transparent', 
              border: 'none', 
              color: 'inherit', 
              cursor: 'pointer', 
              opacity: 0.6,
              display: 'flex',
              padding: '4px'
            }}
          >
            <X size={16} />
          </button>
        </div>
      ))}
      
      {toasts.map(toast => (
        <div key={toast.id} className="glass animate-fade-in" style={{
          padding: '16px 20px',
          borderRadius: '12px',
          background: toast.type === 'error' ? 'var(--danger-bg)' : 
                      toast.type === 'success' ? 'var(--success-bg)' : 
                      'var(--info-bg)',
          border: `1px solid ${toast.type === 'error' ? 'var(--danger)' : 
                               toast.type === 'success' ? 'var(--success)' : 
                               'var(--primary-blue)'}`,
          color: toast.type === 'error' ? 'var(--danger)' : 
                 toast.type === 'success' ? 'var(--success)' : 
                 'var(--primary-blue)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2)',
          minWidth: '300px',
          maxWidth: '450px',
          pointerEvents: 'auto'
        }}>
          <div style={{ flex: 1, fontWeight: 700, fontSize: '14px' }}>{toast.text}</div>
          <button 
            onClick={() => removeToast(toast.id)}
            style={{ 
              background: 'transparent', 
              border: 'none', 
              color: 'inherit', 
              cursor: 'pointer', 
              opacity: 0.6,
              display: 'flex',
              padding: '4px'
            }}
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
};

// ─── Protected Layout (defined OUTSIDE App to stay stable across renders) ─────
const ProtectedLayout = ({ children, requireSuper = false }) => {
  const { isAuthenticated, user, logout, loading } = useAuth();
  const [isMaintenance, setIsMaintenance] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    const check = async () => {
      try {
        const res = await fetch('http://localhost:8000/super_settings.php', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('ehub_token')}` }
        });
        if (res.status === 401 || res.status === 403) {
          logout();
          return;
        }
        if (res.status === 503) {
          const data = await res.json();
          if (data.maintenance && user?.role !== 'super') {
            setIsMaintenance(true);
          }
        }
      } catch (e) {}
    };
    check();
  }, [isAuthenticated, user, logout]);

  // While auth context is loading from localStorage, show nothing (prevents flash)
  if (loading) return null;

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (isMaintenance) {
    return (
      <div style={{ 
        height: '100vh', display: 'flex', flexDirection: 'column', 
        alignItems: 'center', justifyContent: 'center', textAlign: 'center',
        padding: '20px', background: 'var(--bg-main)', color: 'var(--text-main)'
      }}>
        <div style={{ fontSize: '64px', marginBottom: '24px' }}>🛠️</div>
        <h1 style={{ fontSize: '32px', fontWeight: 900, marginBottom: '16px' }}>System Maintenance</h1>
        <p style={{ color: 'var(--text-muted)', maxWidth: '500px', lineHeight: '1.6' }}>
          The administration panel is currently undergoing scheduled maintenance. 
          Only Super Admins can access the dashboard at this time.
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="btn-primary" 
          style={{ marginTop: '32px', padding: '12px 24px' }}
        >
          Retry Connection
        </button>
      </div>
    );
  }

  if (requireSuper && user?.role !== 'super') {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="admin-layout">
      <Sidebar />
      <main className="admin-main">
        {children}
      </main>
    </div>
  );
};

// ─── App Content ─────────────────────────────────────────────────────────────
function AppContent() {
  const { user } = useAuth();
  
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved !== null ? JSON.parse(saved) : false;
  });

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('admin_theme') || 'blue';
  });

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [isDarkMode]);

  useEffect(() => {
    // Remove existing theme classes
    document.body.classList.remove('theme-red', 'theme-green', 'theme-purple');
    // Add new one if not blue
    if (theme !== 'blue') {
      document.body.classList.add(`theme-${theme}`);
    }
    localStorage.setItem('admin_theme', theme);
  }, [theme]);

  // Sync theme from user profile on login
  useEffect(() => {
    if (user && user.theme && user.theme !== theme) {
      setTheme(user.theme);
    }
  }, [user]);

  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('darkMode');
      if (saved !== null) setIsDarkMode(JSON.parse(saved));
      
      const savedTheme = localStorage.getItem('admin_theme');
      if (savedTheme) setTheme(savedTheme);
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('themeChange', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('themeChange', handleStorageChange);
    };
  }, []);

  return (
    <Router>
      <div className="mobile-restriction">
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>🖥️</div>
        <h2>Desktop or Tablet Required</h2>
        <p>The Admin Dashboard is optimized for larger screens only.</p>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '8px' }}>
          Please access this URL from a tablet (landscape), laptop, or desktop computer (min-width: 1024px).
        </p>
      </div>
      
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
        <Route path="/products" element={<ProtectedLayout><ProductManager /></ProtectedLayout>} />
        <Route path="/orders" element={<ProtectedLayout><OrderManager /></ProtectedLayout>} />
        <Route path="/customers" element={<ProtectedLayout><CustomerManager /></ProtectedLayout>} />
        <Route path="/slider" element={<ProtectedLayout><SliderManager /></ProtectedLayout>} />
        <Route path="/coupons" element={<ProtectedLayout><CouponManager /></ProtectedLayout>} />
        <Route path="/inventory" element={<ProtectedLayout><StoreLayout /></ProtectedLayout>} />
        <Route path="/notifications" element={<ProtectedLayout><SystemNotifications /></ProtectedLayout>} />
        <Route path="/reviews" element={<ProtectedLayout><ReviewManager /></ProtectedLayout>} />
        <Route path="/abandoned-carts" element={<ProtectedLayout><AbandonedCartManager /></ProtectedLayout>} />
        <Route path="/broadcast" element={<ProtectedLayout><BroadcastManager /></ProtectedLayout>} />
        <Route path="/returns" element={<ProtectedLayout><ReturnManager /></ProtectedLayout>} />
        <Route path="/settings" element={<ProtectedLayout><Settings /></ProtectedLayout>} />

        {/* Super Admin Routes */}
        <Route path="/super/dashboard" element={<ProtectedLayout requireSuper><SuperDashboard /></ProtectedLayout>} />
        <Route path="/super/branches" element={<ProtectedLayout requireSuper><BranchManagement /></ProtectedLayout>} />
        <Route path="/super/admins" element={<ProtectedLayout requireSuper><AdminControl /></ProtectedLayout>} />

        <Route path="/super/logs" element={<ProtectedLayout requireSuper><SystemLogs /></ProtectedLayout>} />
        <Route path="/super/traffic" element={<ProtectedLayout requireSuper><TrafficControl /></ProtectedLayout>} />
        <Route path="/super/settings" element={<ProtectedLayout requireSuper><GlobalSettings /></ProtectedLayout>} />
        
        {/* Redirect unknown routes */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <AdminToasts />
        <AppContent />
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
