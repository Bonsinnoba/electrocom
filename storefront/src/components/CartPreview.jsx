import React from 'react';
import { useCart } from '../context/CartContext';
import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';

export default function CartPreview() {
  const { cartItems, removeFromCart, updateQuantity, subtotal } = useCart();
  const { formatPrice } = useSettings();

  return (
    <div className="cart-preview-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%' }}>
      <div className="cart-items-list" style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '16px', 
        maxHeight: '400px', 
        overflowY: 'auto',
        paddingRight: '4px'
      }}>
        {cartItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
            <ShoppingBag size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
            <p>Your cart is empty</p>
          </div>
        ) : (
          cartItems.map((item, index) => (
            <div key={`${item.id}-${item.selectedColor}-${index}`} style={{ 
              display: 'flex', 
              gap: '12px', 
              padding: '12px', 
              background: 'var(--bg-main)', 
              borderRadius: '12px',
              border: '1px solid var(--border-light)'
            }}>
              <img src={item.image} alt={item.name} style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '2px' }}>{item.name}</div>
                <div style={{ fontSize: '12px', color: 'var(--primary-blue)', marginBottom: '8px' }}>{item.selectedColor}</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', padding: '2px' }}>
                    <button 
                      onClick={() => updateQuantity(item.id, item.selectedColor, -1)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-main)', cursor: 'pointer', padding: '2px' }}
                    >
                      <Minus size={12} />
                    </button>
                    <span style={{ fontSize: '12px', fontWeight: 700, minWidth: '20px', textAlign: 'center' }}>{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.id, item.selectedColor, 1)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-main)', cursor: 'pointer', padding: '2px' }}
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '14px' }}>{formatPrice(item.price * item.quantity)}</div>
                </div>
              </div>
              <button 
                onClick={() => removeFromCart(item.id, item.selectedColor)}
                style={{ background: 'none', border: 'none', color: 'var(--danger)', opacity: 0.6, cursor: 'pointer', alignSelf: 'start' }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))
        )}
      </div>

      {cartItems.length > 0 && (
        <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border-light)', paddingTop: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontWeight: 800, fontSize: '18px' }}>
            <span>Total</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <Link to="/cart" className="btn-primary" style={{ width: '100%', textAlign: 'center', display: 'flex', textDecoration: 'none' }}>
            <ShoppingBag size={18} style={{ marginRight: '8px' }} />
            Checkout Now
          </Link>
        </div>
      )}
    </div>
  );
}
