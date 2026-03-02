import React, { useState, useEffect } from 'react';
import {
  Settings, Globe, Shield, Bell, Database,
  Save, RefreshCw, AlertTriangle, CheckCircle,
  Eye, EyeOff, Lock, Wifi, Server, Zap
} from 'lucide-react';
import { fetchSuperSettings as getSettings, saveSuperSettings as saveSettings } from '../../services/api';

// ── Default settings (merged with any stored/API values) ──────────────────────
const DEFAULTS = {
  siteName:        'EssentialsHub',
  siteEmail:       'admin@essentialshub.gh',
  maintenanceMode: false,
  allowRegistration: true,
  maxLoginAttempts: 5,
  sessionTimeout:   60,
  twoFactorAdmin:   false,
  emailNotify:      true,
  securityAlerts:   true,
  apiRateLimit:     100,
  debugMode:        false,
  backupFrequency:  'daily',
};

function Toggle({ value, onChange, label, description }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <div>
        <div style={{ fontWeight: 700, fontSize: '14px' }}>{label}</div>
        {description && <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{description}</div>}
      </div>
      <button
        onClick={() => onChange(!value)}
        style={{
          width: '48px', height: '26px', borderRadius: '13px', border: 'none',
          background: value ? 'var(--primary-gold)' : 'rgba(255,255,255,0.1)',
          position: 'relative', cursor: 'pointer', transition: 'background 0.25s', flexShrink: 0
        }}
      >
        <div style={{
          position: 'absolute', top: '3px', left: value ? '25px' : '3px',
          width: '20px', height: '20px', borderRadius: '50%', background: value ? '#000' : '#94a3b8',
          transition: 'left 0.25s'
        }} />
      </button>
    </div>
  );
}

