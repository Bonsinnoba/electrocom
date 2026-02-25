import React from 'react';
import { RefreshCcw, HandCoins, AlertCircle, FileText, CheckCircle } from 'lucide-react';

export default function Returns() {
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
    <div className="returns-page" style={{ padding: '60px 20px', maxWidth: '800px', margin: '0 auto', minHeight: '80vh' }}>
      
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
         <div style={{ background: 'var(--danger-bg)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--danger)', margin: '0 auto 20px auto' }}>
             <RefreshCcw size={32} />
         </div>
        <h1 style={{ fontSize: '36px', fontWeight: 800, marginBottom: '12px' }}>Returns & Exchanges</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '16px', maxWidth: '600px', margin: '0 auto' }}>
          We want you to love your purchase. If you're not completely satisfied, you can return most items within 30 days of delivery.
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
                 <CheckCircle size={18} /> Returnable Items
             </h3>
             <ul style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: '1.8', paddingLeft: '20px' }}>
                 <li>Unworn, unwashed merchandise</li>
                 <li>Electronics in unopened original packaging</li>
                 <li>Defective or damaged items upon arrival</li>
                 <li>Items shipped incorrectly by us</li>
             </ul>
          </div>
          <div className="glass" style={{ padding: '24px', borderRadius: '16px', border: '1px solid var(--border-light)' }}>
             <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', fontWeight: 700, marginBottom: '12px', color: 'var(--danger)' }}>
                 <AlertCircle size={18} /> Non-Returnable Items
             </h3>
             <ul style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: '1.8', paddingLeft: '20px' }}>
                 <li>Perishable goods or custom products</li>
                 <li>Personal care and hygiene items</li>
                 <li>Digital downloads or gift cards</li>
                 <li>Clearance or final sale items</li>
             </ul>
          </div>
       </div>
      
    </div>
  );
}

// Needed because Package and Truck are referenced in steps but missing from imports
import { Package, Truck } from 'lucide-react';
