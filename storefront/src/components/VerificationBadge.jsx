import React from 'react';
import { ShieldCheck, ShieldAlert, Clock } from 'lucide-react';

export default function VerificationBadge({ verified, pending, showText = true, size = 14 }) {
  if (verified) {
    return (
      <div style={{ 
        display: 'inline-flex', 
        alignItems: 'center', 
        gap: '4px', 
        color: 'var(--success)', 
        background: 'rgba(34, 197, 94, 0.1)', 
        padding: '2px 8px', 
        borderRadius: '100px',
        fontSize: '11px',
        fontWeight: 700,
        border: '1px solid rgba(34, 197, 94, 0.2)'
      }}>
        <ShieldCheck size={size} />
        {showText && <span>Verified</span>}
      </div>
    );
  }

  if (pending) {
    return (
      <div style={{ 
        display: 'inline-flex', 
        alignItems: 'center', 
        gap: '4px', 
        color: 'var(--warning)', 
        background: 'rgba(245, 158, 11, 0.1)', 
        padding: '2px 8px', 
        borderRadius: '100px',
        fontSize: '11px',
        fontWeight: 700,
        border: '1px solid rgba(245, 158, 11, 0.2)'
      }}>
        <Clock size={size} />
        {showText && <span>Pending Review</span>}
      </div>
    );
  }

  return (
    <div style={{ 
      display: 'inline-flex', 
      alignItems: 'center', 
      gap: '4px', 
      color: 'var(--danger)', 
      background: 'rgba(239, 68, 68, 0.1)', 
      padding: '2px 8px', 
      borderRadius: '100px',
      fontSize: '11px',
      fontWeight: 700,
      border: '1px solid rgba(239, 68, 68, 0.2)'
    }}>
      <ShieldAlert size={size} />
      {showText && <span>Unverified</span>}
    </div>
  );
}
