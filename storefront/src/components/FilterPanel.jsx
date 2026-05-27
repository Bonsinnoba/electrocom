import React from 'react';
import { Filter, X, RotateCcw, Star, Check } from 'lucide-react';

export default function FilterPanel({ filters, setFilters, onReset, isMobile, onClose, categories = [], maxRange = 1000, priceValue, onPriceChange }) {

  const handleCategoryChange = (cat) => {
    setFilters(prev => {
      const exists = prev.categories.includes(cat);
      if (exists) {
        return { ...prev, categories: prev.categories.filter(c => c !== cat) };
      } else {
        return { ...prev, categories: [...prev.categories, cat] };
      }
    });
  };

  const handleRatingChange = (rating) => {
    setFilters(prev => ({ ...prev, minRating: rating }));
  };

  const handleDiscountChange = (discount) => {
    setFilters(prev => ({ ...prev, minDiscount: discount }));
  };

  return (
    <div className={`filter-panel ${isMobile ? 'mobile' : ''}`} style={{
      display: 'flex',
      flexDirection: 'column',
      gap: isMobile ? '20px' : '24px',
      height: '100%',
      padding: isMobile ? '0 8px' : '24px'
    }}>
      {isMobile && <div className="drawer-handle" style={{
        width: '40px',
        height: '4px',
        background: 'var(--border-light)',
        borderRadius: '2px',
        margin: '-20px auto 10px',
        opacity: 0.6
      }} />}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px', fontSize: '18px', fontWeight: 800, color: 'var(--text-main)' }}>
          <Filter size={18} /> Filters
        </h3>
        {isMobile && (
          <button 
            className="btn-secondary" 
            onClick={onClose} 
            style={{ 
              width: '32px', 
              height: '32px', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              padding: 0
            }}
          >
            <X size={18} />
          </button>
        )}
      </div>

      <div className="filter-group">
        <label style={{ display: 'block', marginBottom: '14px', fontSize: '13px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Category</label>
        <div className="category-scroll-container" style={{
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: '6px',
          paddingBottom: '0',
          margin: '0 -30px',
        }}>
          {categories.map(cat => {
            const isActive = filters.categories.includes(cat);
            return (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                className={`filter-pill ${isActive ? 'active' : ''}`}
                style={{
                  width: 'auto',
                  padding: isMobile ? (isActive ? '10px 16px 10px 14px' : '10px 20px') : (isActive ? '6px 16px 6px 14px' : '8px 45px'),
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  fontSize: '14px',
                  flexShrink: 0,
                  borderRadius: '12px',
                  transition: 'all 0.2s ease',
                  margin: '2px'
                }}
              >
                {isActive && <Check size={14} strokeWidth={3} style={{ color: 'var(--primary-blue)' }} />}
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      <div className="filter-group" style={{ margin: '0 -30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px', alignItems: 'center', margin: '0 15px' }}>
          <label style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '10px' }}>Price Range</label>
        </div>

        {/* Min / Max Inputs */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '16px', margin: '0 6px' }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', flex: 1 }}>
            <span style={{ 
              position: 'absolute', 
              left: '10px', 
              color: 'var(--text-muted)', 
              fontWeight: 800,
              fontSize: '11px',
              pointerEvents: 'none',
              textTransform: 'uppercase'
            }}>Min</span>
            <input 
              type="number"
              min="0"
              max={maxRange}
              value={filters.minPrice}
              onChange={(e) => {
                const val = e.target.value === '' ? 0 : parseInt(e.target.value);
                setFilters(prev => ({ ...prev, minPrice: Math.max(0, val) }));
              }}
              style={{
                width: '100%',
                padding: '8px 15px 8px 40px',
                borderRadius: '12px',
                border: '1.5px solid var(--border-light)',
                background: 'var(--bg-surface-secondary)',
                fontSize: '14px',
                fontWeight: 700,
                color: 'var(--text-main)',
                outline: 'none',
                transition: 'border-color 0.2s',
                WebkitAppearance: 'none'
              }}
            />
          </div>

          <span style={{ color: 'var(--text-muted)', fontWeight: 700 }}>-</span>

          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', flex: 1 }}>
            <span style={{ 
              position: 'absolute', 
              left: '10px', 
              color: 'var(--text-muted)', 
              fontWeight: 800,
              fontSize: '11px',
              pointerEvents: 'none',
              textTransform: 'uppercase'
            }}>Max</span>
            <input 
              type="number"
              min="0"
              max={maxRange}
              value={priceValue !== undefined ? priceValue : filters.maxPrice}
              onChange={(e) => {
                const val = e.target.value === '' ? '' : parseInt(e.target.value);
                if (val === '') {
                  onPriceChange?.('');
                } else {
                  onPriceChange?.(Math.max(0, Math.min(val, maxRange)));
                }
              }}
              onBlur={() => {
                const finalVal = priceValue === '' ? maxRange : priceValue;
                onPriceChange?.(finalVal);
                setFilters(prev => ({ ...prev, maxPrice: finalVal }));
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const finalVal = priceValue === '' ? maxRange : priceValue;
                  onPriceChange?.(finalVal);
                  setFilters(prev => ({ ...prev, maxPrice: finalVal }));
                }
              }}
              style={{
                width: '100%',
                padding: '8px 18px 8px 40px',
                borderRadius: '12px',
                border: '1.5px solid var(--border-light)',
                background: 'var(--bg-surface-secondary)',
                fontSize: '14px',
                fontWeight: 700,
                color: 'var(--text-main)',
                outline: 'none',
                transition: 'border-color 0.2s',
                WebkitAppearance: 'none'
              }}
            />
          </div>
        </div>

        <div className="slider-wrapper" style={{ position: 'relative', padding: '0 2px', margin: '0 6px' }}>
          <input 
            type="range" 
            min="0" 
            max={maxRange} 
            step="1"
            value={priceValue !== undefined ? priceValue : filters.maxPrice}
            onChange={(e) => onPriceChange?.(parseInt(e.target.value))}
            onMouseUp={() => setFilters(prev => ({ ...prev, maxPrice: priceValue !== undefined ? priceValue : filters.maxPrice }))}
            onTouchEnd={() => setFilters(prev => ({ ...prev, maxPrice: priceValue !== undefined ? priceValue : filters.maxPrice }))}
            className="filter-range-slider"
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>
            <span>GH₵0</span>
            <span>GH₵{maxRange}</span>
          </div>
        </div>
      </div>

      <div className="filter-group" style={{ margin: '0 -30px' }}>
        <label style={{ display: 'block', marginBottom: '18px', fontSize: '14px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 15px' }}>Min Rating</label>
        <div style={{
          display: 'flex',
          gap: isMobile ? '6px' : '4px',
          background: 'var(--bg-surface-secondary)',
          padding: isMobile ? '12px' : '4px 100px',
          borderRadius: '16px',
          border: '1.5px solid var(--border-light)',
          justifyContent: 'center',
          margin: '0 6px'
        }}>
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star}
              onClick={() => handleRatingChange(star)}
              className={`rating-btn ${filters.minRating >= star ? 'active' : ''}`}
              style={{
                background: 'transparent',
                border: 'none',
                padding: isMobile ? '6px' : '6px',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: filters.minRating >= star ? 'scale(1.1)' : 'scale(1)',
                filter: filters.minRating >= star ? 'drop-shadow(0 2px 8px rgba(251, 191, 36, 0.4))' : 'none'
              }}
            >
              <Star 
                size={isMobile ? 24 : 22} 
                fill={filters.minRating >= star ? "var(--warning)" : "none"} 
                stroke={filters.minRating >= star ? "var(--warning)" : "var(--text-muted)"}
                strokeWidth={2.5}
                style={{
                  transition: 'all 0.3s ease'
                }}
              />
            </button>
          ))}
        </div>
        {filters.minRating > 0 && (
          <div style={{ 
            marginTop: '10px', 
            textAlign: 'center', 
            fontSize: '13px', 
            fontWeight: 600,
            color: 'var(--warning)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}>
            <Star size={14} fill="var(--warning)" stroke="var(--warning)" />
            {filters.minRating}+ stars and above
          </div>
        )}
      </div>

      <div className="filter-group" style={{ margin: '0 -30px' }}>
        <label style={{ display: 'block', marginBottom: '18px', fontSize: '14px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 15px' }}>Min Discount</label>
        <div style={{
          display: 'flex',
          gap: isMobile ? '6px' : '4px',
          flexWrap: 'wrap',
          margin: '0 6px'
        }}>
          {[0, 10, 20, 30, 50].map(discount => (
            <button
              key={discount}
              onClick={() => handleDiscountChange(discount)}
              className={`discount-btn ${filters.minDiscount >= discount ? 'active' : ''}`}
              style={{
                background: filters.minDiscount >= discount ? 'var(--primary-blue)' : 'var(--bg-surface-secondary)',
                color: filters.minDiscount >= discount ? 'white' : 'var(--text-main)',
                border: filters.minDiscount >= discount ? '1px solid var(--primary-blue)' : '1px solid var(--border-light)',
                padding: isMobile ? '8px 12px' : '8px 16px',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                flex: '1',
                minWidth: isMobile ? '60px' : '80px'
              }}
            >
              {discount === 0 ? 'All' : `${discount}%+`}
            </button>
          ))}
        </div>
        {filters.minDiscount > 0 && (
          <div style={{
            marginTop: '10px',
            textAlign: 'center',
            fontSize: '13px',
            fontWeight: 600,
            color: 'var(--success)',
            margin: '0 6px'
          }}>
            {filters.minDiscount}% discount and above
          </div>
        )}
      </div>

      <div className="filter-group" style={{ margin: '0 -30px' }}>
        <label style={{ display: 'block', marginBottom: '18px', fontSize: '14px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 15px' }}>Availability</label>
        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          cursor: 'pointer',
          color: 'var(--text-main)',
          fontSize: '14px',
          fontWeight: 600,
          userSelect: 'none',
          margin: '0 6px'
        }}>
          <input 
            type="checkbox" 
            checked={filters.inStockOnly} 
            onChange={(e) => setFilters(prev => ({ ...prev, inStockOnly: e.target.checked }))}
            style={{
              width: '18px',
              height: '18px',
              borderRadius: '6px',
              accentColor: 'var(--primary-blue)',
              cursor: 'pointer'
            }}
          />
          Show In-Stock Only
        </label>
      </div>

      <div style={{ 
        display: 'flex', 
        flexDirection: isMobile ? 'row' : 'column', 
        gap: '12px', 
        marginTop: isMobile ? '12px' : 'auto' 
      }}>
        <button 
          className="btn-secondary" 
          onClick={onReset}
          style={{ 
            flex: isMobile ? 1 : 'none',
            width: isMobile ? 'auto' : '100%', 
            gap: '8px', 
            padding: '12px',
            borderRadius: '16px',
            fontWeight: 700,
            border: '1.5px solid var(--border-light)',
            fontSize: '14px'
          }}
        >
          <RotateCcw size={16} /> Reset
        </button>

        {isMobile && (
          <button 
            className="btn-primary" 
            onClick={onClose}
            style={{ 
              flex: 2,
              padding: '12px',
              borderRadius: '16px',
              fontWeight: 800,
              fontSize: '14px'
            }}
          >
            Apply Filters
          </button>
        )}
      </div>
    </div>
  );
}
