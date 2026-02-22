import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, MapPin, Camera, Star, ShieldCheck, RefreshCcw, Lock } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { useNotifications } from '../context/NotificationContext';

export default function Profile() {
  const { user, updateUser, resetUser } = useUser();
  const { addNotification } = useNotifications();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || ''
  });

  // Keep form in sync if user state changes externally (like on reset)
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address
      });
    }
  }, [user]);

  if (!user) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '20px' }}>
        <h2 style={{ color: 'var(--text-muted)' }}>Please login to view your profile</h2>
        <button className="btn-primary" onClick={() => navigate('/')} style={{ padding: '12px 24px', borderRadius: '12px' }}>
           Go to Home
        </button>
      </div>
    );
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    updateUser(formData);
    addNotification('Profile updated successfully', 'info');
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset your profile to defaults? All changes and your profile image will be removed.')) {
      resetUser();
      addNotification('Profile restored to defaults', 'info');
    }
  };

  return (
    <div className="profile-page" style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '32px', 
      padding: '0 16px 48px',
      width: '100%'
    }}>
      <div className="page-header" style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        padding: '24px 0 8px' 
      }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.5px' }}>My Profile</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>View and update your personal information.</p>
        </div>
      </div>

      <div className="profile-content-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: '32px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {/* Profile Overview Card */}
          <div className="card glass" style={{ padding: '32px', textAlign: 'center' }}>
            <div style={{ position: 'relative', width: '120px', height: '120px', margin: '0 auto 20px' }}>
              <div style={{ 
                width: '100%', 
                height: '100%', 
                borderRadius: '50%', 
                background: user.profileImage ? 'var(--bg-surface)' : 'linear-gradient(135deg, var(--primary-blue), var(--accent-blue))', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                fontSize: '40px',
                color: 'white',
                fontWeight: 800,
                boxShadow: '0 8px 20px rgba(59, 130, 246, 0.3)',
                overflow: 'hidden',
                border: '4px solid var(--bg-main)'
              }}>
                {user.profileImage ? (
                    <img 
                        src={user.profileImage} 
                        alt={user.name} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                ) : (
                    user.avatar || 'BB'
                )}
              </div>
              <input 
                type="file" 
                id="profile-image-input" 
                accept="image/*" 
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    if (file.size > 5242880) { // 5MB limit
                        addNotification('Image size too large. Please use an image under 5MB.', 'error');
                        return;
                    }
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      const base64String = reader.result;
                      updateUser({ profileImage: base64String });
                      // Force local storage update immediately in case context is slow (though context handles it)
                      // No, context handles it.
                      addNotification('Profile image updated successfully', 'success');
                    };
                    reader.readAsDataURL(file);
                  }
                }} 
                style={{ display: 'none' }} 
              />
              <button 
                onClick={() => document.getElementById('profile-image-input').click()}
                style={{ 
                  position: 'absolute', 
                  bottom: '4px', 
                  right: '4px', 
                  background: 'var(--bg-main)', 
                  border: '1px solid var(--border-light)', 
                  borderRadius: '50%', 
                  padding: '8px', 
                  cursor: 'pointer',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                  color: 'var(--text-main)',
                  zIndex: 1
                }}
              >
                <Camera size={18} />
              </button>
            </div>
            <h2 style={{ margin: '0 0 4px 0', fontSize: '22px', fontWeight: 800 }}>{user.name}</h2>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '14px' }}>
              <Star size={14} fill="var(--warning)" color="var(--warning)" />
              <span>{user.levelName} Level {user.level}</span>
            </div>
            
            <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid var(--border-light)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '20px', fontWeight: 800 }}>{user.ordersCount}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Orders</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '20px', fontWeight: 800 }}>{user.reviewsCount}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Reviews</div>
              </div>
            </div>
          </div>

          <div className="card glass" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--success)' }}>
              <ShieldCheck size={20} />
              <span style={{ fontWeight: 700 }}>Account Verified</span>
            </div>
          </div>
        </div>

        <div className="card glass" style={{ padding: '32px' }}>
          <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '32px' }}>
            <User size={20} /> Personal Information
          </div>
          
          <div style={{ display: 'grid', gap: '24px' }}>
            <div className="form-group">
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
                <User size={14} style={{ marginRight: '4px' }} /> Full Name
              </label>
              <div className="input-wrapper">
                <input 
                  type="text" 
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  style={{ 
                    width: '100%', 
                    padding: '14px 16px', 
                    borderRadius: '12px', 
                    border: '1px solid var(--border-light)', 
                    background: 'var(--bg-main)', 
                    color: 'var(--text-main)',
                    fontSize: '15px',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }} 
                />
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <div className="form-group">
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
                  <Mail size={14} style={{ marginRight: '4px' }} /> Email Address {user.email && <span style={{ fontSize: '10px', color: 'var(--primary-blue)', marginLeft: '4px' }}>(Permanent)</span>}
                </label>
                <div className="input-wrapper" style={{ position: 'relative' }}>
                  <input 
                    type="email" 
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={!!user.email}
                    placeholder="Add your email"
                    style={{ 
                      width: '100%', 
                      padding: '14px 16px', 
                      borderRadius: '12px', 
                      border: '1px solid var(--border-light)', 
                      background: !!user.email ? 'var(--bg-surface-secondary)' : 'var(--bg-main)', 
                      color: !!user.email ? 'var(--text-muted)' : 'var(--text-main)',
                      fontSize: '15px',
                      outline: 'none',
                      cursor: !!user.email ? 'not-allowed' : 'text',
                      opacity: !!user.email ? 0.7 : 1
                    }} 
                  />
                  {user.email && <Lock size={14} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />}
                </div>
              </div>
              <div className="form-group">
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
                  <Phone size={14} style={{ marginRight: '4px' }} /> Phone Number {user.phone && <span style={{ fontSize: '10px', color: 'var(--primary-blue)', marginLeft: '4px' }}>(Permanent)</span>}
                </label>
                <div className="input-wrapper" style={{ position: 'relative' }}>
                  <input 
                    type="tel" 
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    disabled={!!user.phone}
                    placeholder="Add your phone"
                    style={{ 
                      width: '100%', 
                      padding: '14px 16px', 
                      borderRadius: '12px', 
                      border: '1px solid var(--border-light)', 
                      background: !!user.phone ? 'var(--bg-surface-secondary)' : 'var(--bg-main)', 
                      color: !!user.phone ? 'var(--text-muted)' : 'var(--text-main)',
                      fontSize: '15px',
                      outline: 'none',
                      cursor: !!user.phone ? 'not-allowed' : 'text',
                      opacity: !!user.phone ? 0.7 : 1
                    }} 
                  />
                  {user.phone && <Lock size={14} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />}
                </div>
              </div>
            </div>

            <div className="form-group">
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
                <MapPin size={14} style={{ marginRight: '4px' }} /> Delivery Address
              </label>
              <div className="input-wrapper">
                <input 
                  type="text" 
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  style={{ 
                    width: '100%', 
                    padding: '14px 16px', 
                    borderRadius: '12px', 
                    border: '1px solid var(--border-light)', 
                    background: 'var(--bg-main)', 
                    color: 'var(--text-main)',
                    fontSize: '15px',
                    outline: 'none'
                  }} 
                />
              </div>
            </div>

            <div style={{ marginTop: '12px', display: 'flex', gap: '16px' }}>
              <button 
                className="btn-primary" 
                onClick={handleSave}
                style={{ padding: '14px 32px', borderRadius: '12px', fontWeight: 700, flex: 1 }}
              >
                Save Profile
              </button>
              <button 
                className="btn-secondary" 
                onClick={handleReset}
                style={{ 
                  padding: '14px 32px', 
                  borderRadius: '12px', 
                  fontWeight: 700, 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  color: 'var(--danger)',
                  borderColor: 'var(--danger-bg)',
                  background: 'var(--danger-bg)'
                }}
              >
                <RefreshCcw size={16} /> Restore Defaults
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 768px) {
          .profile-content-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}} />
    </div>
  );
}
