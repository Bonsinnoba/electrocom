import React from 'react';
import { FileText, CheckCircle, AlertCircle, Scale } from 'lucide-react';

export default function TermsOfService() {
  return (
    <div className="terms-page" style={{ 
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
          background: 'rgba(30, 124, 248, 1)', 
          borderRadius: '20px', 
          color: 'var(--primary-blue)',
          marginBottom: '20px'
        }}>
          <Scale size={32} />
        </div>
        <h1 style={{ fontSize: '42px', fontWeight: 800, marginBottom: '16px', letterSpacing: '-1px' }}>Terms of Service</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '18px' }}>Last updated: February 14, 2026</p>
      </div>

      <div className="glass" style={{ padding: '40px', borderRadius: '32px', marginBottom: '40px' }}>
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '24px', fontWeight: 800, marginBottom: '20px' }}>
            <FileText size={24} className="text-primary" /> 1. Agreement to Terms
          </h2>
          <p style={{ lineHeight: '1.8', color: 'var(--text-main)', opacity: 0.9 }}>
            By accessing or using ElectroCom, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site.
          </p>
        </section>

        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '24px', fontWeight: 800, marginBottom: '20px' }}>
            <CheckCircle size={24} className="text-primary" /> 2. Use License
          </h2>
          <p style={{ lineHeight: '1.8', color: 'var(--text-main)', opacity: 0.9 }}>
            Permission is granted to temporarily download one copy of the materials (information or software) on ElectroCom's website for personal, non-commercial transitory viewing only.
          </p>
        </section>

        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '24px', fontWeight: 800, marginBottom: '20px' }}>
            <AlertCircle size={24} className="text-primary" /> 3. Disclaimer
          </h2>
          <p style={{ lineHeight: '1.8', color: 'var(--text-main)', opacity: 0.9 }}>
            The materials on ElectroCom's website are provided on an 'as is' basis. ElectroCom makes no warranties, expressed or implied, regarding the fitness of any electronic component, module, or STEM kit for a specific application or circuit design. Users are responsible for verifying component specifications against their own project requirements before purchase. Datasheets are available on request and should be consulted prior to use in critical applications.
          </p>
        </section>

        <section>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '24px', fontWeight: 800, marginBottom: '20px' }}>
            <Scale size={24} className="text-primary" /> 4. Governing Law
          </h2>
          <p style={{ lineHeight: '1.8', color: 'var(--text-main)', opacity: 0.9 }}>
            These terms and conditions are governed by and construed in accordance with the laws of Ghana and you irrevocably submit to the exclusive jurisdiction of the courts in that State or location.
          </p>
        </section>
      </div>

      <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
        <p>By using our services, you acknowledge that you have read and understood these Terms of Service.</p>
      </div>
    </div>
  );
}
