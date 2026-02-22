import React from 'react';
import { 
  Moon, Sun, Bell, Lock, Globe, Shield, Settings as SettingsIcon, 
  ChevronRight, User, MapPin, CreditCard, ShoppingBag, 
  Trash2, HelpCircle, Eye, Mail, Phone, CreditCard as PaymentIcon,
  History, DollarSign, Smartphone, Receipt
} from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { useSettings } from '../context/SettingsContext';
import { useUser } from '../context/UserContext';
import { deleteMyAccount } from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function Settings({ searchQuery, isDarkMode, toggleDarkMode }) {
  const { addNotification } = useNotifications();
  const { settings, updateSetting, updateCurrency } = useSettings();
  const { user, logout } = useUser();
  const navigate = useNavigate();

  const handleDeleteAccount = async () => {
    if (!user) return;
    
    const confirmed = window.confirm("Are you absolutely sure you want to delete your account? This action cannot be undone.");
    if (confirmed) {
      try {
        const result = await deleteMyAccount();
        if (result.success) {
          alert("Your account has been permanently deleted.");
          logout();
          navigate('/');
        } else {
          addNotification(result.message || "Failed to delete account", "error");
        }
      } catch (error) {
        addNotification("An error occurred during account deletion", "error");
      }
    }
  };

  const handleToggle = (key) => {
    const newValue = !settings[key];
    updateSetting(key, newValue);
    addNotification(`${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} ${newValue ? 'Enabled' : 'Disabled'}`, 'info');
  };

  const handleAction = (title, message) => {
    addNotification(`${title}: ${message}`, 'info');
  };

  const shouldShow = (title) => {
    if (!searchQuery) return true;
    return title.toLowerCase().includes(searchQuery.toLowerCase());
  };

  const Toggle = ({ checked, onChange }) => (
    <div 
      onClick={onChange} 
      style={{ 
        width: '42px', 
        height: '24px', 
        background: checked ? 'var(--primary-blue)' : 'rgba(255, 255, 255, 0.1)', 
        borderRadius: '20px', 
        position: 'relative', 
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        border: '1px solid var(--border-light)'
      }}
    >
      <div style={{ 
        width: '18px', 
        height: '18px', 
        background: 'white', 
        borderRadius: '50%', 
        position: 'absolute', 
        top: '2px', 
        left: checked ? '21px' : '2px', 
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)' 
      }}></div>
    </div>
  );

  const SettingRow = ({ icon: Icon, title, description, action, onClick }) => (
    <div className="setting-row" 
      onClick={onClick}
      style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '12px', 
        borderRadius: '16px', 
        transition: 'all 0.2s ease',
        cursor: onClick ? 'pointer' : 'default'
      }}
    >
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
        <div style={{ 
          background: 'var(--bg-main)', 
          padding: '10px', 
          borderRadius: '12px', 
          color: 'var(--text-muted)',
          display: 'flex'
        }}>
          <Icon size={18} />
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: '15px' }}>{title}</div>
          {description && <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{description}</div>}
        </div>
      </div>
      {action}
    </div>
  );

  const ActionButton = ({ label, type = 'secondary', onClick }) => (
    <button 
      className={`btn-${type}`} 
      onClick={(e) => { e.stopPropagation(); onClick && onClick(); }}
      style={{ 
        padding: '8px 16px', 
        borderRadius: '10px', 
        fontWeight: 600,
        fontSize: '13px'
      }}
    >
      {label}
    </button>
  );

  const SettingCard = ({ title, icon: Icon, children }) => (
    <div className="card glass setting-card" style={{ 
      padding: '28px',
      display: 'flex',
      flexDirection: 'column',
      gap: '24px',
      transition: 'all 0.3s ease',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ 
          background: 'rgba(59, 130, 246, 0.1)', 
          padding: '10px', 
          borderRadius: '12px', 
          color: 'var(--primary-blue)',
          display: 'flex'
        }}>
          <Icon size={20} />
        </div>
        <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>{title}</h3>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {children}
      </div>
    </div>
  );

  return (
    <div className="settings-page" style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
      gap: '24px', 
      padding: '0 16px 48px',
      width: '100%'
    }}>
      <div className="page-header" style={{ 
        gridColumn: '1 / -1',
        padding: '24px 0 8px' 
      }}>
        <h1 style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-1px', marginBottom: '8px' }}>Global Settings</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '16px' }}>Manage your account preferences, orders, and security.</p>
      </div>

      {/* Account Section */}
      {shouldShow('Account Information') && (
        <SettingCard title="Account Information" icon={User}>
          <SettingRow 
            icon={Mail} 
            title="Email Address" 
            description="primary@essentialshub.com" 
            action={<ActionButton label="Change" onClick={() => handleAction("Email Change", "A verification link has been sent to your new address.")} />} 
          />
          <SettingRow 
            icon={Phone} 
            title="Phone Number" 
            description="+233 53 668 3393" 
            action={<ActionButton label="Change" onClick={() => handleAction("Phone Change", "OTP requested for verification.")} />} 
          />
          <SettingRow 
            icon={MapPin} 
            title="Shipping Addresses" 
            description="2 saved addresses" 
            onClick={() => handleAction("Addresses", "Redirecting to address manager...")}
            action={<ChevronRight size={18} color="var(--text-muted)" />} 
          />
        </SettingCard>
      )}

      {/* Order Preferences */}
      {shouldShow('Shopping & Orders') && (
        <SettingCard title="Shopping & Orders" icon={ShoppingBag}>
          <SettingRow 
            icon={Eye} 
            title="Order Tracking" 
            description="Real-time SMS updates" 
            action={<Toggle checked={settings.orderTracking} onChange={() => handleToggle('orderTracking')} />} 
          />
          <SettingRow 
            icon={History} 
            title="Purchase History" 
            description="Manage your previous orders" 
            onClick={() => handleAction("History", "Opening order archive...")}
            action={<ChevronRight size={18} color="var(--text-muted)" />} 
          />
          <SettingRow 
            icon={HelpCircle} 
            title="Return Policy" 
            description="30-day money-back guarantee" 
            action={<ActionButton label="View" onClick={() => handleAction("Returns", "Showing detailed return policy.")} />} 
          />
        </SettingCard>
      )}

      {/* Payment & Transactions */}
      {shouldShow('Payments & Transactions') && (
        <SettingCard title="Payments & Transactions" icon={Receipt}>
          <SettingRow 
            icon={PaymentIcon} 
            title="Payment Methods" 
            description="Visa, PayPal, Mobile Money" 
            onClick={() => handleAction("Payments", "Opening secure payment manager...")}
            action={<ChevronRight size={18} color="var(--text-muted)" />} 
          />
          <SettingRow 
            icon={History} 
            title="Transaction History" 
            description="View all previous payments" 
            onClick={() => navigate('/transactions')}
            action={<ChevronRight size={18} color="var(--text-muted)" />} 
          />
          <SettingRow 
            icon={DollarSign} 
            title="Currency" 
            description={settings.currency} 
            action={
              <select 
                value={settings.currency}
                onChange={(e) => {
                  updateCurrency(e.target.value);
                  addNotification(`Currency switched to ${e.target.value}`, 'info');
                }}
                style={{
                  padding: '8px 12px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-light)',
                  background: 'var(--bg-main)',
                  color: 'var(--text-main)',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                <option value="GHS">GHS (GH₵)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            } 
          />
        </SettingCard>
      )}

      {/* Notifications Section */}
      {shouldShow('Notifications') && (
        <SettingCard title="Notifications" icon={Bell}>
          <SettingRow 
            icon={Mail} 
            title="Email Alerts" 
            description="Order confirmations & receipts" 
            action={<Toggle checked={settings.emailNotif} onChange={() => handleToggle('emailNotif')} />} 
          />
          <SettingRow 
            icon={Smartphone} 
            title="Push Notifications" 
            description="Flash sales and promo alerts" 
            action={<Toggle checked={settings.pushNotif} onChange={() => handleToggle('pushNotif')} />} 
          />
        </SettingCard>
      )}

      {/* Security Section */}
      {shouldShow('Security & Privacy') && (
        <SettingCard title="Security & Privacy" icon={Shield}>
          <SettingRow 
            icon={Lock} 
            title="2-Step Verification" 
            description="Enhanced account protection" 
            action={<Toggle checked={settings.twoFactor} onChange={() => handleToggle('twoFactor')} />} 
          />
          <SettingRow 
            icon={Eye} 
            title="Privacy Guard" 
            description="Manage personal data usage" 
            onClick={() => handleAction("Privacy", "Opening data control center...")}
            action={<ActionButton label="Manage" />} 
          />
          <SettingRow 
            icon={Trash2} 
            title="Account Deletion" 
            description="Permanently remove your data" 
            onClick={handleDeleteAccount}
            action={<span onClick={(e) => { e.stopPropagation(); handleDeleteAccount(); }} style={{ color: '#ef4444', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Delete</span>} 
          />
        </SettingCard>
      )}

      {/* App Appearance */}
      {shouldShow('App Preferences') && (
        <SettingCard title="App Preferences" icon={SettingsIcon}>
          <SettingRow 
            icon={isDarkMode ? Moon : Sun} 
            title="Interface Theme" 
            description={`Currently in ${isDarkMode ? 'Dark' : 'Light'} mode`} 
            action={<ActionButton label={isDarkMode ? "Light Mode" : "Dark Mode"} onClick={toggleDarkMode} />} 
          />
          <SettingRow 
            icon={Globe} 
            title="Language" 
            description={settings.language} 
            action={
              <select 
                value={settings.language}
                onChange={(e) => {
                  updateSetting('language', e.target.value);
                  addNotification(`Language set to ${e.target.value}`, 'info');
                }}
                style={{
                  padding: '8px 12px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-light)',
                  background: 'var(--bg-main)',
                  color: 'var(--text-main)',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                <option value="English (UK)">English (UK)</option>
                <option value="English (US)">English (US)</option>
                <option value="French">Français</option>
                <option value="German">Deutsch</option>
              </select>
            } 
          />
        </SettingCard>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @media (min-width: 1024px) {
          .settings-page {
            grid-template-columns: repeat(3, 1fr) !important;
            max-width: 1400px;
            margin: 0 auto;
          }
        }
        .setting-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 30px rgba(0,0,0,0.15);
          border-color: rgba(59, 130, 246, 0.3) !important;
        }
        .setting-row:hover {
          background: rgba(59, 130, 246, 0.05);
        }
        .dark-mode .setting-row:hover {
          background: rgba(255, 255, 255, 0.03);
        }
      `}} />
    </div>
  );
}
