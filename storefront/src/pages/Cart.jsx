import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useNotifications } from '../context/NotificationContext';
import {
  Trash2, Plus, Minus, ShoppingBag, ArrowLeft, Heart, X,
  AlertCircle, Tag, ShieldCheck, CheckSquare, Square
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { useSettings } from '../context/SettingsContext';

const itemKey = (item) => `${item.id}-${item.selectedColor}`;

export default function Cart() {
  const { user, openAuthModal } = useUser();
  const {
    cartItems, addToCart, removeFromCart, updateQuantity,
    appliedCoupon, applyCoupon, removeCoupon, isApplyingCoupon, couponError
  } = useCart();
  const { wishlistItems, toggleWishlist, isInWishlist } = useWishlist();
  const { addToast } = useNotifications();
  const { siteSettings, formatPrice } = useSettings();
  const navigate = useNavigate();

  // ── Selection state ──────────────────────────────────────────────────────
  const [selectedKeys, setSelectedKeys] = useState(() => new Set(cartItems.map(itemKey)));

  useEffect(() => {
    setSelectedKeys(prev => {
      const cartKeySet = new Set(cartItems.map(itemKey));
      const next = new Set();
      for (const k of prev) { if (cartKeySet.has(k)) next.add(k); }
      for (const k of cartKeySet) { if (!prev.has(k)) next.add(k); }
      return next;
    });
  }, [cartItems]);

  const allSelected  = cartItems.length > 0 && selectedKeys.size === cartItems.length;
  const noneSelected = selectedKeys.size === 0;

  const toggleSelectAll = () =>
    allSelected ? setSelectedKeys(new Set()) : setSelectedKeys(new Set(cartItems.map(itemKey)));

  const toggleItem = (item) => {
    setSelectedKeys(prev => {
      const next = new Set(prev);
      const k = itemKey(item);
      next.has(k) ? next.delete(k) : next.add(k);
      return next;
    });
  };

  const selectedItems = cartItems.filter(item => selectedKeys.has(itemKey(item)));

  // ── Totals (selected items only) ─────────────────────────────────────────
  const vatRate              = parseFloat(siteSettings?.vatRate || 10);
  const selectedSubtotal     = selectedItems.reduce((a, i) => a + parseFloat(i.price) * i.quantity, 0);
  const couponDiscount       = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const intThreshold         = Number(siteSettings?.integrityDiscountThreshold || 0);
  const intPct               = Number(siteSettings?.integrityDiscountPct || 0);
  const userPts              = Number(user?.loyalty_points || 0);
  const hasLoyalty           = intThreshold > 0 && userPts >= intThreshold && intPct > 0;
  const loyaltyAmt           = hasLoyalty ? Math.round(selectedSubtotal * (intPct / 100) * 100) / 100 : 0;
  const totalDiscount        = couponDiscount + loyaltyAmt;
  const taxableAmount        = Math.max(0, selectedSubtotal - totalDiscount);
  const tax                  = taxableAmount * (vatRate / 100);
  const total                = Math.max(0, taxableAmount + tax);

  // ── Misc state ────────────────────────────────────────────────────────────
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [couponInput, setCouponInput]     = useState('');

  const handleMoveToWishlist = () => {
    if (!confirmDelete) return;
    if (!isInWishlist(confirmDelete.id)) toggleWishlist(confirmDelete);
    removeFromCart(confirmDelete.id, confirmDelete.selectedColor);
    addToast(`${confirmDelete.name} moved to wishlist`, 'success');
    setConfirmDelete(null);
  };

  const handleFinalDelete = () => {
    if (!confirmDelete) return;
    removeFromCart(confirmDelete.id, confirmDelete.selectedColor);
    addToast(`${confirmDelete.name} removed from cart`, 'info');
    setConfirmDelete(null);
  };

  const handleCheckout = () => navigate('/checkout', { state: { selectedItems } });

  // ── Empty state ───────────────────────────────────────────────────────────
  if (cartItems.length === 0) {
    const hasWishlistItems = wishlistItems.length > 0;

    const handleAddAllFromWishlist = () => {
      wishlistItems.forEach(item => addToCart(item, 1, item.selectedColor || 'Default'));
      addToast(`${wishlistItems.length} item${wishlistItems.length !== 1 ? 's' : ''} added to cart`, 'success');
    };

    return (
      <div className="animate-fade-in" style={{ display:'flex', flexDirection:'column', gap:'28px', alignItems:'center', padding:'48px 0', width:'100%' }}>
        {/* Bare icon — no ring */}
        <div style={{ textAlign:'center' }}>
          <ShoppingBag size={56} style={{ opacity:0.25, marginBottom:'12px' }} />
          <h2 className="cart-empty-title">Your cart is empty</h2>
          <p className="cart-empty-desc" style={{ maxWidth:'340px', margin:'0 auto' }}>
            {hasWishlistItems
              ? 'Pick items from your favorites to get started.'
              : "Looks like you haven't added anything yet. Explore our collection and find something you love."}
          </p>
        </div>

        {hasWishlistItems ? (
          <div style={{ width:'100%', maxWidth:'760px' }}>
            {/* Header row */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'14px', flexWrap:'wrap', gap:'10px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'7px', fontWeight:800, fontSize:'15px' }}>
                <Heart size={16} color="var(--danger)" fill="var(--danger)" />
                Your Favorites
                <span style={{ fontSize:'12px', fontWeight:600, color:'var(--text-muted)' }}>({wishlistItems.length})</span>
              </div>
              <button
                onClick={handleAddAllFromWishlist}
                className="btn-primary"
                style={{ display:'flex', alignItems:'center', gap:'7px', padding:'8px 16px', fontSize:'12px' }}
              >
                <ShoppingBag size={13} /> Add All to Cart
              </button>
            </div>

            {/* Grid of compact cards */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:'10px' }}>
              {wishlistItems.map(item => (
                <div
                  key={item.id}
                  className="card glass animate-slide-up"
                  style={{ display:'flex', flexDirection:'column', gap:'8px', padding:'10px', borderRadius:'12px' }}
                >
                  <img
                    src={item.image || item.image_url}
                    alt={item.name}
                    style={{ width:'100%', aspectRatio:'1/1', objectFit:'cover', borderRadius:'8px', border:'1px solid var(--border-light)' }}
                  />
                  <div style={{ minWidth:0 }}>
                    <div style={{ fontWeight:700, fontSize:'12px', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{item.name}</div>
                    <div style={{ fontSize:'12px', color:'var(--text-muted)', marginTop:'2px' }}>{formatPrice(parseFloat(item.price))}</div>
                  </div>
                  <button
                    onClick={() => {
                      addToCart(item, 1, item.selectedColor || 'Default');
                      addToast(`${item.name} added to cart`, 'success');
                    }}
                    className="btn-primary"
                    style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'5px', padding:'7px 10px', fontSize:'12px', width:'100%' }}
                  >
                    <Plus size={13} /> Add to Cart
                  </button>
                </div>
              ))}
            </div>

            {/* Browse button */}
            <div style={{ textAlign:'center', marginTop:'20px' }}>
              <Link to="/" className="btn-outline" style={{ display:'inline-flex', alignItems:'center', gap:'7px', padding:'10px 24px', fontSize:'13px', borderRadius:'12px' }}>
                <ArrowLeft size={14} /> Browse More Products
              </Link>
            </div>
          </div>
        ) : (
          <Link to="/" className="btn-primary cart-link-btn"><ArrowLeft size={18} /> Start Shopping</Link>
        )}
      </div>
    );
  }


  return (
    <div className="animate-fade-in cart-container" style={{ display:'flex', flexDirection:'column', gap:'24px', position:'relative', width:'100%', maxWidth:'100%' }}>
      <div className="page-header cart-page-header">
        <h1 className="cart-title">Shopping Cart</h1>
        <p className="cart-subtitle">You have {cartItems.length} item{cartItems.length !== 1 ? 's' : ''} in your cart.</p>
      </div>

      <div className="cart-content">
        <div className="cart-grid">
          {/* ── Items column ── */}
          <div className="cart-items-section">

            {/* Select-All bar */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', marginBottom:'12px', background:'var(--bg-surface)', borderRadius:'12px', border:'1px solid var(--border-light)' }}>
              <button
                onClick={toggleSelectAll}
                style={{ display:'flex', alignItems:'center', gap:'10px', background:'none', border:'none', cursor:'pointer', color:'var(--text-main)', fontWeight:700, fontSize:'14px', padding:0 }}
              >
                {allSelected
                  ? <CheckSquare size={20} color="var(--primary-blue)" />
                  : <Square size={20} color="var(--text-muted)" />
                }
                {allSelected ? 'Deselect All' : 'Select All'}
              </button>
              <span style={{ fontSize:'13px', color:'var(--text-muted)' }}>
                {selectedKeys.size} of {cartItems.length} selected
              </span>
            </div>

            <div className="cart-items-wrapper">
              {cartItems.map((item, index) => {
                const k = itemKey(item);
                const isSelected = selectedKeys.has(k);
                return (
                  <div
                    key={`${item.id}-${item.selectedColor}-${index}`}
                    className="cart-item-card animate-slide-up"
                    style={{ animationDelay:`${index * 0.05}s`, animationFillMode:'both', opacity: isSelected ? 1 : 0.45, transition:'opacity 0.2s' }}
                  >
                    {/* Checkbox */}
                    <button
                      onClick={() => toggleItem(item)}
                      title={isSelected ? 'Deselect' : 'Select'}
                      style={{ background:'none', border:'none', cursor:'pointer', padding:'0 8px 0 0', flexShrink:0, display:'flex', alignItems:'center', color: isSelected ? 'var(--primary-blue)' : 'var(--text-muted)' }}
                    >
                      {isSelected ? <CheckSquare size={20} /> : <Square size={20} />}
                    </button>

                    <div className="cart-item-image-wrapper">
                      <img src={item.image} alt={item.name} className="cart-item-image" />
                    </div>

                    <div className="cart-item-details">
                      <div className="cart-item-header">
                        <div>
                          <h4 className="cart-item-name">{item.name}</h4>
                          <div className="cart-item-color">{item.selectedColor}</div>
                        </div>
                        <button onClick={() => setConfirmDelete(item)} className="btn-remove-cart" title="Remove Item">
                          <Trash2 size={20} />
                        </button>
                      </div>

                      <div className="cart-item-footer">
                        <div className="cart-qty-control">
                          <button onClick={() => updateQuantity(item.id, item.selectedColor, -1)} className="btn-qty btn"><Minus size={16} /></button>
                          <span className="qty-display">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, item.selectedColor, 1)} className="btn-qty btn"><Plus size={16} /></button>
                        </div>
                        <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'4px' }}>
                          <div className="item-total-price" style={{ color: item.discount_percent > 0 ? 'var(--success)' : 'inherit' }}>
                            {formatPrice(parseFloat(item.price) * item.quantity)}
                          </div>
                          {item.discount_percent > 0 && (
                            <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                              <span style={{ fontSize:'12px', color:'var(--text-muted)', textDecoration:'line-through' }}>
                                {formatPrice(parseFloat(item.original_price || item.price) * item.quantity)}
                              </span>
                              <span style={{ fontSize:'10px', fontWeight:800, background:'var(--danger-bg)', color:'var(--danger)', padding:'2px 6px', borderRadius:'4px' }}>
                                -{item.discount_percent}%
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Summary column ── */}
          <div className="cart-summary-section">
            <div className="cart-summary-card animate-fade-in" style={{ animationDelay:'0.3s', animationFillMode:'both' }}>
              <h3 className="cart-summary-title">Order Summary</h3>

              {siteSettings?.allowDoorToDoorDelivery !== false && Number(siteSettings?.doorToDoorThreshold || 0) > 0 && (
                <div style={{ marginBottom: '20px', padding: '14px', borderRadius: '12px', background: 'var(--bg-main)', border: '1px solid var(--border-light)', fontSize: '13px' }}>
                  {(() => {
                    const threshold = Number(siteSettings?.doorToDoorThreshold || 0);
                    const diff = threshold - selectedSubtotal;
                    if (diff > 0) {
                      const pct = Math.min(100, (selectedSubtotal / threshold) * 100);
                      return (
                        <>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Door-to-Door Delivery</span>
                            <span style={{ fontWeight: 600, color: 'var(--primary-blue)' }}>Add {formatPrice(diff)}</span>
                          </div>
                          <div style={{ height: '6px', background: 'var(--bg-surface)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${pct}%`, background: 'var(--primary-blue)', transition: 'width 0.3s', borderRadius: '3px' }}></div>
                          </div>
                        </>
                      );
                    } else {
                      return <div style={{ color: 'var(--success)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}><CheckSquare size={16} /> Eligible for Door-to-Door Delivery!</div>;
                    }
                  })()}
                </div>
              )}

              <div className="summary-rows">
                <div className="summary-row">
                  <span className="text-muted">Subtotal ({selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''})</span>
                  <span className="font-bold">{formatPrice(selectedSubtotal)}</span>
                </div>
                <div className="summary-row">
                  <span className="text-muted">Estimated Tax ({vatRate}%)</span>
                  <span className="font-bold">{formatPrice(tax)}</span>
                </div>
                <div className="summary-row">
                  <span className="text-muted">Shipping</span>
                  <span className="text-success">FREE</span>
                </div>

                {appliedCoupon && (
                  <div className="animate-fade-in" style={{ display:'flex', justifyContent:'space-between', fontSize:'14px', color:'var(--danger)', background:'var(--danger-bg)', padding:'8px 12px', borderRadius:'8px', marginBottom:'12px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'6px' }}><Tag size={14} /><span>Promo Code ({appliedCoupon.code})</span></div>
                    <span>-{formatPrice(couponDiscount)}</span>
                  </div>
                )}
                {hasLoyalty && (
                  <div className="animate-fade-in" style={{ display:'flex', justifyContent:'space-between', fontSize:'14px', color:'var(--danger)', background:'var(--danger-bg)', padding:'8px 12px', borderRadius:'8px', marginBottom:'12px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'6px' }}><ShieldCheck size={14} /><span>Loyalty Reward ({intPct}%)</span></div>
                    <span>-{formatPrice(loyaltyAmt)}</span>
                  </div>
                )}

                <div className="summary-divider-line" />
                <div className="summary-total-row">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>

              {/* Coupon form */}
              <div style={{ marginTop:'20px', paddingTop:'20px', borderTop:'1px dashed var(--border-light)' }}>
                {!appliedCoupon ? (
                  <div style={{ marginTop:'20px' }}>
                    <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
                      <input
                        type="text" value={couponInput}
                        onChange={e => setCouponInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); applyCoupon(couponInput).then(ok => ok && setCouponInput('')); } }}
                        placeholder="Promo Code" className="input-premium"
                        style={{ flex:1, padding:'12px 16px', height:'48px', fontSize:'14px', color:'var(--text-main)', background:'var(--bg-surface)' }}
                      />
                      <button
                        onClick={() => applyCoupon(couponInput).then(ok => ok && setCouponInput(''))}
                        disabled={isApplyingCoupon || !couponInput.trim()}
                        className="btn-primary"
                        style={{ padding:'0 24px', height:'48px', fontSize:'14px', borderRadius:'12px', whiteSpace:'nowrap' }}
                      >
                        {isApplyingCoupon ? '...' : 'Apply'}
                      </button>
                    </div>
                    {couponError && <div style={{ color:'var(--danger)', fontSize:'12px', marginTop:'8px' }}>{couponError}</div>}
                  </div>
                ) : (
                  <div style={{ marginTop:'20px' }}>
                    <button onClick={removeCoupon} className="btn-outline" style={{ width:'100%', fontSize:'13px', padding:'10px', color:'var(--danger)', borderColor:'var(--danger)' }}>
                      Remove Coupon
                    </button>
                  </div>
                )}
              </div>

              {/* Checkout button */}
              {!user ? (
                <button className="btn-primary btn-checkout-summary btn" onClick={() => openAuthModal('signin')}>
                  Login to Checkout
                </button>
              ) : (
                <button
                  className="btn-primary btn-checkout-summary btn"
                  onClick={handleCheckout}
                  disabled={noneSelected}
                  style={{ opacity: noneSelected ? 0.5 : 1, cursor: noneSelected ? 'not-allowed' : 'pointer' }}
                >
                  {allSelected
                    ? `Checkout All (${selectedItems.length})`
                    : `Checkout Selected (${selectedItems.length})`
                  }
                </button>
              )}

              <div className="secure-checkout-text">Secure SSL Encrypted Checkout</div>
              <div style={{ marginTop:'10px', fontSize:'12px', color:'var(--text-muted)', textAlign:'center', lineHeight:1.5 }}>
                Tip: your cart is saved to your account and syncs across all your devices.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Remove confirmation modal ── */}
      {confirmDelete && (
        <div className="modal-overlay" style={{ position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.7)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:3000, padding:'20px' }}>
          <div className="card glass animate-scale-in" style={{ maxWidth:'450px', width:'100%', padding:'32px', textAlign:'center', position:'relative', border:'1px solid var(--primary-blue)' }}>
            <button onClick={() => setConfirmDelete(null)} style={{ position:'absolute', top:'16px', right:'16px', background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer' }}>
              <X size={24} />
            </button>
            <div style={{ width:'64px', height:'64px', background:'var(--danger-bg)', color:'var(--danger)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 24px' }}>
              <AlertCircle size={32} />
            </div>
            <h2 style={{ fontSize:'24px', fontWeight:800, marginBottom:'12px' }}>Remove Item?</h2>
            <p style={{ color:'var(--text-muted)', lineHeight:'1.6', marginBottom:'32px' }}>
              Would you like to move <strong>{confirmDelete.name}</strong> to your wishlist for later, or remove it entirely?
            </p>
            <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
              <button className="btn-primary" onClick={handleMoveToWishlist} style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:'10px' }}>
                <Heart size={18} fill="white" /> Move to Wishlist
              </button>
              <button className="btn-outline" onClick={handleFinalDelete} style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:'10px', color:'var(--danger)', borderColor:'var(--danger-bg)' }}>
                <Trash2 size={18} /> Remove Permanently
              </button>
              <button className="btn-secondary" onClick={() => setConfirmDelete(null)} style={{ width:'100%', marginTop:'8px' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
