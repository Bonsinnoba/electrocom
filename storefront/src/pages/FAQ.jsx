import React, { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(0);

  const faqs = [
    {
      q: "What types of products does ElectroCom sell?",
      a: "ElectroCom specializes in electronic components (resistors, capacitors, transistors, ICs, LEDs, sensors), microcontroller modules (Arduino, ESP32, Raspberry Pi accessories), breadboards, jumper wires, soldering tools, power supplies, and complete STEM project kits for students, hobbyists, and professional engineers."
    },
    {
      q: "Are your components genuine and quality-tested?",
      a: "Yes. All components sold on ElectroCom are sourced from verified suppliers and pass quality checks before stocking. Datasheets are available on request for most ICs and modules. If you receive a defective part, we will replace it free of charge."
    },
    {
      q: "Can I modify or cancel my order?",
      a: "Orders can be modified or cancelled within 1 hour of placement. Once an order enters the 'processing' or 'shipped' phase, it cannot be altered. You will need to wait for delivery and initiate a standard return for eligible items."
    },
    {
      q: "Do you sell components in bulk for schools or businesses?",
      a: "Yes! We offer bulk pricing for institutions, schools, universities, and businesses. Contact us at support@electrocom.com with your component list and quantities and we'll provide a custom quote within 24 hours."
    },
    {
      q: "What payment methods are accepted?",
      a: "We accept Visa, MasterCard, Mobile Money (MTN, Vodafone, AirtelTigo), and direct bank transfers. All transactions are securely encrypted."
    },
    {
      q: "Do I need an account to place an order?",
      a: "Yes. An account is required to place an order so we can provide accurate tracking, order history, and dedicated customer support."
    },
    {
      q: "Do you carry STEM kits suitable for beginners?",
      a: "Absolutely. We stock beginner-friendly STEM kits that include everything needed to complete guided projects — components, a breadboard, jumper wires, and step-by-step instructions. They are ideal for students from secondary school through university level."
    },
    {
      q: "How do I contact customer support?",
      a: "You can reach us via the 'Support' tab in your dashboard, email us at support@electrocom.com, call us on 0536683393 / 0506408074, or message us on WhatsApp for quick replies."
    }
  ];

  return (
    <div className="faq-page" style={{ padding: '60px 20px', maxWidth: '800px', margin: '0 auto', minHeight: '80vh' }}>
      
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
         <div style={{ background: 'var(--info-bg)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-blue)', margin: '0 auto 20px auto' }}>
             <HelpCircle size={32} />
         </div>
        <h1 style={{ fontSize: '36px', fontWeight: 800, marginBottom: '12px' }}>Frequently Asked Questions</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '16px', maxWidth: '600px', margin: '0 auto' }}>
          Find quick answers to the most common questions regarding your ElectroCom experience.
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
         <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '20px' }}>Our dedicated support team is available 24/7 to assist you.</p>
         <button className="btn-primary" style={{ padding: '12px 24px', fontWeight: 600 }}>Contact Support</button>
      </div>
      
    </div>
  );
}
