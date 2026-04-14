import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(0);
  const { siteSettings } = useSettings();
  const { siteName, siteEmail, phone1, phone2 } = siteSettings;

  const faqs = useMemo(() => {
    const phoneLine = [phone1, phone2].filter(Boolean).join(' / ') || 'our support number';
    const email = siteEmail || 'support@example.com';

    return [
      {
        q: `What types of products does ${siteName} sell?`,
        a: `${siteName} offers a curated catalog of products. Check the shop and categories for current availability, specifications, and pricing.`
      },
      {
        q: 'Are products genuine and quality-checked?',
        a: `We work with verified suppliers and perform quality checks before stocking. If you receive a defective item, contact us for a replacement where eligible.`
      },
      {
        q: 'Can I modify or cancel my order?',
        a: "Orders can be modified or cancelled within 1 hour of placement in many cases. Once an order enters the 'processing' or 'shipped' phase, it may not be altered. You may return eligible items after delivery according to our returns policy."
      },
      {
        q: 'Do you offer bulk or institutional pricing?',
        a: `Yes — contact us at ${email} with your list and quantities for a quote.`
      },
      {
        q: 'What payment methods are accepted?',
        a: 'We accept major cards, mobile money, and other methods shown at checkout. All transactions are processed securely.'
      },
      {
        q: 'Do I need an account to place an order?',
        a: 'An account helps us provide order history, tracking, and support. Sign-up may be required depending on store settings.'
      },
      {
        q: 'How do I contact customer support?',
        a: `Use the Support section in your account, email ${email}, call ${phoneLine}, or reach us on WhatsApp if listed on the site.`
      }
    ];
  }, [siteName, siteEmail, phone1, phone2]);

  return (
    <div className="faq-page" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
         <div style={{ background: 'var(--info-bg)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-blue)', margin: '0 auto 20px auto' }}>
             <HelpCircle size={32} />
         </div>
        <h1 style={{ fontSize: '36px', fontWeight: 800, marginBottom: '12px' }}>Frequently Asked Questions</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '16px', maxWidth: '600px', margin: '0 auto' }}>
          {`Find quick answers to common questions about shopping with ${siteName}.`}
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {faqs.map((faq, index) => (
          <div 
            key={index} 
            className="glass"
            style={{ 
              borderRadius: '16px', 
              border: '1px solid var(--border-light)',
              overflow: 'hidden',
              transition: 'all 0.3s ease'
            }}
          >
            <button
              onClick={() => setOpenIndex(openIndex === index ? -1 : index)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '24px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                color: 'var(--text-main)',
                fontWeight: 700,
                fontSize: '16px'
              }}
            >
              <span style={{ paddingRight: '20px' }}>{faq.q}</span>
              <div style={{ color: openIndex === index ? 'var(--primary-blue)' : 'var(--text-muted)' }}>
                {openIndex === index ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>
            </button>
            
            <div 
              style={{ 
                height: openIndex === index ? 'auto' : 0, 
                opacity: openIndex === index ? 1 : 0,
                padding: openIndex === index ? '0 24px 24px 24px' : '0 24px',
                color: 'var(--text-muted)',
                lineHeight: '1.6',
                fontSize: '15px',
                transition: 'all 0.3s ease'
              }}
            >
              {faq.a}
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '60px', textAlign: 'center', padding: '40px', background: 'var(--bg-surface)', borderRadius: '16px', border: '1px dashed var(--border-light)' }}>
         <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '8px' }}>Still have questions?</h3>
         <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '20px' }}>Our support team is here to help.</p>
         <button className="btn-primary" style={{ padding: '12px 24px', fontWeight: 600 }}>Contact Support</button>
      </div>
      
    </div>
  );
}
