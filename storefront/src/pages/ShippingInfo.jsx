import React from 'react';
import { Truck, Package, Clock, ShieldCheck, MapPin } from 'lucide-react';

export default function ShippingInfo() {
  const policies = [
    {
      icon: <Truck size={24} className="text-primary-blue" />,
      title: "Delivery Options",
      desc: "We offer standard (3-5 business days) and express (1-2 business days) shipping options nationwide."
    },
    {
      icon: <Package size={24} className="text-primary-blue" />,
      title: "Order Tracking",
      desc: "Once your order is processed, a tracking link will be provided via email or SMS depending on your preferences."
    },
    {
      icon: <MapPin size={24} className="text-primary-blue" />,
      title: "Coverage Areas",
      desc: "We currently deliver to all primary regions within the country. Remote areas may incur additional delivery times."
    },
    {
      icon: <Clock size={24} className="text-primary-blue" />,
      title: "Processing Time",
      desc: "Orders placed before 2 PM local time are processed the same business day."
    }
  ];

  return (
    <div className="shipping-page" style={{ padding: '60px 20px', maxWidth: '800px', margin: '0 auto', minHeight: '80vh' }}>
      
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '36px', fontWeight: 800, marginBottom: '12px' }}>Shipping Information</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '16px', maxWidth: '500px', margin: '0 auto' }}>
          Everything you need to know about getting your EssentialsHub products delivered securely and on time.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        {policies.map((p, i) => (
          <div key={i} className="glass" style={{ padding: '30px', borderRadius: '16px', border: '1px solid var(--border-light)' }}>
            <div style={{ background: 'var(--info-bg)', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-blue)', marginBottom: '16px' }}>
              {p.icon}
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>{p.title}</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.6' }}>{p.desc}</p>
          </div>
        ))}
      </div>

      <div className="glass" style={{ marginTop: '40px', padding: '30px', borderRadius: '16px', border: '1px solid var(--border-light)' }}>
         <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldCheck size={20} style={{ color: 'var(--success)' }} />
            Shipping Protection Guarantee
         </h2>
         <p style={{ color: 'var(--text-muted)', fontSize: '15px', lineHeight: '1.6' }}>
            All standard and express deliveries are backed by our Shipping Protection Guarantee. If your package is lost in transit or arrives critically damaged, we will replace the affected items immediately at zero cost to you. 
         </p>
      </div>
      
    </div>
  );
}
