import React, { useState } from 'react';
import { Save, User, Shield, Bell, Moon, Sun, Monitor, Globe, Check } from 'lucide-react';
import { updateProfile } from '../services/api';

export default function Settings() {
  const [storeName, setStoreName] = useState('ElectroCom');
  const [contactEmail, setContactEmail] = useState('admin@electrocom.com');
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved !== null ? JSON.parse(saved) : false;
  });
  const [orderAlerts, setOrderAlerts] = useState(true);
  const [stockAlerts, setStockAlerts] = useState(true);
  const [theme, setTheme] = useState(() => localStorage.getItem('admin_theme') || 'blue');
  const [saveStatus, setSaveStatus] = useState('');

  const user = JSON.parse(localStorage.getItem('ehub_user') || '{}');
  const isAccountant = user.role === 'accountant';
  const isMarketing = user.role === 'marketing';
  const isRestricted = isAccountant || isMarketing;

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
    
    // Notify other components (like App.jsx) about the change immediately
    window.dispatchEvent(new Event('themeChange'));
  };

  const changeTheme = async (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('admin_theme', newTheme);
    window.dispatchEvent(new Event('themeChange'));
    
    // Sync to backend
    try {
      const response = await updateProfile({ theme: newTheme });
      if (response.success && response.data?.user) {
        localStorage.setItem('ehub_user', JSON.stringify(response.data.user));
      }
    } catch (e) {
      console.error('Failed to sync theme to backend:', e);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <header>
        <h1 style={{ fontSize: '32px', fontWeight: 800 }}>Settings</h1>
        <p style={{ color: 'var(--text-muted)' }}>{isRestricted ? "Manage your personal preferences." : "Manage your store and admin configuration."}</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
        <section className="card glass" style={{ opacity: isRestricted ? 0.7 : 1 }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <User size={20} color="var(--primary-blue)" /> {isRestricted ? 'My Profile' : 'Store Profile'}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>{isRestricted ? 'Name' : 'Store Name'}</label>
              <input 
                type="text" 
                value={isRestricted ? user.name : storeName}
                readOnly={isRestricted}
                onChange={(e) => !isRestricted && setStoreName(e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: '10px 14px', 
                  borderRadius: '8px', 
                  border: '1px solid var(--border-light)', 
                  background: isRestricted ? 'transparent' : 'var(--bg-surface-secondary)', 
                  color: isRestricted ? 'var(--text-muted)' : 'var(--text-main)', 
                  outline: 'none',
                  cursor: isRestricted ? 'not-allowed' : 'text'
                }} 
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>{isRestricted ? 'Email Address' : 'Contact Email'}</label>
              <input 
                type="email" 
                value={isRestricted ? user.email : contactEmail}
                readOnly={isRestricted}
                onChange={(e) => !isRestricted && setContactEmail(e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: '10px 14px', 
                  borderRadius: '8px', 
                  border: '1px solid var(--border-light)', 
                  background: isRestricted ? 'transparent' : 'var(--bg-surface-secondary)', 
                  color: isRestricted ? 'var(--text-muted)' : 'var(--text-main)', 
                  outline: 'none',
                  cursor: isRestricted ? 'not-allowed' : 'text'
                }} 
              />
            </div>
            {isRestricted && (
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '12px' }}>
                * Store-wide details are managed by the Super User and hidden for your role.
              </p>
            )}
            {!isRestricted && (
              <button 
                className={`btn btn-primary ${saveStatus === 'saved' ? 'btn-success' : ''}`}
                onClick={handleSave}
                disabled={saveStatus === 'saving'}
                style={{ marginTop: '10px', width: 'fit-content' }}
              >
                {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved!' : 'Save Profile'}
              </button>
            )}
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
              </div>
            </div>

            <div style={{ padding: '12px', borderRadius: '12px', background: 'var(--bg-surface-secondary)' }}>
              <label style={{ display: 'block', marginBottom: '12px', fontSize: '14px', fontWeight: 600 }}>Brand Theme</label>
              <div style={{ display: 'flex', gap: '12px' }}>
                {[
                  { id: 'blue', color: '#1e3a8a', label: 'Classic Blue' },
                  { id: 'red', color: '#dc2626', label: 'Vibrant Red' },
                  { id: 'green', color: '#16a34a', label: 'Nature Green' },
                  { id: 'purple', color: '#7c3aed', label: 'Royal Purple' }
                ].map((t) => (
                  <div 
                    key={t.id}
                    onClick={() => changeTheme(t.id)}
                    style={{ 
                      width: '44px', 
                      height: '44px', 
                      borderRadius: '12px', 
                      background: t.color, 
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: theme === t.id ? '3px solid var(--text-main)' : '2px solid transparent',
                      transition: 'all 0.2s',
                      boxShadow: theme === t.id ? '0 0 15px rgba(0,0,0,0.2)' : 'none',
                      transform: theme === t.id ? 'scale(1.1)' : 'scale(1)'
                    }}
                    title={t.label}
                  >
                    {theme === t.id && <Check size={20} color="white" />}
                  </div>
                ))}
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
                are managed exclusively in the <strong style={{ color: 'var(--text-main)' }}>Super User Panel</strong>.
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
