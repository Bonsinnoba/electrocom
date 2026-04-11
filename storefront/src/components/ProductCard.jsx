import React from 'react';
import { X, Star, Heart, ShoppingCart } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { useWishlist } from '../context/WishlistContext';
import { useUser } from '../context/UserContext';
import { useCart } from '../context/CartContext';
import { useNotifications } from '../context/NotificationContext';


export default function ProductCard({ id, name, price, image, rating, discount_percent, sale_ends_at, onClick, onRemove }) {
  const { formatPrice } = useSettings();
  const safeRating = parseFloat(rating) || 0;
  
  const discount = parseInt(discount_percent) || 0;
  const isSaleActive = discount > 0 && (!sale_ends_at || new Date(sale_ends_at) > new Date());
  const discountedPrice = isSaleActive ? price * (1 - discount / 100) : price;
  const effectivePrice = isSaleActive ? discountedPrice : price;
  
  // Use hooks for wishlist and user state
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { user, openAuthModal } = useUser();
  const { addToCart } = useCart();
  const { addToast } = useNotifications();
  const inWishlist = isInWishlist(id); 

  const handleWishlistClick = (e) => {
    e.stopPropagation();
    if (!user) {
      openAuthModal('signin');
      return;
    }
    toggleWishlist({ id, name, price: effectivePrice, original_price: price, discount_percent: discount, image, rating });
  };

  const handleAddToCart = (e) => {
    e.stopPropagation();
    if (!user) {
      if (openAuthModal) openAuthModal('signin');
      return;
    }
    addToCart({ id, name, price: effectivePrice, original_price: price, discount_percent: discount, image, rating });
    addToast(`${name} added to cart`, 'success');
  };

  return (
    <div className="product-card animate-scale-in" onClick={onClick} style={{ position: 'relative' }}>

      {/* Heart Toggle Button - Shown on all cards if onRemove is NOT present (Shop view) */}
      {!onRemove && (
        <button 
          onClick={handleWishlistClick}
          className={`wishlist-btn ${inWishlist ? 'active' : ''}`}
          title={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
          aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart 
            size={18} 
            fill={inWishlist ? "currentColor" : "none"} 
            strokeWidth={inWishlist ? 0 : 2}
          />
        </button>
      )}

      {/* Add to Cart Button - Shown on all cards if onRemove is NOT present (Shop view) */}
      {!onRemove && (
        <button 
          onClick={handleAddToCart}
          className="add-to-cart-btn"
          title="Add to cart"
          aria-label="Add to cart"
        >
          <ShoppingCart size={18} />
        </button>
      )}

      
      {onRemove && (
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="wishlist-btn" 
          title="Remove from favorites"
          aria-label="Remove from favorites"
        >
          <X size={18} />
        </button>
      )}

      <div style={{ position: 'relative', width: '100%', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
        <img 
          src={image} 
          alt={name} 
          className="product-image" 
        />
        {isSaleActive && (
          <div style={{
            position: 'absolute',
            bottom: '12px',
            left: '12px',
            background: 'var(--danger)',
            color: 'white',
            padding: '4px 10px',
            borderRadius: '100px',
            fontSize: '11px',
            fontWeight: 800,
            zIndex: 10,
            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
            letterSpacing: '0.02em'
          }}>
            {discount}% OFF
          </div>
        )}
      </div>

      <div className="product-info">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <h3 style={{ margin: 0 }}>{name}</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '2px', background: 'var(--warning-bg)', padding: '2px 6px', borderRadius: '4px' }}>
                <Star size={10} fill="var(--warning)" color="var(--warning)" />
                <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--warning)' }}>{safeRating.toFixed(1)}</span>
            </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <p style={{ margin: 0, fontWeight: 700, color: isSaleActive ? 'var(--success)' : 'inherit', fontSize: '16px' }}>
                {formatPrice(effectivePrice)}
            </p>
            {isSaleActive && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)', textDecoration: 'line-through', opacity: 0.7 }}>
                      {formatPrice(price)}
                  </p>
                  <span style={{ fontSize: '11px', color: 'var(--danger)', fontWeight: 700 }}>
                    -{discount}%
                  </span>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}