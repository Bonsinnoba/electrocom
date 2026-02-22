import React from 'react';
import { Shield, Lock, Eye, ScrollText } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="privacy-policy-page" style={{ 
      padding: '40px 16px', 
      maxWidth: '1000px', 
      margin: '0 auto',
      color: 'var(--text-main)'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '60px' }}>
        <div style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          width: '64px', 
          height: '64px', 
          background: 'rgba(59, 130, 246, 0.1)', 
          borderRadius: '20px', 
          color: 'var(--primary-blue)',
          marginBottom: '20px'
        }}>
          <Shield size={32} />
        </div>
        <h1 style={{ fontSize: '42px', fontWeight: 800, marginBottom: '16px', letterSpacing: '-1px' }}>Privacy Policy</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '18px' }}>Last updated: February 14, 2026</p>
      </div>

      <div className="glass" style={{ padding: '40px', borderRadius: '32px', marginBottom: '40px' }}>
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '24px', fontWeight: 800, marginBottom: '20px' }}>
            <Eye size={24} className="text-primary" /> 1. Information We Collect
          </h2>
          <p style={{ lineHeight: '1.8', color: 'var(--text-main)', opacity: 0.9 }}>
            At EssentialsHub, we collect information that allows us to provide a premium shopping experience. This includes:
          </p>
          <ul style={{ paddingLeft: '20px', marginTop: '16px', lineHeight: '1.8', display: 'grid', gap: '10px' }}>
            <li><strong>Personal Details:</strong> Name, email address, phone number, and delivery address.</li>
            <li><strong>Transaction Data:</strong> Details about payments and the products you've purchased from us.</li>
            <li><strong>Technical Data:</strong> IP address, login data, browser type, and version, time zone setting, and location.</li>
          </ul>
        </section>

        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '24px', fontWeight: 800, marginBottom: '20px' }}>
            <Lock size={24} className="text-primary" /> 2. How We Use Your Data
          </h2>
          <p style={{ lineHeight: '1.8', color: 'var(--text-main)', opacity: 0.9 }}>
            We use your data to process orders, manage your account, and, if you agree, to email you about other products and services we think may be of interest to you.
          </p>
        </section>

        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '24px', fontWeight: 800, marginBottom: '20px' }}>
            <Shield size={24} className="text-primary" /> 3. Data Security
          </h2>
          <p style={{ lineHeight: '1.8', color: 'var(--text-main)', opacity: 0.9 }}>
            We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used, or accessed in an unauthorized way. We limit access to your personal data to those employees, agents, and contractors who have a business need to know.
          </p>
        </section>

        <section>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '24px', fontWeight: 800, marginBottom: '20px' }}>
            <ScrollText size={24} className="text-primary" /> 4. Your Legal Rights
          </h2>
          <p style={{ lineHeight: '1.8', color: 'var(--text-main)', opacity: 0.9 }}>
            Under certain circumstances, you have rights under data protection laws in relation to your personal data, including the right to request access, correction, erasure, restriction, and transfer.
          </p>
        </section>
      </div>

      <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
        <p>If you have any questions about this privacy policy, please contact us at support@essentialshub.com</p>
      </div>
    </div>
  );
}
