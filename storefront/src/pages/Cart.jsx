import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useNotifications } from '../context/NotificationContext';
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft, Heart, X, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Cart() {
  const { cartItems, removeFromCart, updateQuantity, subtotal } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { addNotification } = useNotifications();
  
  const [confirmDelete, setConfirmDelete] = useState(null);

  const tax = subtotal * 0.1;
  const total = subtotal + tax;

  const handleMoveToWishlist = () => {
    if (!confirmDelete) return;
    
    // Add to wishlist if not already there
    if (!isInWishlist(confirmDelete.id)) {
      toggleWishlist(confirmDelete);
    }
    
    // Remove from cart
    removeFromCart(confirmDelete.id, confirmDelete.selectedColor);
    addNotification(`${confirmDelete.name} moved to wishlist`, 'success');
    setConfirmDelete(null);
  };

  const handleFinalDelete = () => {
    if (!confirmDelete) return;
    removeFromCart(confirmDelete.id, confirmDelete.selectedColor);
    addNotification(`${confirmDelete.name} removed from cart`, 'info');
    setConfirmDelete(null);
  };

  if (cartItems.length === 0) {
    return (
      <div className="card glass animate-fade-in cart-empty-state">
        <div className="cart-icon-wrapper">
          <ShoppingBag size={64} />
        </div>
        <h2 className="cart-empty-title">Your cart is empty</h2>
        <p className="cart-empty-desc">
          Looks like you haven't added anything to your cart yet. Explore our premium collection and find something you love.
        </p>
        <Link to="/" className="btn-primary cart-link-btn">
          <ArrowLeft size={18} /> Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="card glass animate-fade-in cart-container" style={{ position: 'relative' }}>
      <div className="page-header cart-page-header">
        <h1 className="cart-title">Shopping Cart</h1>
        <p className="cart-subtitle">You have {cartItems.length} items in your cart.</p>
      </div>
      
      <div className="cart-content">
        <div className="cart-grid">
          <div className="cart-items-section">
            <div className="cart-items-wrapper">
              {cartItems.map((item, index) => (
                <div key={`${item.id}-${item.selectedColor}-${index}`} className="cart-item-card">
                  <div className="cart-item-image-wrapper">
                    <img src={item.image} alt={item.name} className="cart-item-image" />
                  </div>
                  <div className="cart-item-details">
                    <div className="cart-item-header">
                      <div>
                        <h4 className="cart-item-name">{item.name}</h4>
                        <div className="cart-item-color">{item.selectedColor}</div>
                      </div>
                      <button 
                        onClick={() => setConfirmDelete(item)}
                        className="btn-remove-cart"
                        title="Remove Item"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                    
                    <div className="cart-item-footer">
                      <div className="cart-qty-control">
                        <button 
                          onClick={() => updateQuantity(item.id, item.selectedColor, -1)}
                          className="btn-qty"
                        >
                          <Minus size={16} />
                        </button>
                        <span className="qty-display">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, item.selectedColor, 1)}
                          className="btn-qty"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                      <div className="item-total-price">${(parseFloat(item.price) * item.quantity).toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="cart-summary-section">
            <div className="cart-summary-card">
              <h3 className="cart-summary-title">Order Summary</h3>
              
              <div className="summary-rows">
                <div className="summary-row">
                  <span className="text-muted">Subtotal</span>
                  <span className="font-bold">${subtotal.toFixed(2)}</span>
                </div>
                <div className="summary-row">
                  <span className="text-muted">Estimated Tax (10%)</span>
                  <span className="font-bold">${tax.toFixed(2)}</span>
                </div>
                <div className="summary-row">
                  <span className="text-muted">Shipping</span>
                  <span className="text-success">FREE</span>
                </div>
                
                <div className="summary-divider-line"></div>
                
                <div className="summary-total-row">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>

              <Link to="/checkout" style={{ textDecoration: 'none' }}>
                <button className="btn-primary btn-checkout-summary">
                  Proceed to Checkout
                </button>
              </Link>
              
              <div className="secure-checkout-text">
                Secure SSL Encrypted Checkout
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmDelete && (
        <div className="modal-overlay" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 3000,
            padding: '20px'
        }}>
            <div className="card glass animate-fade-in" style={{
                maxWidth: '450px',
                width: '100%',
                padding: '32px',
                textAlign: 'center',
                position: 'relative',
                border: '1px solid var(--primary-blue)'
            }}>
                <button 
                    onClick={() => setConfirmDelete(null)}
                    style={{
                        position: 'absolute',
                        top: '16px',
                        right: '16px',
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer'
                    }}
                >
                    <X size={24} />
                </button>
                
                <div style={{
                    width: '64px',
                    height: '64px',
                    background: 'var(--danger-bg)',
                    color: 'var(--danger)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 24px'
                }}>
                    <AlertCircle size={32} />
                </div>

                <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '12px' }}>Remove Item?</h2>
                <p style={{ color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '32px' }}>
                    Would you like to move <strong>{confirmDelete.name}</strong> to your wishlist for later, or remove it entirely from your cart?
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <button 
                        className="btn-primary" 
                        onClick={handleMoveToWishlist}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                    >
                        <Heart size={18} fill="white" /> Move to Wishlist
                    </button>
                    <button 
                        className="btn-outline" 
                        onClick={handleFinalDelete}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', color: 'var(--danger)', borderColor: 'var(--danger-bg)' }}
                    >
                        <Trash2 size={18} /> Remove Permanently
                    </button>
                    <button 
                        className="btn-secondary" 
                        onClick={() => setConfirmDelete(null)}
                        style={{ width: '100%', marginTop: '8px' }}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}

