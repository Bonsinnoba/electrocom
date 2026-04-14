import React from 'react';
import { RefreshCcw, HandCoins, AlertCircle, FileText, CheckCircle, Package, Truck } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

export default function Returns() {
  const { siteSettings } = useSettings();
  const siteName = siteSettings.siteName || 'us';

  const steps = [
    {
      icon: <FileText size={20} />,
      title: "1. Initiate Return",
      desc: "Log into your account, navigate to Orders, and select 'Return Item' on the eligible product."
    },
    {
      icon: <Package size={20} />,
      title: "2. Pack Securely",
      desc: "Ensure the item is in its original condition with all tags and original packaging included."
    },
    {
      icon: <Truck size={20} />,
      title: "3. Ship it Back",
      desc: "Drop the package off at any of our authorized dispatch locations using the provided label."
    },
    {
      icon: <HandCoins size={20} />,
      title: "4. Get Reimbursed",
      desc: "Once inspected, refunds are processed to your original payment method within 3-5 days."
    }
  ];

  return (
    <div className="returns-page" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
         <div style={{ background: 'var(--danger-bg)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--danger)', margin: '0 auto 20px auto' }}>
             <RefreshCcw size={32} />
         </div>
        <h1 style={{ fontSize: '36px', fontWeight: 800, marginBottom: '12px' }}>Returns & Exchanges</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '16px', maxWidth: '600px', margin: '0 auto' }}>
          We stand behind every component we sell. If you receive a defective or incorrect item, we'll make it right. Please review our policy below for eligible return conditions.
        </p>
      </div>

      <div className="glass" style={{ padding: '30px', borderRadius: '16px', border: '1px solid var(--border-light)', marginBottom: '40px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '20px' }}>How to Return an Item</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
           {steps.map((s, i) => (
             <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                 <div style={{ background: 'var(--bg-surface)', width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-main)', border: '1px solid var(--border-light)' }}>
                     {s.icon}
                 </div>
                 <strong style={{ fontSize: '15px' }}>{s.title}</strong>
                 <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5' }}>{s.desc}</p>
             </div>
           ))}
        </div>
      </div>

       <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div className="glass" style={{ padding: '24px', borderRadius: '16px', border: '1px solid var(--border-light)' }}>
             <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', fontWeight: 700, marginBottom: '12px', color: 'var(--success)' }}>
                 <CheckCircle size={18} /> Eligible for Return
             </h3>
             <ul style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: '1.8', paddingLeft: '20px' }}>
                 <li>Dead-on-arrival (DOA) components</li>
                 <li>Items that are clearly defective or damaged upon delivery</li>
                 <li>{`Wrong item shipped by ${siteName}`}</li>
                 <li>Unopened STEM kits in original sealed packaging</li>
                 <li>Modules and breakout boards that never powered on</li>
             </ul>
          </div>
          <div className="glass" style={{ padding: '24px', borderRadius: '16px', border: '1px solid var(--border-light)' }}>
             <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', fontWeight: 700, marginBottom: '12px', color: 'var(--danger)' }}>
                 <AlertCircle size={18} /> Non-Returnable Items
             </h3>
             <ul style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: '1.8', paddingLeft: '20px' }}>
                 <li>Opened component packs (resistors, capacitors, etc.)</li>
                 <li>Items damaged by incorrect wiring or ESD mishandling</li>
                 <li>STEM kits with assembled or soldered parts</li>
                 <li>Clearance or final sale components</li>
                 <li>Custom-cut wire spools or bulk orders</li>
             </ul>
          </div>
       </div>
      
    </div>
  );
}
