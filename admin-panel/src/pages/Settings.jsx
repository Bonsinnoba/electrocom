import React, { useState } from 'react';
import { Save, User, Shield, Bell, Moon, Sun, Monitor, Globe, Check } from 'lucide-react';

export default function Settings() {
  const [storeName, setStoreName] = useState('EssentialsHub');
  const [contactEmail, setContactEmail] = useState('admin@essentialshub.com');
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [orderAlerts, setOrderAlerts] = useState(true);
  const [stockAlerts, setStockAlerts] = useState(true);
  const [saveStatus, setSaveStatus] = useState('');

  const handleSave = () => {
    // Simulate save operation
    setSaveStatus('saving');
    setTimeout(() => {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(''), 2000);
    }, 500);
  };

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', JSON.stringify(newDarkMode));
    
    // Apply dark mode to the document
    if (newDarkMode) {
      document.querySelector('.admin-layout')?.classList.add('dark-mode');
    } else {
      document.querySelector('.admin-layout')?.classList.remove('dark-mode');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <header>
        <h1 style={{ fontSize: '32px', fontWeight: 800 }}>Settings</h1>
        <p style={{ color: 'var(--text-muted)' }}>Manage your store and admin configuration.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
        <section className="card glass">
          <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <User size={20} color="var(--primary-blue)" /> Store Profile
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>Store Name</label>
              <input 
                type="text" 
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--bg-surface-secondary)', color: 'var(--text-main)', outline: 'none' }} 
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>Contact Email</label>
              <input 
                type="email" 
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--bg-surface-secondary)', color: 'var(--text-main)', outline: 'none' }} 
              />
            </div>
          </div>
        </section>

        <section className="card glass">
          <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Monitor size={20} color="var(--primary-blue)" /> Appearance
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div 
              onClick={toggleDarkMode}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', borderRadius: '12px', background: 'var(--bg-surface-secondary)', cursor: 'pointer', transition: 'all 0.2s' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Moon size={18} /> <span>Dark Mode</span>
              </div>
              <div style={{ 
                width: '40px', 
                height: '22px', 
                background: darkMode ? 'var(--primary-blue)' : 'var(--border-light)', 
                borderRadius: '20px', 
                position: 'relative', 
                transition: 'all 0.3s'
              }}>
                <div style={{ 
                  position: 'absolute', 
                  right: darkMode ? '2px' : 'auto',
                  left: darkMode ? 'auto' : '2px',
                  top: '2px', 
                  width: '18px', 
                  height: '18px', 
                  background: 'white', 
                  borderRadius: '50%',
                  transition: 'all 0.3s'
                }} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', borderRadius: '12px', background: 'var(--bg-surface-secondary)', opacity: 0.6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Globe size={18} /> <span>Language</span>
              </div>
              <span style={{ fontWeight: 600, fontSize: '14px' }}>English (US)</span>
            </div>
          </div>
        </section>

        <section className="card glass" style={{ borderColor: 'rgba(251,191,36,0.2)' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Shield size={20} color="#fbbf24" /> Security Settings
          </h3>
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: '14px',
            padding: '16px', borderRadius: '10px',
            background: 'rgba(251,191,36,0.07)',
            border: '1px solid rgba(251,191,36,0.2)'
          }}>
            <div style={{ fontSize: '24px', flexShrink: 0 }}>🔒</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '14px', color: '#fbbf24', marginBottom: '6px' }}>
                Restricted — Super User Panel Only
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
                Password resets, two-factor authentication, and account security policies
                are managed exclusively in the <strong style={{ color: '#fff' }}>Super User Panel</strong>.
                Contact your Super User if you need to change security settings.
              </p>
            </div>
          </div>
        </section>

        <section className="card glass">
          <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Bell size={20} color="var(--primary-blue)" /> Notifications
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <input 
                type="checkbox" 
                checked={orderAlerts}
                onChange={(e) => setOrderAlerts(e.target.checked)}
                style={{ marginTop: '4px', cursor: 'pointer' }}
              />
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600 }}>Order Alerts</div>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Get notified when a new order is placed.</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <input 
                type="checkbox" 
                checked={stockAlerts}
                onChange={(e) => setStockAlerts(e.target.checked)}
                style={{ marginTop: '4px', cursor: 'pointer' }}
              />
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600 }}>Stock Alerts</div>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Notify when product stock is low.</p>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '12px', alignItems: 'center' }}>
        {saveStatus === 'saved' && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--success)', fontSize: '14px', fontWeight: 600 }}>
            <Check size={16} /> Settings saved successfully!
          </span>
        )}
        <button 
          onClick={handleSave}
          disabled={saveStatus === 'saving'}
          className="btn btn-primary" 
          style={{ 
            padding: '14px 40px', 
            fontSize: '16px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px',
            opacity: saveStatus === 'saving' ? 0.6 : 1,
            cursor: saveStatus === 'saving' ? 'not-allowed' : 'pointer'
          }}
        >
          <Save size={20} /> {saveStatus === 'saving' ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
