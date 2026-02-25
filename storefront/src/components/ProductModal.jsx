import React, { useState } from 'react';
import { X, Plus, Minus, ShoppingCart, Heart, FileText, Info, List, Settings, Star } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useSettings } from '../context/SettingsContext';

export default function ProductModal({ product, products = [], isOpen, onClose, onAddToCart, onAddToWishlist, onProductClick }) {
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState(product?.colors?.[0] || 'Default');
  const [activeImage, setActiveImage] = useState(product?.image);
  const { isInWishlist } = useWishlist();
  const { formatPrice } = useSettings();

  React.useEffect(() => {
    if (product) {
      setActiveImage(product.image);
      setQuantity(1);
      setSelectedColor(product.colors?.[0] || 'Default');
    }
  }, [product]);

  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen || !product) return null;

  const inWishlist = isInWishlist(product.id);
  const gallery = Array.isArray(product.gallery) ? product.gallery : [];
  const allImages = Array.from(new Set([product.image, ...gallery].filter(Boolean))).slice(0, 4);

  // Get related products (same category, excluding current product)
  const related = products
    .filter(p => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  const handleAddToCart = () => {
    setIsAdding(true);
    onAddToCart(product, quantity, selectedColor);
    setTimeout(() => setIsAdding(false), 2000);
  };

  const handleAddToWishlist = () => {
    setIsSaving(true);
    onAddToWishlist(product);
    setTimeout(() => setIsSaving(false), 1000);
  };

  return (
    <div className={`modal-backdrop active`} onClick={onClose}>
      <div className="product-modal modal glass animate-scale-in" onClick={(e) => e.stopPropagation()} style={{ position: 'relative' }}>
        <button 
          className="btn-secondary close-button" 
          onClick={onClose} 
          style={{ 
            position: 'absolute', 
            top: '20px', 
            right: '20px', 
            width: '36px', 
            height: '36px', 
            padding: 0, 
            borderRadius: '50%',
            zIndex: 10
          }}
        >
          <X size={20} />
        </button>
        
        <div className="product-modal-content">
          {/* Left Column: Image & Actions */}
          <div className="product-modal-image">
            {/* Main Image View Area */}
            <div className="modal-gallery-layout">
              {/* Vertical Sidebar Thumbnails */}
              {allImages.length > 1 && (
                <div className="modal-thumbnails-sidebar">
                  {allImages.map((img, idx) => (
                    <div 
                      key={idx}
                      className={`thumbnail-item ${activeImage === img ? 'active' : ''}`}
                      onClick={() => setActiveImage(img)}
                    >
                      <img src={img} alt={`View ${idx + 1}`} />
                    </div>
                  ))}
                </div>
              )}

              {/* Primary Image Stage */}
              <div className="modal-image-stage">
                {activeImage ? (
                  <img 
                    src={activeImage} 
                    alt={product.name} 
                    className="stage-image animate-fade-in"
                    key={activeImage}
                  />
                ) : (
                  <div className="image-placeholder"></div>
                )}
              </div>
            </div>

            {/* Config & Actions Group */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
              {/* Quantity & Color Row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '20px', alignItems: 'flex-end' }}>
                <div className="detail-section">
                  <label style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>Quantity</label>
                  <div className="quantity-selector" style={{ background: 'var(--bg-surface-secondary)', padding: '4px', borderRadius: '12px' }}>
                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))}><Minus size={14} /></button>
                    <span style={{ margin: '0 12px', fontWeight: 700 }}>{quantity}</span>
                    <button onClick={() => setQuantity(quantity + 1)}><Plus size={14} /></button>
                  </div>
                </div>

                {product.colors && product.colors.length > 0 && (
                  <div className="detail-section">
                    <label style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>Color</label>
                    <div className="color-swatches">
                      {product.colors.map(color => (
                        <button 
                          key={color} 
                          className={`color-swatch ${selectedColor === color ? 'active' : ''}`}
                          style={{ backgroundColor: color.toLowerCase(), width: '28px', height: '28px' }}
                          onClick={() => setSelectedColor(color)}
                          title={color}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Side-by-Side Primary Actions */}
              <div className="modal-primary-actions">
                <button 
                  className={`btn-primary ${isAdding ? 'animate-pulse-success' : ''}`}
                  onClick={handleAddToCart}
                  disabled={isAdding}
                  style={{ 
                    flex: 1.5, 
                    padding: '14px 10px', 
                    borderRadius: '14px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    gap: '8px',
                    fontSize: '14px',
                    fontWeight: 700,
                    boxShadow: isAdding ? '0 4px 20px rgba(16, 185, 129, 0.4)' : '0 4px 12px rgba(59, 130, 246, 0.2)',
                    background: isAdding ? 'var(--success)' : 'var(--primary-blue)',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                  }}
                >
                  <ShoppingCart size={18} className={isAdding ? 'animate-scale-in' : ''} />
                  {isAdding ? 'Added!' : 'Add to Cart'}
                </button>
                <button 
                  className={`btn-outline ${inWishlist ? 'active' : ''} ${isSaving ? 'animate-scale-in' : ''}`}
                  onClick={handleAddToWishlist}
                  style={{
                    flex: 1,
                    padding: '14px 10px',
                    borderRadius: '14px',
                    background: inWishlist ? 'var(--danger-bg)' : 'var(--bg-surface)',
                    color: inWishlist ? 'var(--danger)' : 'var(--primary-blue)',
                    borderColor: inWishlist ? 'var(--danger)' : 'var(--border-light)',
                    display: 'flex',
                    alignItems: 'center', 
                    justifyContent: 'center',
                    gap: '8px',
                    fontSize: '14px',
                    fontWeight: 600,
                    border: '1px solid',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <Heart size={18} fill={inWishlist ? "var(--danger)" : "none"} className={isSaving ? 'animate-scale-in' : ''} />
                  {isSaving ? (inWishlist ? 'Saved!' : 'Removed!') : (inWishlist ? 'Favorite' : 'Save')}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Info & Details */}
          <div className="product-modal-details" style={{ scrollBehavior: 'smooth' }}>
            <h2 className="product-title" style={{ fontSize: '32px', marginBottom: '8px' }}>{product.name}</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '24px' }}>
                <p className="product-price" style={{ fontSize: '28px', margin: 0 }}>{formatPrice(product.price)}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--warning-bg)', padding: '6px 14px', borderRadius: '100px' }}>
                    <div style={{ display: 'flex', gap: '2px' }}>
                        {[1, 2, 3, 4, 5].map(s => (
                            <Star 
                                key={s} 
                                size={14} 
                                fill={s <= Math.round(product.rating || 5) ? "var(--warning)" : "transparent"} 
                                color={s <= Math.round(product.rating || 5) ? "var(--warning)" : "var(--text-muted)"} 
                            />
                        ))}
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--warning)' }}>{(parseFloat(product.rating) || 5.0).toFixed(1)}</span>
                </div>
            </div>
            
            <div style={{ borderTop: '1px solid var(--border-light)', margin: '20px 0' }}></div>


            <div className="product-info-tabs">
              <div className="info-tab">
                <h3><FileText size={16} /> Documentation</h3>
                <p>Full usage guide and safety documentation available for download.</p>
                <a href="#" className="docs-link">Download PDF</a>
              </div>
              
              <div className="info-tab">
                <h3><List size={16} /> Included Items</h3>
                <ul>
                  {product.included?.map((item, i) => <li key={i}>{item}</li>) || (
                    <>
                      <li>Main Unit</li>
                      <li>Charging Cable</li>
                      <li>User Manual</li>
                    </>
                  )}
                </ul>
              </div>

              <div className="info-tab">
                <h3><Settings size={16} /> Technical Specs & User Guide</h3>
                
                {/* Specifications Grid */}
                <div className="specs-grid" style={{ marginBottom: '20px' }}>
                  {Object.entries(product.specs || {
                    Model: 'PR-2024-X',
                    Weight: '1.2kg',
                    Battery: 'Up to 12h',
                    Warranty: '2 Years'
                  }).map(([key, value]) => (
                    <div key={key} className="spec-item">
                      <span className="spec-key">{key}</span>
                      <span className="spec-value">{value}</span>
                    </div>
                  ))}
                </div>

                {/* Directions / PDF Section */}
                <div style={{ padding: '16px', background: 'var(--bg-surface-secondary)', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Info size={14} /> Usage Directions
                  </h4>
                  {product.directions && (product.directions.startsWith('http') || product.directions.endsWith('.pdf')) ? (
                    <div>
                      <p style={{ marginBottom: '12px', fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                        A detailed PDF user guide is available with full technical instructions.
                      </p>
                      <a 
                        href={product.directions} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="btn-primary" 
                        style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: '8px', 
                          padding: '10px 16px', 
                          fontSize: '13px',
                          textDecoration: 'none',
                          width: '100%',
                          justifyContent: 'center'
                        }}
                      >
                        <FileText size={16} />
                        Download User Guide (PDF)
                      </a>
                    </div>
                  ) : (
                    <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.5 }}>
                      {product.directions || 'Connect the device to a power source and follow the initial setup wizard on first launch.'}
                    </p>
                  )}
                </div>
              </div>

              {/* Related Products Section */}
              {related.length > 0 && (
                <div className="related-products-section">
                  <h3>Frequently Bought Together</h3>
                  <div className="related-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '16px' }}>
                    {related.map(rp => (
                      <div key={rp.id} className="related-card" onClick={() => {
                          if (onProductClick) onProductClick(rp);
                          // Scroll internal details container to top
                          const details = document.querySelector('.product-modal-details');
                          if (details) details.scrollTop = 0;
                      }}>
                        <img src={rp.image} alt={rp.name} />
                        <h4>{rp.name}</h4>
                        <p>{formatPrice(rp.price)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
