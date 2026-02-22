import React, { useState } from 'react';
import { HelpCircle, MessageCircle, Phone, Mail, ChevronDown, Headphones, Heart, ExternalLink } from 'lucide-react';

export default function Support({ searchQuery = '' }) {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    { q: "How can I track my order?", a: "You can track your order in the Orders section." },
    { q: "What is your return policy?", a: "We offer a 30-day money-back guarantee." },
    { q: "Do you ship internationally?", a: "Yes, we ship to over 50 countries worldwide." },
    { q: "How do I change my shipping address?", a: "You can update it in your Profile or during checkout." },
    { q: "What payment methods do you accept?", a: "We accept all major credit cards, PayPal, and Mobile Money." },
    { q: "How do I cancel my order?", a: "Orders can be cancelled within 2 hours of placement." }
  ];

  const filteredFaqs = faqs.filter(f => 
    !searchQuery || 
    f.q.toLowerCase().includes(searchQuery.toLowerCase()) || 
    f.a.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const FAQCard = ({ item, index }) => {
    const isOpen = openIndex === index;

    return (
      <div className={`faq-card glass ${isOpen ? 'active' : ''}`} 
        onClick={() => setOpenIndex(isOpen ? null : index)}
        style={{ 
          padding: '24px', 
          display: 'flex',
          flexDirection: 'column',
          gap: isOpen ? '16px' : '0',
          cursor: 'pointer',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 800, fontSize: '16px', color: 'var(--text-main)', paddingRight: '24px' }}>{item.q}</div>
          <ChevronDown size={18} color={isOpen ? "var(--primary-blue)" : "var(--text-muted)"} 
            style={{ 
              transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: isOpen ? 'rotate(-180deg)' : 'rotate(0deg)'
            }} 
          />
        </div>
        
        <div style={{ 
          maxHeight: isOpen ? '200px' : '0',
          opacity: isOpen ? 1 : 0,
          overflow: 'hidden',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          fontSize: '15px', 
          color: 'var(--text-muted)', 
          lineHeight: '1.6'
        }}>
          {item.a}
        </div>

        <div className="card-hover-bg" style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          background: 'linear-gradient(135deg, var(--info-bg), transparent)', 
          opacity: isOpen ? 1 : 0, 
          transition: 'opacity 0.3s', 
          pointerEvents: 'none' 
        }}></div>
      </div>
    );
  };

  return (
    <div className="support-page" style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '40px', 
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
          <h1 style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-1px' }}>Help & Support</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '16px', marginTop: '4px' }}>Dedicated support to ensure your success with EssentialsHub.</p>
        </div>
      </div>

      {/* Hero: Live Chat */}
      <div style={{ 
        background: 'linear-gradient(135deg, var(--primary-blue), var(--accent-blue))', 
        borderRadius: '24px', 
        padding: '48px', 
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        boxShadow: '0 20px 40px rgba(59, 130, 246, 0.2)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ 
          background: 'rgba(255, 255, 255, 0.2)', 
          padding: '16px', 
          borderRadius: '50%', 
          marginBottom: '24px',
          backdropFilter: 'blur(10px)'
        }}>
          <MessageCircle size={32} />
        </div>
        <h2 style={{ fontSize: '28px', fontWeight: 800, margin: '0 0 12px 0' }}>Need instant assistance?</h2>
        <p style={{ fontSize: '16px', opacity: 0.9, maxWidth: '500px', lineHeight: '1.6', marginBottom: '32px' }}>
          Connect with our experts right now. Our average response time is under 1 minute for all active sessions.
        </p>
        <button className="btn-primary" style={{ 
          background: 'white', 
          color: 'var(--primary-blue)', 
          padding: '16px 40px', 
          borderRadius: '16px', 
          fontWeight: 800,
          border: 'none',
          boxShadow: '0 10px 15px rgba(0,0,0,0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          cursor: 'pointer'
        }}>
          Start Live Chat <ExternalLink size={18} />
        </button>
        
        {/* Decorative elements */}
        <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '300px', height: '300px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '50%' }}></div>
        <div style={{ position: 'absolute', bottom: '-50px', left: '-50px', width: '150px', height: '150px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '50%' }}></div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
        {/* FAQs Section */}
        <div className="support-section">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
            <HelpCircle size={24} color="var(--primary-blue)" />
            <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>Frequently Asked Questions</h2>
          </div>
          <div className="support-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
            {filteredFaqs.length > 0 ? (
              filteredFaqs.map((item, i) => <FAQCard key={i} index={i} item={item} />)
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                No questions matching "{searchQuery}"
              </div>
            )}
          </div>
        </div>

        {/* Contact Channels Section */}
        <div className="support-section">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
            <Headphones size={24} color="var(--primary-blue)" />
            <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>Direct Channels</h2>
          </div>
          <div className="support-grid" style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
            gap: '24px' 
          }}>
            {/* Phone Support */}
            <div className="contact-card glass" style={{ 
              padding: '32px', 
              borderRadius: '24px', 
              border: '1px solid var(--border-light)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: '20px',
              transition: 'all 0.3s ease'
            }}>
              <div style={{ background: 'var(--info-bg)', padding: '20px', borderRadius: '50%', color: 'var(--primary-blue)' }}>
                <Phone size={32} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: '18px', marginBottom: '6px' }}>Call Support</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.5' }}>Immediate voice assistance available 9am - 6pm</div>
              </div>
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <a href="tel:0536683393" className="btn-secondary" style={{ width: '100%', borderRadius: '14px', textDecoration: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '12px' }}>
                  0536683393
                </a>
                <a href="tel:0506408074" className="btn-secondary" style={{ width: '100%', borderRadius: '14px', textDecoration: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '12px' }}>
                  0506408074
                </a>
              </div>
            </div>

            {/* WhatsApp Support */}
            <div className="contact-card glass" style={{ 
              padding: '32px', 
              borderRadius: '24px', 
              border: '1px solid var(--border-light)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: '20px',
              transition: 'all 0.3s ease'
            }}>
              <div style={{ background: 'var(--success-bg)', padding: '20px', borderRadius: '50%', color: 'var(--success)' }}>
                <MessageCircle size={32} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: '18px', marginBottom: '6px' }}>WhatsApp Chat</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.5' }}>Message us for quick replies and image sharing</div>
              </div>
              <a href="https://wa.me/233536683393" target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{ 
                width: '100%', 
                borderRadius: '14px', 
                textDecoration: 'none', 
                background: 'var(--success-bg)', 
                color: 'var(--success)',
                borderColor: 'var(--success)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '8px',
                padding: '16px',
                fontWeight: 700,
                opacity: 0.8
              }}>
                Chat on WhatsApp
              </a>
            </div>

            {/* Email Support */}
            <div className="contact-card glass" style={{ 
              padding: '32px', 
              borderRadius: '24px', 
              border: '1px solid var(--border-light)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: '20px',
              transition: 'all 0.3s ease'
            }}>
              <div style={{ background: 'var(--danger-bg)', padding: '20px', borderRadius: '50%', color: 'var(--danger)' }}>
                <Mail size={32} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: '18px', marginBottom: '6px' }}>Email Inquiry</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.5' }}>For detailed requests, returns or order queries</div>
              </div>
              <a href="mailto:support@essentialshub.com" className="btn-secondary" style={{ width: '100%', borderRadius: '14px', textDecoration: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '16px' }}>
                support@essentialshub.com
              </a>
            </div>
          </div>
        </div>
      </div>

      <div style={{ borderTop: '1px solid var(--border-light)', padding: '48px 0', textAlign: 'center', marginTop: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', color: 'var(--primary-blue)', marginBottom: '12px' }}>
          <Heart size={20} fill="var(--primary-blue)" />
          <span style={{ fontWeight: 800, fontSize: '18px' }}>We're here for you</span>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '15px', maxWidth: '500px', margin: '0 auto', lineHeight: '1.6' }}>
          Our mission is to provide the best electronics with world-class support. EssentialsHub is community-driven and always ready to help.
        </p>
      </div>
    </div>
  );
}
