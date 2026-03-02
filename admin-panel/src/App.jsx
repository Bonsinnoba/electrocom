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
import SuperDashboard from './pages/super-user/SuperDashboard';
import BranchManagement from './pages/super-user/BranchManagement';
import AdminControl from './pages/super-user/AdminControl';
import SystemLogs from './pages/super-user/SystemLogs';
import VerificationManager from './pages/super-user/VerificationManager';
import GlobalSettings from './pages/super-user/GlobalSettings';
import TrafficControl from './pages/super-user/TrafficControl';
import { NotificationProvider, useNotifications } from './context/NotificationContext';
import { X } from 'lucide-react';

const AdminToasts = () => {
  const { notifications, deleteNotification } = useNotifications();
  
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
    </div>
  );
};

function App() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved !== null ? JSON.parse(saved) : false;
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem('ehub_token');
  });

  useEffect(() => {
    // Apply dark mode class to body based on saved preference
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [isDarkMode]);

  // Sync theme state with localStorage for multi-tab/same-tab updates
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('darkMode');
      if (saved !== null) {
        setIsDarkMode(JSON.parse(saved));
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    // Also listen for custom events if we dispatch them
    window.addEventListener('themeChange', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('themeChange', handleStorageChange);
    };
  }, []);

  // Check auth status periodically
  useEffect(() => {
    const checkAuth = () => {
        setIsAuthenticated(!!localStorage.getItem('ehub_token'));
    };
    window.addEventListener('storage', checkAuth);
    const interval = setInterval(checkAuth, 2000);
    return () => {
        window.removeEventListener('storage', checkAuth);
        clearInterval(interval);
    };
  }, []);

  const ProtectedLayout = ({ children, requireSuper = false }) => {
    if (!isAuthenticated) return <Navigate to="/login" />;
    
    // Check role if super is required
    if (requireSuper) {
        const user = JSON.parse(localStorage.getItem('ehub_user') || '{}');
        if (user.role !== 'super') return <Navigate to="/" />;
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

  return (
    <NotificationProvider>
      <AdminToasts />
      <Router>
        <div className="mobile-restriction">
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>🖥️</div>
          <h2>Desktop or Tablet Required</h2>
          <p>The Admin Dashboard is optimized for larger screens only.</p>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '8px' }}>Please access this URL from a tablet (landscape), laptop, or desktop computer (min-width: 1024px).</p>
        </div>
        
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
          <Route path="/products" element={<ProtectedLayout><ProductManager /></ProtectedLayout>} />
          <Route path="/orders" element={<ProtectedLayout><OrderManager /></ProtectedLayout>} />
          <Route path="/customers" element={<ProtectedLayout><CustomerManager /></ProtectedLayout>} />
          <Route path="/slider" element={<ProtectedLayout><SliderManager /></ProtectedLayout>} />
          <Route path="/inventory" element={<ProtectedLayout><StoreLayout /></ProtectedLayout>} />
          <Route path="/settings" element={<ProtectedLayout><Settings /></ProtectedLayout>} />

          {/* Super Admin Routes */}
          <Route path="/super/dashboard" element={<ProtectedLayout requireSuper><SuperDashboard /></ProtectedLayout>} />
          <Route path="/super/branches" element={<ProtectedLayout requireSuper><BranchManagement /></ProtectedLayout>} />
          <Route path="/super/admins" element={<ProtectedLayout requireSuper><AdminControl /></ProtectedLayout>} />
          <Route path="/super/verification" element={<ProtectedLayout requireSuper><VerificationManager /></ProtectedLayout>} />
          <Route path="/super/logs" element={<ProtectedLayout requireSuper><SystemLogs /></ProtectedLayout>} />
          <Route path="/super/traffic" element={<ProtectedLayout requireSuper><TrafficControl /></ProtectedLayout>} />
          <Route path="/super/settings" element={<ProtectedLayout requireSuper><GlobalSettings /></ProtectedLayout>} />
          
          {/* Redirect unknown routes */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </NotificationProvider>
  );

}

export default App;

