import React from 'react';
import { X, Star } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

export default function ProductCard({ name, price, image, rating, onClick, onRemove }) {
  const { formatPrice } = useSettings();
  const safeRating = parseFloat(rating) || 0;

  return (
    <div className="product-card" onClick={onClick} style={{ position: 'relative' }}>
      {onRemove && (
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="sidebar-icon" 
          style={{ 
            position: 'absolute', 
            top: '8px', 
            right: '8px', 
            width: '28px', 
            height: '28px', 
            margin: 0,
            background: 'var(--bg-surface)',
            color: 'var(--danger)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            zIndex: 10
          }}
          title="Remove from favorites"
        >
          <X size={16} />
        </button>
      )}
      {image ? (
        <img src={image} className="product-image" alt={name} />
      ) : (
        <div className="product-image" style={{ background: 'var(--bg-surface-secondary)' }}></div>
      )}
      <div className="product-info">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <h3 style={{ margin: 0 }}>{name}</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '2px', background: 'var(--warning-bg)', padding: '2px 6px', borderRadius: '4px' }}>
                <Star size={10} fill="var(--warning)" color="var(--warning)" />
                <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--warning)' }}>{safeRating.toFixed(1)}</span>
            </div>
        </div>
        <p style={{ margin: 0 }}>{formatPrice(price)}</p>
      </div>
    </div>
  );
}