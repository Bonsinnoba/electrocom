import { useEffect, useState } from 'react';
import { useSettings } from '../context/SettingsContext';

const GEARS_SVG = (
  <svg viewBox="0 0 200 200" width="240" height="240" style={{ display: 'block', margin: '0 auto' }}>
    <defs>
      <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#6366f1" />
        <stop offset="100%" stopColor="#8b5cf6" />
      </linearGradient>
      <linearGradient id="g2" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#ec4899" />
        <stop offset="100%" stopColor="#f59e0b" />
      </linearGradient>
    </defs>
    {/* Large gear */}
    <g className="gear-large" style={{ transformOrigin: '80px 90px', animation: 'rotateCW 8s linear infinite' }}>
      <circle cx="80" cy="90" r="32" fill="url(#g1)" opacity="0.15" />
      <circle cx="80" cy="90" r="20" fill="none" stroke="url(#g1)" strokeWidth="3" />
      {[0,45,90,135,180,225,270,315].map((a, i) => (
        <rect key={i} x="77" y="56" width="6" height="12" rx="2"
          fill="url(#g1)"
          style={{ transformOrigin: '80px 90px', transform: `rotate(${a}deg)` }} />
      ))}
      <circle cx="80" cy="90" r="6" fill="url(#g1)" />
    </g>
    {/* Small gear */}
    <g className="gear-small" style={{ transformOrigin: '128px 75px', animation: 'rotateCCW 5s linear infinite' }}>
      <circle cx="128" cy="75" r="20" fill="url(#g2)" opacity="0.15" />
      <circle cx="128" cy="75" r="12" fill="none" stroke="url(#g2)" strokeWidth="2.5" />
      {[0,51.4,102.8,154.2,205.6,257,308.4].map((a, i) => (
        <rect key={i} x="126" y="59" width="4" height="9" rx="2"
          fill="url(#g2)"
          style={{ transformOrigin: '128px 75px', transform: `rotate(${a}deg)` }} />
      ))}
      <circle cx="128" cy="75" r="4" fill="url(#g2)" />
    </g>
    <style>{`
      @keyframes rotateCW  { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      @keyframes rotateCCW { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }
    `}</style>
  </svg>
);

function AnimatedDot({ delay }) {
  return (
    <span style={{
      display: 'inline-block',
      width: '8px', height: '8px',
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
      margin: '0 4px',
      animation: `dotBounce 1.4s ease-in-out ${delay}s infinite`
    }} />
  );
}

export default function MaintenancePage() {
  const { siteSettings } = useSettings();
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const tick = () => setTimeStr(new Date().toLocaleTimeString());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f0c29 0%, #1a1040 50%, #0f0c29 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      fontFamily: "'Inter', sans-serif",
      color: '#fff',
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* Ambient blobs */}
      <div style={{ position: 'absolute', top: '-120px', left: '-120px', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-100px', right: '-100px', width: '350px', height: '350px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(236,72,153,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: '40%', left: '-60px', width: '200px', height: '200px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

      {/* Glass card */}
      <div style={{
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(24px)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '32px',
        padding: '60px 48px',
        maxWidth: '560px',
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 32px 80px rgba(0,0,0,0.4)',
        position: 'relative',
        zIndex: 1,
      }}>

        {/* Gears */}
        <div style={{ marginBottom: '32px' }}>
          {GEARS_SVG}
        </div>

        {/* Brand */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.15))',
          border: '1px solid rgba(99,102,241,0.3)',
          borderRadius: '20px', padding: '5px 14px',
          fontSize: '12px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase',
          color: '#a78bfa', marginBottom: '24px'
        }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#a78bfa', animation: 'dotBounce 2s ease-in-out infinite' }} />
          {siteSettings.siteName}
        </div>

        {/* Heading */}
        <h1 style={{
          fontSize: '36px',
          fontWeight: 900,
          letterSpacing: '-1px',
          lineHeight: 1.2,
          marginBottom: '16px',
          background: 'linear-gradient(135deg, #fff 30%, #a78bfa)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          We'll Be Right<br />Back!
        </h1>

        {/* Message */}
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '16px', lineHeight: 1.7, marginBottom: '36px', maxWidth: '380px', marginLeft: 'auto', marginRight: 'auto' }}>
          Our team is currently upgrading the platform to bring you a better, faster experience. We appreciate your patience and will be back very soon.
        </p>

        {/* Loading dots */}
        <div style={{ marginBottom: '36px' }}>
          <AnimatedDot delay={0} />
          <AnimatedDot delay={0.2} />
          <AnimatedDot delay={0.4} />
        </div>

        {/* Contact nudge */}
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '16px',
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          textAlign: 'left',
        }}>
          <div style={{ fontSize: '24px', flexShrink: 0 }}>💬</div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff', marginBottom: '3px' }}>Need urgent help?</div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
              Email us at{' '}
              <a href={`mailto:${siteSettings.siteEmail || 'support@electrocom.com'}`} style={{ color: '#a78bfa', fontWeight: 700, textDecoration: 'none' }}>
                {siteSettings.siteEmail || 'support@electrocom.com'}
              </a>
              {' '}and we'll respond right away.
            </div>
          </div>
        </div>

        {/* Clock */}
        <p style={{ marginTop: '24px', fontSize: '12px', color: 'rgba(255,255,255,0.3)', fontVariantNumeric: 'tabular-nums' }}>
          Current time: {timeStr}
        </p>
      </div>

      {/* Social links */}
      <div style={{ marginTop: '32px', display: 'flex', gap: '16px', zIndex: 1 }}>
        {[
          siteSettings.socialInstagram && { label: 'Instagram', url: siteSettings.socialInstagram },
          siteSettings.socialTwitter && { label: 'Twitter/X', url: siteSettings.socialTwitter },
          siteSettings.socialFacebook && { label: 'Facebook', url: siteSettings.socialFacebook },
        ].filter(Boolean).map(s => (
          <a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer"
            style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontWeight: 600, textDecoration: 'none' }}>
            {s.label}
          </a>
        ))}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');
        @keyframes dotBounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 1; }
          40% { transform: translateY(-10px); opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}
