import React from 'react';
import { X, Star, Heart } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { useWishlist } from '../context/WishlistContext';
import { useUser } from '../context/UserContext';

export default function ProductCard({ id, name, price, image, rating, onClick, onRemove }) {
  const { formatPrice } = useSettings();
  const safeRating = parseFloat(rating) || 0;
  
  // Use hooks for wishlist and user state
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { user, openAuthModal } = useUser();
  const inWishlist = isInWishlist(id || name); 

  const handleWishlistClick = (e) => {
    e.stopPropagation();
    if (!user) {
      openAuthModal('signin');
      return;
    }
    toggleWishlist({ id, name, price, image, rating });
  };

  return (
    <div className="product-card" onClick={onClick} style={{ position: 'relative' }}>
      {/* Heart Toggle Button - Shown on all cards if onRemove is NOT present (Shop view) */}
      {!onRemove && (
        <button 
          onClick={handleWishlistClick}
          className={`sidebar-icon ${inWishlist ? 'active' : ''}`}
          style={{ 
            position: 'absolute', 
            top: '8px', 
            right: '8px', 
            width: '32px', 
            height: '32px', 
            margin: 0,
            background: inWishlist ? 'var(--danger-bg)' : 'rgba(255,255,255,0.8)',
            color: inWishlist ? 'var(--danger)' : 'var(--text-muted)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            zIndex: 10,
            backdropFilter: 'blur(4px)',
            transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            transform: 'scale(1)',
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.15)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          title={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart size={16} fill={inWishlist ? "var(--danger)" : "none"} />
        </button>
      )}
      
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