function Field({ label, description, children }) {
  return (
    <div style={{ padding: '16px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '4px' }}>{label}</div>
      {description && <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px' }}>{description}</div>}
      {children}
    </div>
  );
}

const inputStyle = {
  width: '100%', maxWidth: '360px', padding: '10px 14px', borderRadius: '10px',
  background: 'var(--bg-surface-secondary)', border: '1px solid var(--border-light)',
  color: 'var(--text-main)', fontSize: '14px', fontWeight: 600, outline: 'none'
};

const selectStyle = {
  ...inputStyle, cursor: 'pointer'
};

export default function GlobalSettings() {
  const [settings, setSettings] = useState(DEFAULTS);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [loading, setLoading]   = useState(true);
  const [lastSynced, setLastSynced] = useState(null);
  const [tab, setTab]           = useState('general');

  // Load from API on mount
  useEffect(() => {
    const load = async () => {
      try {
        const res = await getSettings();
        if (res.success && res.data) {
          setSettings({ ...DEFAULTS, ...res.data });
          setLastSynced(new Date());
          localStorage.setItem('ehub_super_settings', JSON.stringify(res.data));
        }
      } catch (e) {
        // Fall back to localStorage if API is unreachable
        try {
          const cached = JSON.parse(localStorage.getItem('ehub_super_settings') || '{}');
          setSettings({ ...DEFAULTS, ...cached });
        } catch {}
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const set = (key) => async (val) => {
    const updated = { ...settings, [key]: val };
    setSettings(updated);
    // Auto-save immediately for toggles so changes take effect in real-time
    try {
      await saveSettings(updated);
      localStorage.setItem('ehub_super_settings', JSON.stringify(updated));
      setLastSynced(new Date());
    } catch (e) {
      console.error('Auto-save failed:', e);
    }
  };

  const setVal = (key) => (e) => setSettings(prev => ({ ...prev, [key]: e.target.value }));
  const setNum = (key) => (e) => setSettings(prev => ({ ...prev, [key]: Number(e.target.value) }));

  const save = async () => {
    setSaving(true);
    try {
      await saveSettings(settings);
      localStorage.setItem('ehub_super_settings', JSON.stringify(settings));
      setLastSynced(new Date());
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      console.error('Save error:', e);
      alert('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };


  const TABS = [
    { id: 'general',  label: 'General',  icon: <Globe size={16} /> },
    { id: 'security', label: 'Security', icon: <Shield size={16} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={16} /> },
    { id: 'system',   label: 'System',   icon: <Server size={16} /> },
  ];

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-muted)' }}>
      <Settings size={36} style={{ opacity: 0.3, marginBottom: '12px' }} />
      <p>Loading settings from server...</p>
    </div>
  );

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <header style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '34px', fontWeight: 900, letterSpacing: '-1px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <Settings size={30} color="var(--primary-gold)" />
            Global Settings
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '16px' }}>
            Configure site-wide preferences, security policies, and system behaviour.
          </p>
          {lastSynced && (
            <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <CheckCircle size={12} color="#22c55e" /> Synced from server at {lastSynced.toLocaleTimeString()}
            </p>
          )}
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px' }}
        >
          {saving ? <RefreshCw size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> : saved ? <CheckCircle size={16} /> : <Save size={16} />}
          {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Changes'}
        </button>
      </header>

      {/* Maintenance Banner */}
      {settings.maintenanceMode && (
        <div style={{ padding: '14px 20px', background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '12px', display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '24px' }}>
          <AlertTriangle size={20} color="#f59e0b" />
          <div>
            <div style={{ fontWeight: 800, color: '#f59e0b' }}>Maintenance Mode Active</div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>The storefront is currently offline for all customers. Remember to disable this when done.</div>
          </div>
        </div>
      )}

      {/* Tab nav */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid var(--border-light)', paddingBottom: '0' }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: '7px',
              padding: '10px 18px', borderRadius: '10px 10px 0 0', border: 'none',
              background: tab === t.id ? 'var(--bg-surface)' : 'transparent',
              color: tab === t.id ? 'var(--text-main)' : 'var(--text-muted)',
              fontWeight: 700, fontSize: '13px', cursor: 'pointer',
              borderBottom: tab === t.id ? '2px solid var(--primary-gold)' : '2px solid transparent',
              transition: 'all 0.2s'
            }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div className="card glass">
        {/* ── General ── */}
        {tab === 'general' && (
          <>
            <Field label="Site Name" description="Displayed in the browser tab and email communications.">
              <input style={inputStyle} value={settings.siteName} onChange={setVal('siteName')} />
            </Field>
            <Field label="Contact Email" description="System notifications and alerts are sent from this address.">
              <input style={inputStyle} type="email" value={settings.siteEmail} onChange={setVal('siteEmail')} />
            </Field>
            <Toggle value={settings.maintenanceMode} onChange={set('maintenanceMode')}
              label="Maintenance Mode"
              description="Temporarily closes the storefront to all non-super-user traffic."
            />
            <Toggle value={settings.allowRegistration} onChange={set('allowRegistration')}
              label="Allow New Registrations"
              description="When disabled, the sign-up page will return a 403 error."
            />
          </>
        )}

        {/* ── Security ── */}
        {tab === 'security' && (
          <>
            <Field label="Max Login Attempts" description="Accounts are locked after this many failed password attempts.">
              <input style={{ ...inputStyle, maxWidth: '180px' }} type="number" min={1} max={20} value={settings.maxLoginAttempts} onChange={setNum('maxLoginAttempts')} />
            </Field>
            <Field label="Session Timeout (minutes)" description="Admin sessions are automatically invalidated after this period of inactivity.">
              <input style={{ ...inputStyle, maxWidth: '180px' }} type="number" min={5} max={480} value={settings.sessionTimeout} onChange={setNum('sessionTimeout')} />
            </Field>
            <Toggle value={settings.twoFactorAdmin} onChange={set('twoFactorAdmin')}
              label="Two-Factor Auth for Admins"
              description="Require OTP verification for all admin logins."
            />
          </>
        )}

        {/* ── Notifications ── */}
        {tab === 'notifications' && (
          <>
            <Toggle value={settings.emailNotify} onChange={set('emailNotify')}
              label="Email Notifications"
              description="Send order confirmation and shipping updates to customers."
            />
            <Toggle value={settings.securityAlerts} onChange={set('securityAlerts')}
              label="Security Alert Emails"
              description="Immediately notify super-user on suspicious login attempts or node failures."
            />
          </>
        )}

        {/* ── System ── */}
        {tab === 'system' && (
          <>
            <Field label="API Rate Limit (req/min)" description="Maximum API requests per IP per minute. 0 = unlimited.">
              <input style={{ ...inputStyle, maxWidth: '180px' }} type="number" min={0} value={settings.apiRateLimit} onChange={setNum('apiRateLimit')} />
            </Field>
            <Field label="Database Backup Frequency" description="How often automated database snapshots are created.">
              <select style={{ ...selectStyle, maxWidth: '240px' }} value={settings.backupFrequency} onChange={setVal('backupFrequency')}>
                <option value="hourly">Every Hour</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="manual">Manual Only</option>
              </select>
            </Field>
            <Toggle value={settings.debugMode} onChange={set('debugMode')}
              label="Debug Mode"
              description="Enables verbose error output. Never enable this in production."
            />

            <div style={{ marginTop: '32px', padding: '24px', background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#ef4444', marginBottom: '12px' }}>
                <AlertTriangle size={20} />
                <span style={{ fontWeight: 800, fontSize: '15px', textTransform: 'uppercase', letterSpacing: '1px' }}>Danger Zone</span>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
                Performing a Factory Reset will permanently delete all <strong>Products</strong>, <strong>Slider Images</strong>, and <strong>Branches</strong>. This action cannot be undone.
              </p>
              <button 
                onClick={async () => {
                  if (confirm("🚨 WARNING: This will WIPE all products, slider images, and branches. Are you absolutely sure?")) {
                    try {
                      const res = await (await import('../../services/api')).wipeDemoData();
                      if (res.success) alert(res.message);
                      else alert(res.message || "Cleanup failed.");
                    } catch (e) {
                      alert("Error during cleanup: " + e.message);
                    }
                  }
                }}
                className="btn-danger" 
                style={{ width: '100%', padding: '12px', fontWeight: 800 }}
              >
                Factory Reset (Wipe All Demo Data)
              </button>
            </div>
          </>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
