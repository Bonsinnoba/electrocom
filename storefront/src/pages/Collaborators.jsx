import React from 'react';
import { Users, Star, ShieldCheck, Heart, Github, Linkedin, Globe, MessageSquare } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

const COLLABORATORS = [
    {
        id: 1,
        name: "Alex Thompson",
        role: "Lead Architect",
        contribution: "Designed the core decoupled API architecture and security protocols.",
        category: "Core Team",
        socials: { github: "#", linkedin: "#" }
    },
    {
        id: 2,
        name: "Sarah Chen",
        role: "Senior UX Engineer",
        contribution: "Crafted the premium storefront experience and fluid design system.",
        category: "Core Team",
        socials: { github: "#", twitter: "#" }
    },
    {
        id: 3,
        name: "Global Tech Solutions",
        role: "Strategic Partner",
        contribution: "Providing specialized logistics and supply chain integration support.",
        category: "Partners",
        website: "https://example.com"
    },
    {
        id: 4,
        name: "Marcus Miller",
        role: "Community Contributor",
        contribution: "Optimized the real-time stock automation engine for high-volume stores.",
        category: "Community",
        socials: { github: "#" }
    }
];

const SUPPORTERS = [
    { id: 1, name: "Vanguard Electronics", tier: "Platinum" },
    { id: 2, name: "SecurePay Africa", tier: "Gold" },
    { id: 3, name: "CloudScale Hosting", tier: "Gold" },
    { id: 4, name: "David Mensah", tier: "Individual" },
    { id: 5, name: "Elena Rodriguez", tier: "Individual" }
];

export default function Collaborators() {
    const { siteSettings } = useSettings();

    return (
        <div className="collaborators-page animate-fade-in" style={{ paddingBottom: '80px' }}>
            
            {/* Hero Section */}
            <div className="hero-section glass" style={{ 
                padding: '80px 40px', 
                textAlign: 'center', 
                borderRadius: '0 0 40px 40px',
                marginBottom: '60px',
                background: 'linear-gradient(135deg, var(--bg-surface), var(--bg-main))'
            }}>
                <div style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: '12px', 
                    padding: '8px 20px', 
                    background: 'var(--info-bg)', 
                    color: 'var(--primary-blue)', 
                    borderRadius: '30px',
                    fontSize: '14px',
                    fontWeight: 800,
                    marginBottom: '24px'
                }}>
                    <Users size={16} />
                    <span>THE NETWORK</span>
                </div>
                <h1 style={{ fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 900, letterSpacing: '-2px', marginBottom: '20px' }}>
                    Supporters & <span style={{ color: 'var(--primary-blue)' }}>Collaborators</span>
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '18px', maxWidth: '700px', margin: '0 auto', lineHeight: '1.6' }}>
                    ElectrCom is more than a platform—it's a collaborative effort driven by visionaries, 
                    dedicated partners, and our incredible community. We are honored to recognize those 
                    who make this ecosystem possible.
                </p>
            </div>

            <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
                
                {/* Collaborators Grid */}
                <div style={{ marginBottom: '80px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '40px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--primary-blue)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Star size={20} />
                        </div>
                        <h2 style={{ fontSize: '28px', fontWeight: 900 }}>Core Contributors</h2>
                    </div>

                    <div className="collaborators-grid">
                        {COLLABORATORS.map((person) => (
                            <div key={person.id} className="collaborator-card glass">
                                <div className="category-badge">{person.category}</div>
                                <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '4px' }}>{person.name}</h3>
                                <div style={{ color: 'var(--primary-blue)', fontSize: '14px', fontWeight: 700, marginBottom: '16px' }}>{person.role}</div>
                                <p style={{ color: 'var(--text-muted)', fontSize: '15px', lineHeight: '1.6', marginBottom: '24px' }}>
                                    {person.contribution}
                                </p>
                                <div style={{ display: 'flex', gap: '12px', marginTop: 'auto' }}>
                                    {person.socials?.github && <a href={person.socials.github} className="social-icon"><Github size={18} /></a>}
                                    {person.socials?.linkedin && <a href={person.socials.linkedin} className="social-icon"><Linkedin size={18} /></a>}
                                    {person.website && <a href={person.website} className="social-icon"><Globe size={18} /></a>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Supporters Section */}
                <div className="supporters-section glass" style={{ padding: '60px', borderRadius: '40px' }}>
                    <div style={{ textAlign: 'center', marginBottom: '48px' }}>
                        <div style={{ color: 'var(--primary-blue)', marginBottom: '12px' }}><Heart size={32} fill="var(--primary-blue)" /></div>
                        <h2 style={{ fontSize: '32px', fontWeight: 900, marginBottom: '12px' }}>Our Supporters</h2>
                        <p style={{ color: 'var(--text-muted)' }}>Special thanks to the organizations and individuals backing our mission.</p>
                    </div>

                    <div className="supporters-grid">
                        {SUPPORTERS.map(sup => (
                            <div key={sup.id} className="supporter-item">
                                <div className={`tier-dot ${sup.tier.toLowerCase()}`}></div>
                                <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{sup.name}</span>
                                <span className="tier-badge">{sup.tier}</span>
                            </div>
                        ))}
                    </div>

                    <div style={{ marginTop: '60px', textAlign: 'center', padding: '32px', background: 'var(--bg-main)', borderRadius: '24px', border: '1px dashed var(--border-light)' }}>
                        <h4 style={{ fontWeight: 800, marginBottom: '8px' }}>Become a Supporter</h4>
                        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '20px' }}>Interested in collaborating or supporting {siteSettings.siteName}? We'd love to hear from you.</p>
                        <button className="btn-primary" style={{ padding: '12px 32px' }}>
                            <MessageSquare size={18} style={{ marginRight: '8px' }} />
                            Contact Our Team
                        </button>
                    </div>
                </div>

            </div>

            <style>{`
                .collaborators-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                    gap: 24px;
                }

                .collaborator-card {
                    padding: 32px;
                    border-radius: 28px;
                    display: flex;
                    flex-direction: column;
                    position: relative;
                    transition: transform 0.3s ease, border-color 0.3s ease;
                }

                .collaborator-card:hover {
                    transform: translateY(-8px);
                    border-color: var(--primary-blue);
                }

                .category-badge {
                    font-size: 10px;
                    font-weight: 900;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    padding: 4px 10px;
                    background: var(--bg-surface-secondary);
                    color: var(--text-muted);
                    border-radius: 8px;
                    width: fit-content;
                    margin-bottom: 20px;
                }

                .social-icon {
                    color: var(--text-muted);
                    transition: color 0.2s;
                }

                .social-icon:hover {
                    color: var(--primary-blue);
                }

                .supporters-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
                    gap: 16px;
                }

                .supporter-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 16px 20px;
                    background: var(--bg-surface);
                    border-radius: 16px;
                    border: 1px solid var(--border-light);
                }

                .tier-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                }

                .tier-dot.platinum { background: #e5e7eb; box-shadow: 0 0 10px rgba(229, 231, 235, 0.5); }
                .tier-dot.gold { background: #f59e0b; box-shadow: 0 0 10px rgba(245, 158, 11, 0.5); }
                .tier-dot.individual { background: var(--primary-blue); }

                .tier-badge {
                    margin-left: auto;
                    font-size: 10px;
                    font-weight: 800;
                    color: var(--text-muted);
                    opacity: 0.6;
                }

                @media (max-width: 768px) {
                    .supporters-section { padding: 30px 20px; }
                    .hero-section { padding: 60px 20px; }
                }
            `}</style>
        </div>
    );
}
